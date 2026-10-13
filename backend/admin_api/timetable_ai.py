"""AI-powered timetable generator using Gemini 1.5 Flash."""
import json
import logging
import re

from django.conf import settings

logger = logging.getLogger(__name__)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _strip_fences(text):
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _build_prompt(constraints, classes, teachers):
    return f"""You are a school timetable generator.

Generate a weekly timetable as STRICT JSON. No prose. No markdown fences.

CONSTRAINTS:
- Working days: {', '.join(constraints['working_days'])}
- Day starts: {constraints['start_time']}
- Day ends: {constraints['end_time']}
- Period length: {constraints['period_minutes']} minutes
- Periods per day: {constraints['periods_per_day']}
- Break after period {constraints['break_after_period']} for {constraints['break_minutes']} minutes

CLASSES:
{json.dumps(classes, indent=2)}

TEACHERS:
{json.dumps(teachers, indent=2)}

HARD RULES:
1. A teacher appears in only ONE slot per (day, period).
2. Each class gets exactly its periods_per_week slots.
3. Respect each teacher's unavailable_slots.
4. No class double-booked in same (day, period).

OUTPUT (JSON array):
[
  {{ "class_id": "...", "day_of_week": 0, "period": 1, "start_time": "08:00", "end_time": "08:45", "teacher_id": "..." }}
]
day_of_week: Monday=0..Sunday=6. period: 1-indexed.
"""


def generate_timetable(constraints, classes, teachers):
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        logger.warning("GEMINI_API_KEY missing — fallback.")
        return _fallback_roundrobin(constraints, classes, teachers), "fallback"

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = _build_prompt(constraints, classes, teachers)
        resp = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.4,
            },
        )
        raw = _strip_fences(resp.text or "")
        data = json.loads(raw)
        if not isinstance(data, list):
            return [], "AI returned non-list JSON"
        return data, None
    except Exception as e:
        logger.exception("Timetable AI failed: %s", e)
        return _fallback_roundrobin(constraints, classes, teachers), f"fallback ({e})"


def _fallback_roundrobin(constraints, classes, teachers):
    working_days = constraints.get("working_days") or DAYS[:5]
    periods_per_day = int(constraints.get("periods_per_day") or 6)
    start_minutes = _to_minutes(constraints.get("start_time") or "08:00")
    period_minutes = int(constraints.get("period_minutes") or 45)
    break_after = int(constraints.get("break_after_period") or 0)
    break_minutes = int(constraints.get("break_minutes") or 0)

    teacher_busy = {t["id"]: set() for t in teachers}
    class_busy = {c["id"]: set() for c in classes}
    slots = []

    for cls in classes:
        remaining = int(cls.get("periods_per_week") or 5)
        tid = cls.get("teacher_id")
        for day_idx, _ in enumerate(working_days):
            for period in range(1, periods_per_day + 1):
                if remaining <= 0:
                    break
                key = (day_idx, period)
                if key in teacher_busy.get(tid, set()):
                    continue
                if key in class_busy[cls["id"]]:
                    continue
                offset_periods = period - 1
                extra_break = break_minutes if (break_after and period > break_after) else 0
                start = start_minutes + offset_periods * period_minutes + extra_break
                end = start + period_minutes
                slots.append({
                    "class_id": cls["id"],
                    "day_of_week": day_idx,
                    "period": period,
                    "start_time": _from_minutes(start),
                    "end_time": _from_minutes(end),
                    "teacher_id": tid,
                })
                teacher_busy.setdefault(tid, set()).add(key)
                class_busy[cls["id"]].add(key)
                remaining -= 1
            if remaining <= 0:
                break
    return slots


def _to_minutes(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _from_minutes(total):
    return f"{total // 60:02d}:{total % 60:02d}"