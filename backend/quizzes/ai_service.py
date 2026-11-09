import io
import json
import logging
import re
from django.conf import settings
from openai import OpenAI

logger = logging.getLogger(__name__)

def extract_pdf_text(file_bytes, max_chars=15000):
    """Extract plain text from a PDF file's bytes using pypdf."""
    from pypdf import PdfReader
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        parts = []
        for page in reader.pages:
            text = page.extract_text() or ""
            parts.append(text)
            if sum(len(p) for p in parts) >= max_chars:
                break
        return "\n".join(parts).strip()[:max_chars]
    except Exception as exc:
        logger.error(f"PDF extraction failed: {exc}")
        raise Exception("Failed to read PDF text.")

def generate_quiz_from_text(text, question_count, difficulty, title=""):
    """Generate quiz using OpenAI GPT-4o-mini."""
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set; returning stub questions.")
        return _stub_questions(question_count)

    try:
        client = OpenAI(api_key=api_key)
        
        prompt = f"""You are an expert teacher creating a multiple-choice quiz.
Title: {title}
Difficulty: {difficulty}
Number of questions: {question_count}

Return STRICTLY a JSON array. No prose, no markdown fences.
Each element must match this shape exactly:
[
  {{
    "question": "Full question text here",
    "choices": [
      {{"text": "Option A", "is_correct": false}},
      {{"text": "Option B", "is_correct": true}},
      {{"text": "Option C", "is_correct": false}},
      {{"text": "Option D", "is_correct": false}}
    ],
    "explanation": "Why the correct answer is correct."
  }}
]

Rules:
- Exactly 4 choices per question.
- Exactly 1 choice marked is_correct=true.
- Mix the position of the correct answer (A, B, C, D).
- Base every question on this SOURCE MATERIAL:
\"\"\"
{text}
\"\"\"
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output JSON. Ensure the output is a JSON object with a single key 'questions' which contains the array."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )

        raw_json = response.choices[0].message.content
        data = json.loads(raw_json)
        
        if isinstance(data, dict) and "questions" in data:
            data = data["questions"]
            
        if not isinstance(data, list):
            raise Exception("OpenAI did not return a list of questions.")

        return data

    except Exception as exc:
        logger.error(f"OpenAI generation failed: {exc}")
        return _stub_questions(question_count)

def _stub_questions(count):
    """Fallback stub questions if OpenAI fails."""
    return [
        {
            "question": f"Sample Question {i+1}: What is the main topic?",
            "choices": [
                {"text": "Option A", "is_correct": True},
                {"text": "Option B", "is_correct": False},
                {"text": "Option C", "is_correct": False},
                {"text": "Option D", "is_correct": False},
            ],
            "explanation": "This is a fallback question because the AI API failed.",
        } for i in range(count)
    ]