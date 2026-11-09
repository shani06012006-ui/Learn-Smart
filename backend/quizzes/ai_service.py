# backend/quizzes/ai_service.py
"""
Quiz generation from PDF text using a free AI provider.

Providers (set AI_PROVIDER in .env):
  - "gemini": Google Gemini free tier (needs GEMINI_API_KEY)
  - "ollama": local model via Ollama (needs Ollama running on this PC)

Uses only the Python standard library for HTTP, so no new packages are needed.
"""
import io
import json
import logging
import re
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

CHOICES_PER_QUESTION = 4
REQUEST_TIMEOUT_SECONDS = 120


class AIServiceError(Exception):
    """Raised when quiz generation cannot complete. The message is safe to show teachers."""


# ---------------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------------

def extract_pdf_text(file_bytes: bytes, max_chars: int = 15000) -> str:
    """Extract plain text from a PDF's bytes. Raises AIServiceError on failure."""
    from pypdf import PdfReader  # lazy import: a missing package fails here, not at startup

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        parts, total = [], 0
        for page in reader.pages:
            text = (page.extract_text() or "").strip()
            if text:
                parts.append(text)
                total += len(text)
            if total >= max_chars:
                break
        return "\n".join(parts)[:max_chars].strip()
    except Exception as exc:
        logger.exception("PDF text extraction failed")
        raise AIServiceError("Could not read text from this PDF.") from exc


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_quiz_from_text(text, question_count, difficulty, title=""):
    """
    Ask the configured free AI provider for multiple-choice questions.

    Returns a list of normalized dicts:
        {"question": str, "choices": [{"text": str, "is_correct": bool} x4], "explanation": str}

    Raises AIServiceError on any failure. It never returns placeholder questions.
    """
    provider = str(getattr(settings, "AI_PROVIDER", "gemini")).lower().strip()
    prompt = _build_prompt(text, question_count, difficulty, title)

    if provider == "gemini":
        raw = _call_gemini(prompt)
    elif provider == "ollama":
        raw = _call_ollama(prompt)
    else:
        raise AIServiceError(
            f"Unknown AI_PROVIDER '{provider}'. Use 'gemini' or 'ollama' in your .env file."
        )

    raw_questions = _parse_json_questions(raw)

    questions = []
    for raw_q in raw_questions:
        normalized = _normalize_question(raw_q)
        if normalized:
            questions.append(normalized)
        else:
            logger.warning("Dropped a malformed AI question: %r", str(raw_q)[:200])

    if not questions:
        raise AIServiceError(
            "The AI did not produce any valid questions. Try again or use a different PDF."
        )

    return questions[:question_count]


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------

def _call_gemini(prompt: str) -> str:
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        raise AIServiceError("GEMINI_API_KEY is not set in your .env file.")

    model = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.5,
            "responseMimeType": "application/json",  # asks Gemini for pure JSON
            "maxOutputTokens": 8192,
        },
    }

    data = _post_json(
        url,
        body,
        headers={"x-goog-api-key": api_key},  # header, not URL, so the key stays out of logs
        service_name="Gemini",
    )

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        # Usually means the prompt was blocked by safety filters
        logger.error("Unexpected Gemini response: %s", str(data)[:500])
        raise AIServiceError(
            "Gemini returned no content for this PDF. Try a different PDF or fewer questions."
        )


def _call_ollama(prompt: str) -> str:
    base_url = getattr(settings, "OLLAMA_URL", "http://localhost:11434").rstrip("/")
    model = getattr(settings, "OLLAMA_MODEL", "llama3.2")

    body = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",  # Ollama's JSON mode
        "options": {"temperature": 0.5},
    }

    data = _post_json(f"{base_url}/api/generate", body, service_name="Ollama")

    text = data.get("response", "")
    if not text:
        raise AIServiceError("Ollama returned an empty response. Check that the model is installed.")
    return text


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def _post_json(url, body, headers=None, service_name="AI"):
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
            return json.loads(resp.read().decode("utf-8"))

    except urllib.error.HTTPError as exc:  # must come before URLError (it's a subclass)
        detail = exc.read().decode("utf-8", errors="replace")
        logger.error("%s HTTP %s: %s", service_name, exc.code, detail[:500])

        # Providers include a readable message in the error body. Show it to the teacher.
        try:
            provider_msg = json.loads(detail).get("error", {}).get("message", "")
        except (json.JSONDecodeError, AttributeError):
            provider_msg = ""
        provider_msg = provider_msg[:200]

        if exc.code == 429:
            raise AIServiceError(
                f"{service_name} free-tier limit reached. Wait a minute and try again, "
                "or generate fewer questions."
            )
        if exc.code == 404:
            raise AIServiceError(
                f"{service_name} model not found. Set GEMINI_MODEL in backend/.env to a "
                f"working model (run check_gemini.py). Details: {provider_msg}"
            )
        if exc.code in (400, 401, 403):
            raise AIServiceError(
                f"{service_name} rejected the request (HTTP {exc.code}). "
                f"Check your API key and model name in .env. Details: {provider_msg}"
            )
        raise AIServiceError(f"{service_name} error (HTTP {exc.code}). {provider_msg}")

    except urllib.error.URLError as exc:
        logger.error("%s unreachable: %s", service_name, exc.reason)
        if service_name == "Ollama":
            raise AIServiceError(
                "Ollama is not running. Start it with 'ollama serve' and try again."
            )
        raise AIServiceError(f"Could not reach {service_name}: {exc.reason}")

    except TimeoutError:
        raise AIServiceError(
            f"{service_name} took too long to respond. Try fewer questions or a shorter PDF."
        )

    except json.JSONDecodeError:
        raise AIServiceError(f"{service_name} returned invalid JSON.")


# ---------------------------------------------------------------------------
# Prompt and parsing
# ---------------------------------------------------------------------------

def _build_prompt(text, question_count, difficulty, title):
    return f"""You are an experienced teacher writing a multiple-choice quiz.

Quiz title: {title}
Difficulty: {difficulty}
Number of questions: {question_count}

Base every question only on the source material below.

Return a JSON object with a single key "questions". Its value is an array of exactly {question_count} objects, each shaped like:
{{
  "question": "The question text",
  "choices": [
    {{"text": "Option 1", "is_correct": false}},
    {{"text": "Option 2", "is_correct": true}},
    {{"text": "Option 3", "is_correct": false}},
    {{"text": "Option 4", "is_correct": false}}
  ],
  "explanation": "Why the correct answer is correct."
}}

Rules:
- Exactly {CHOICES_PER_QUESTION} choices per question.
- Exactly 1 choice per question has "is_correct": true.
- Vary the position of the correct answer.
- Distractors must be plausible but clearly wrong.
- Do not refer to "the passage" or "the PDF". Write standalone questions.
- Output only the JSON object, with no commentary.

SOURCE MATERIAL:
\"\"\"
{text}
\"\"\"
"""


def _parse_json_questions(raw: str):
    """Parse the model's text output into a list of raw question dicts."""
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)  # strip accidental code fences
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("AI output was not valid JSON: %r", cleaned[:500])
        raise AIServiceError("The AI returned an unreadable response. Please try again.") from exc

    raw_questions = payload.get("questions") if isinstance(payload, dict) else payload
    if not isinstance(raw_questions, list):
        raise AIServiceError("The AI response did not contain a list of questions.")
    return raw_questions


def _normalize_question(raw):
    """Return a clean question dict, or None if the AI output is unusable."""
    if not isinstance(raw, dict):
        return None

    question = str(raw.get("question") or raw.get("question_text") or "").strip()

    raw_choices = raw.get("choices") or raw.get("options") or []
    if not isinstance(raw_choices, list):
        return None

    choices = []
    for c in raw_choices:
        if isinstance(c, dict):
            text = str(c.get("text") or c.get("choice_text") or "").strip()
            is_correct = bool(c.get("is_correct"))
        else:
            text, is_correct = str(c).strip(), False
        if text:
            choices.append({"text": text, "is_correct": is_correct})

    if not question or len(choices) != CHOICES_PER_QUESTION:
        return None
    if sum(1 for c in choices if c["is_correct"]) != 1:
        return None

    return {
        "question": question,
        "choices": choices,
        "explanation": str(raw.get("explanation") or "").strip(),
    }