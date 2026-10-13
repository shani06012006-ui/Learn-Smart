"""
POST /api/v1/admin/timetable/generate/

Request:
  {
    "working_days": ["Monday", ..., "Saturday"],
    "start_time": "08:00",
    "end_time": "15:00",
    "period_minutes": 45,
    "periods_per_day": 6,
    "break_after_period": 3,
    "break_minutes": 15,
    "selections": [
      {"grade_id": "...", "section_id": "..."},
      ...
    ],
    "periods_per_subject_per_week": 4
  }
"""
from collections import defaultdict

from django.db import transaction
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from classes.models import ClassCourse, ClassSection, TimetableEntry
from institutions.models import Grade

from .timetable_engine import generate_timetable


class AdminGenerateTimetableView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        user = request.user
        if getattr(user, "role", None) != "admin" and not user.is_superuser:
            return Response({"detail": "Admin access only."}, status=403)
        if not user.institution_id and not user.is_superuser:
            return Response({"detail": "No institution on your account."}, status=400)

        body = request.data or {}
        constraints = {
            "working_days": body.get("working_days")
                or ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "start_time": body.get("start_time") or "08:00",
            "end_time": body.get("end_time") or "15:00",
            "period_minutes": int(body.get("period_minutes") or 45),
            "periods_per_day": int(body.get("periods_per_day") or 6),
            "break_after_period": int(body.get("break_after_period") or 0),
            "break_minutes": int(body.get("break_minutes") or 0),
        }

        selections = body.get("selections") or []
        if not isinstance(selections, list) or not selections:
            return Response(
                {"detail": "selections must be a non-empty list of {grade_id, section_id}."},
                status=400,
            )

        periods_per_subject = int(body.get("periods_per_subject_per_week") or 4)

        # ---- Gather sections + subjects -----------------------------------
        section_ids = [s.get("section_id") for s in selections if s.get("section_id")]
        section_qs = ClassSection.objects.filter(id__in=section_ids).select_related("grade")
        if user.institution_id:
            section_qs = section_qs.filter(grade__institution_id=user.institution_id)

        if not section_qs.exists():
            return Response({"detail": "No valid sections found."}, status=400)

        # ---- Build short-ID map (S1, S2, C1, T1) --------------------------
        short_map = {}
        next_section = 1
        next_course = 1
        next_teacher = 1
        teacher_short = {}   # full_id -> short

        sections_payload = []
        used_teachers = set()

        for section in section_qs:
            # Every ClassCourse on this grade = subject taught to this section
            courses = list(
                ClassCourse.objects
                .filter(grade=section.grade, is_archived=False)
                .select_related("teacher")
            )

            subjects = []
            for c in courses:
                if not c.teacher_id:
                    continue   # skip unassigned; flag as warning later
                sid = f"S{next_section}"
                cid = f"C{next_course}"
                if c.teacher_id not in teacher_short:
                    teacher_short[c.teacher_id] = f"T{next_teacher}"
                    next_teacher += 1
                tid = teacher_short[c.teacher_id]

                short_map[sid] = str(section.id)
                short_map[cid] = str(c.id)
                short_map[tid] = str(c.teacher_id)

                subjects.append({
                    "id": cid,
                    "name": c.subject or c.name,
                    "teacher_id": tid,
                    "teacher_name": c.teacher.get_full_name() or c.teacher.email,
                    "periods_per_week": periods_per_subject,
                })
                next_course += 1
                used_teachers.add(c.teacher_id)

            if not subjects:
                # Section has no assigned subjects — skip it with a warning
                continue

            sections_payload.append({
                "id": f"S{next_section}",
                "name": section.name,
                "grade_name": section.grade.name,
                "subjects": subjects,
            })
            next_section += 1

        if not sections_payload:
            return Response({
                "detail": "No sections with assigned teachers found.",
                "hint": "Assign a teacher to at least one class in these grades first.",
            }, status=400)

        # ---- Existing teacher commitments outside target sections ---------
        target_section_ids = [short_map[s["id"]] for s in sections_payload]
        blocked = defaultdict(list)
        existing = TimetableEntry.objects.filter(
            teacher_id__in=list(used_teachers),
            is_active=True,
        ).exclude(section_id__in=target_section_ids).select_related("teacher")

        for e in existing:
            t_short = teacher_short.get(e.teacher_id)
            if t_short:
                blocked[t_short].append(f"{e.day_of_week}-{e.period_number}")

        context = {
            "constraints": constraints,
            "sections": sections_payload,
            "teacher_blocked": dict(blocked),
            "short_id_map": short_map,
        }

        # ---- Generate ------------------------------------------------------
        result = generate_timetable(context, max_retries=2)
        slots = result["slots"]

        if not slots:
            return Response({
                "detail": "Generation failed and fallback produced no slots.",
                "errors": result["errors"][:10],
            }, status=422)

        # ---- Persist atomically --------------------------------------------
        target_grade_ids = [s.grade_id for s in section_qs]
        with transaction.atomic():
            TimetableEntry.objects.filter(
                section_id__in=target_section_ids,
            ).delete()

            bulk = []
            for s in slots:
                bulk.append(TimetableEntry(
                    class_course_id=s["class_course_id"],
                    section_id=s["section_id"],
                    teacher_id=s["teacher_id"] or None,
                    day_of_week=s["day_of_week"],
                    period_number=s["period_number"],
                    start_time=s["start_time"],
                    end_time=s["end_time"],
                    room="",
                    is_active=True,
                ))
            TimetableEntry.objects.bulk_create(bulk, batch_size=500)

        return Response({
            "created": len(bulk),
            "source": result["source"],
            "attempts": result["attempts"],
            "errors": result["errors"][:5],
            "sections_scheduled": len(sections_payload),
        }, status=201)