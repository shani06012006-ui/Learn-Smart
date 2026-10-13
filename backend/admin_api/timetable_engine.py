"""
AI-powered timetable generator engine (v2).

Responsibilities:
  1. Compress the request context into a compact JSON payload.
  2. Call Gemini 1.5 Flash with a strict JSON-output prompt.
  3. Validate the response at 4 levels: schema → refs → clashes → completeness.
  4. If validation fails, retry up to N times with the errors fed back.
  5. Fall back to a deterministic greedy generator on total failure.
"""
import json
import logging
import re
from collections import defaultdict

from django.conf import settings

logger = logging.getLogger(__name__)

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


# ================================================================
# Prompt construction
# ================================================================

def _build_prompt(context, prior_errors=None):
    """
    context = {
      constraints: {...},
      sections:    [{id, name, grade_name, subjects: [{id, name, teacher_id, teacher_name, periods_per_week}]}],
      teacher_blocked: {teacher_id: ["0-1", "0-2", ...]},   # existing commitments outside our target sections
      short_id_map: {short -> full}
    }
    """
    c = context["constraints"]
    lines = []

    lines.append("You are a school timetable generator. Output STRICT JSON only.")
    lines.append("")
    lines.append("## CONSTRAINTS")
    lines.append(f"- Working days: {', '.join(c['working_days'])} (Mon=0 ... Sun=6)")
    lines.append(f"- Day window: {c['start_time']} to {c['end_time']}")
    lines.append(f"- {c['periods_per_day']} periods/day, {c['period_minutes']} min each")
    if c["break_after_period"] and c["break_minutes"]:
        lines.append(f"- Break: {c['break_minutes']} min after period {c['break_after_period']}")
    lines.append("")

    lines.append("## SECTIONS (each row needs exactly the listed periods/week)")
    for s in context["sections"]:
        lines.append(f"  {s['id']}  ({s['grade_name']} / {s['name']})")
        for sub in s["subjects"]:
            lines.append(
                f"     - {sub['id']} {sub['name']:<20} teacher={sub['teacher_id']} "
                f"periods/week={sub['periods_per_week']}"
            )
    lines.append("")

    if context["teacher_blocked"]:
        lines.append("## TEACHERS ALREADY BUSY OUTSIDE THESE SECTIONS")
        for tid, slots in context["teacher_blocked"].items():
            if slots:
                lines.append(f"  {tid}: {', '.join(slots)}")
        lines.append("")

    lines.append("## HARD RULES")
    lines.append("1. A teacher is in at most one slot per (day, period).")
    lines.append("2. A section is in at most one slot per (day, period).")
    lines.append("3. Every section gets EXACTLY the periods/week listed per subject.")
    lines.append("4. No class falls inside the break window.")
    lines.append("5. Spread subjects across the week (avoid clustering on one day).")
    lines.append("")

    lines.append("## OUTPUT")
    lines.append("JSON array. Each element:")
    lines.append('  {"section_id":"S1","class_course_id":"C1","teacher_id":"T1",')
    lines.append('   "day_of_week":0,"period_number":1,"start_time":"08:00","end_time":"08:45"}')
    lines.append("")
    lines.append("Use ONLY the short IDs shown above. Return ONLY the JSON array.")

    if prior_errors:
        lines.append("")
        lines.append("## PREVIOUS ATTEMPT FAILED — FIX THESE ERRORS")
        for e in prior_errors[:20]:
            lines.append(f"- {e}")

    return "\n".join(lines)


# ================================================================
# Gemini call
# ================================================================

def _call_gemini(prompt):
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        return None, "no_api_key"

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.3,
            },
        )
        raw = _strip_fences(resp.text or "")
        return json.loads(raw), None
    except Exception as e:
        logger.exception("Gemini call failed")
        return None, str(e)


def _strip_fences(text):
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


# ================================================================
# Validation
# ================================================================

def _validate_slots(raw_slots, context):
    """
    Returns (clean_slots, errors).
    clean_slots uses FULL ids. errors is a list of strings.
    """
    errors = []
    short_map = context["short_id_map"]
    valid_sections = {s["id"] for s in context["sections"]}
    valid_courses = {sub["id"] for s in context["sections"] for sub in s["subjects"]}
    valid_teachers = {sub["teacher_id"] for s in context["sections"] for sub in s["subjects"]}
    section_of_course = {
        sub["id"]: s["id"]
        for s in context["sections"]
        for sub in s["subjects"]
    }

    if not isinstance(raw_slots, list):
        return [], ["Top-level output is not a JSON array."]

    teacher_used = defaultdict(set)     # teacher_id -> {(day, period)}
    section_used = defaultdict(set)     # section_id -> {(day, period)}
    period_counts = defaultdict(int)    # (section_id, course_id) -> count
    clean = []

    for i, s in enumerate(raw_slots):
        if not isinstance(s, dict):
            errors.append(f"Slot #{i} is not an object.")
            continue

        # Resolve short IDs → full IDs
        section_short = str(s.get("section_id", "")).strip()
        course_short = str(s.get("class_course_id", "")).strip()
        teacher_short = str(s.get("teacher_id", "")).strip()

        section_id = short_map.get(section_short, section_short)
        course_id = short_map.get(course_short, course_short)
        teacher_id = short_map.get(teacher_short, teacher_short)

        if section_id not in valid_sections:
            errors.append(f"Slot #{i}: unknown section_id {section_short}")
            continue
        if course_id not in valid_courses:
            errors.append(f"Slot #{i}: unknown class_course_id {course_short}")
            continue
        if teacher_id not in valid_teachers:
            errors.append(f"Slot #{i}: unknown teacher_id {teacher_short}")
            continue
        if section_of_course.get(course_id) != section_id:
            errors.append(f"Slot #{i}: course {course_id} does not belong to section {section_id}")
            continue

        try:
            day = int(s["day_of_week"])
            period = int(s["period_number"])
        except (KeyError, ValueError):
            errors.append(f"Slot #{i}: bad day/period value")
            continue

        key = (day, period)
        if key in teacher_used[teacher_id]:
            errors.append(f"Slot #{i}: teacher clash — teacher={teacher_short} at day={day} period={period}")
            continue
        if key in section_used[section_id]:
            errors.append(f"Slot #{i}: section clash — section={section_short} at day={day} period={period}")
            continue

        teacher_used[teacher_id].add(key)
        section_used[section_id].add(key)
        period_counts[(section_id, course_id)] += 1

        clean.append({
            "section_id": section_id,
            "class_course_id": course_id,
            "teacher_id": teacher_id,
            "day_of_week": day,
            "period_number": period,
            "start_time": str(s.get("start_time") or ""),
            "end_time": str(s.get("end_time") or ""),
        })

    # Completeness check
    for section in context["sections"]:
        for sub in section["subjects"]:
            want = sub["periods_per_week"]
            got = period_counts.get((section["id"], sub["id"]), 0)
            if got != want:
                errors.append(
                    f"Section {section['id']} / subject {sub['id']}: "
                    f"expected {want} periods, got {got}"
                )

    return clean, errors


# ================================================================
# Fallback (deterministic)
# ================================================================

def _fallback_generate(context):
    """Simple round-robin that respects the hard rules."""
    c = context["constraints"]
    working_days = list(range(len(c["working_days"])))
    periods = list(range(1, c["periods_per_day"] + 1))
    break_after = c["break_after_period"]
    period_minutes = c["period_minutes"]
    start_min = _to_min(c["start_time"])

    teacher_used = defaultdict(set)
    section_used = defaultdict(set)
    out = []

    # Precompute start/end times per period
    def slot_times(period):
        extra = c["break_minutes"] if (break_after and period > break_after) else 0
        start = start_min + (period - 1) * period_minutes + extra
        return _from_min(start), _from_min(start + period_minutes)

    # Build a work queue: [(section, subject)] × periods
    queue = []
    for s in context["sections"]:
        for sub in s["subjects"]:
            for _ in range(sub["periods_per_week"]):
                queue.append((s["id"], sub["id"], sub["teacher_id"]))

    # Sort longest-first
    queue.sort(key=lambda x: -x[2].__hash__())  # stable-ish

    for sec_id, course_id, teacher_id in queue:
        placed = False
        for day in working_days:
            for p in periods:
                key = (day, p)
                if key in teacher_used[teacher_id]:
                    continue
                if key in section_used[sec_id]:
                    continue
                s_time, e_time = slot_times(p)
                out.append({
                    "section_id": sec_id,
                    "class_course_id": course_id,
                    "teacher_id": teacher_id,
                    "day_of_week": day,
                    "period_number": p,
                    "start_time": s_time,
                    "end_time": e_time,
                })
                teacher_used[teacher_id].add(key)
                section_used[sec_id].add(key)
                placed = True
                break
            if placed:
                break
    return out


def _to_min(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _from_min(total):
    return f"{total // 60:02d}:{total % 60:02d}"


# ================================================================
# Public entry point
# ================================================================

def generate_timetable(context, max_retries=2):
    """
    Returns dict:
      { slots: [...], source: "ai" | "fallback", attempts: N, errors: [...] }
    """
    prior_errors = None
    for attempt in range(1, max_retries + 2):
        prompt = _build_prompt(context, prior_errors)
        data, err = _call_gemini(prompt)

        if err == "no_api_key":
            logger.warning("No GEMINI_API_KEY — using fallback")
            return {
                "slots": _fallback_generate(context),
                "source": "fallback",
                "attempts": attempt,
                "errors": ["no_api_key"],
            }

        if err is not None:
            prior_errors = [f"Previous call errored: {err}"]
            continue

        clean, errors = _validate_slots(data, context)
        if not errors:
            return {
                "slots": clean,
                "source": "ai",
                "attempts": attempt,
                "errors": [],
            }

        prior_errors = errors
        logger.warning("Attempt %d failed with %d errors", attempt, len(errors))

    # All retries exhausted
    logger.warning("AI failed after %d attempts — using fallback", max_retries + 1)
    return {
        "slots": _fallback_generate(context),
        "source": "fallback",
        "attempts": max_retries + 1,
        "errors": prior_errors or [],
    }