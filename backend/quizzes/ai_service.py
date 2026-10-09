"""PDF extraction + Gemini-powered quiz generation.

If GEMINI_API_KEY is missing or the call fails, falls back to a stub
generator so the entire UI flow stays testable end-to-end.
"""
import io
import json
import logging
import re

from django.conf import settings

logger = logging.getLogger(__name__)


def extract_pdf_text(file_bytes, max_chars=20000):
    """Extract plain text from a PDF file's bytes using pypdf."""
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(file_bytes))
    parts = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            logger.warning("pypdf extract failed on a page: %s", exc)
            text = ""
        parts.append(text)
        if sum(len(p) for p in parts) >= max_chars:
            break
    joined = "\n".join(parts).strip()
    return joined[:max_chars]


def _strip_code_fences(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def generate_quiz_from_text(text, question_count, difficulty, title=""):
    """Return list[dict] in the shape:
    [{"question": str, "choices": [{"text": str, "is_correct": bool}, x4], "explanation": str}]
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        logger.warning("GEMINI_API_KEY not set; returning stub questions.")
        return _stub_questions(question_count, difficulty, reason="no_api_key")

    try:
        import google.generativeai as genai
    except Exception as exc:
        logger.exception("google-generativeai import failed: %s", exc)
        return _stub_questions(question_count, difficulty, reason="sdk_missing")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = _build_prompt(text, question_count, difficulty, title)
        resp = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.6,
            },
        )
        raw = _strip_code_fences(resp.text or "")
        data = json.loads(raw)
        return _normalize(data, question_count)
    except Exception as exc:
        logger.exception("Gemini generation failed: %s", exc)
        return _stub_questions(question_count, difficulty, reason="api_error")


def _build_prompt(text, count, difficulty, title):
    return f"""You are an expert teacher creating a multiple-choice quiz.

Title: {title}
Difficulty: {difficulty}
Number of questions: {count}

Return STRICTLY a JSON array. No prose, no markdown fences.
Each element must match this shape exactly:

[
  {{
    "question": "Full question text here",
    "choices": [
      {{"text": "First option",  "is_correct": false}},
      {{"text": "Second option", "is_correct": false}},
      {{"text": "Third option",  "is_correct": false}},
      {{"text": "Fourth option", "is_correct": true}}
    ],
    "explanation": "Why the correct answer is correct (1-2 sentences)."
  }}
]

Rules:
- Exactly 4 choices per question.
- Exactly 1 choice marked is_correct=true per question.
- Do not repeat the same correct option position (mix A/B/C/D).
- Difficulty levels: easy = recall; medium = comprehension; hard = application; mixed = blend.
- Base every question on the SOURCE MATERIAL below.

SOURCE MATERIAL:
\"\"\"
{text}
\"\"\"
"""


def _normalize(data, target_count):
    if isinstance(data, dict) and "questions" in data:
        data = data["questions"]
    if not isinstance(data, list):
        return _stub_questions(target_count, "mixed", reason="bad_shape")

    out = []
    for item in data[:target_count]:
        if not isinstance(item, dict):
            continue
        q_text = str(item.get("question") or "").strip()
        choices = item.get("choices") or []
        if not q_text or not isinstance(choices, list):
            continue

        cleaned_choices = []
        for c in choices[:4]:
            if isinstance(c, dict):
                c_text = str(c.get("text") or "").strip()
                c_ok = bool(c.get("is_correct"))
            else:
                c_text = str(c).strip()
                c_ok = False
            if c_text:
                cleaned_choices.append({"text": c_text, "is_correct": c_ok})

        while len(cleaned_choices) < 4:
            cleaned_choices.append({"text": f"Option {len(cleaned_choices) + 1}", "is_correct": False})

        if not any(c["is_correct"] for c in cleaned_choices):
            cleaned_choices[0]["is_correct"] = True
        else:
            seen_correct = False
            for c in cleaned_choices:
                if c["is_correct"]:
                    if seen_correct:
                        c["is_correct"] = False
                    else:
                        seen_correct = True

        out.append({
            "question": q_text,
            "choices": cleaned_choices,
            "explanation": str(item.get("explanation") or "").strip(),
        })

    if not out:
        return _stub_questions(target_count, "mixed", reason="empty")
    return out


def _stub_questions(count, difficulty, reason="stub"):
    base = [
        "Which of the following best describes the main concept?",
        "Which statement is correct based on the source material?",
        "What is the most accurate definition of the topic?",
        "Which option best illustrates the principle discussed?",
        "Which example correctly applies the concept?",
        "What is the primary characteristic of the subject?",
        "Which factor has the greatest impact on the outcome?",
        "What is the correct sequence of steps?",
        "Which term matches the description given?",
        "Which of these is NOT part of the process?",
    ]
    out = []
    for i in range(count):
        q = base[i % len(base)]
        out.append({
            "question": f"[Sample {i + 1}] {q}",
            "choices": [
                {"text": "Option A", "is_correct": i % 4 == 0},
                {"text": "Option B", "is_correct": i % 4 == 1},
                {"text": "Option C", "is_correct": i % 4 == 2},
                {"text": "Option D", "is_correct": i % 4 == 3},
            ],
            "explanation": f"Auto-generated placeholder ({reason}). Edit or regenerate.",
        })
    return out