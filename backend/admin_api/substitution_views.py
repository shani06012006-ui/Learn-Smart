"""Teacher substitution endpoints."""
from datetime import datetime
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from classes.models import (
    TimetableEntry,
    TeacherAbsence,
    TeacherSubstitution,
)


def _is_admin(user):
    return getattr(user, "role", None) == "admin" or user.is_superuser


class AdminAbsencesView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        qs = TeacherAbsence.objects.select_related("teacher")
        if request.user.institution_id:
            qs = qs.filter(teacher__institution_id=request.user.institution_id)
        return Response({
            "count": qs.count(),
            "results": [
                {
                    "id": str(a.id),
                    "teacher_id": str(a.teacher_id),
                    "teacher_name": a.teacher.get_full_name() or a.teacher.email,
                    "date": str(a.date),
                    "reason": a.reason,
                    "is_approved": a.is_approved,
                }
                for a in qs.order_by("-date")
            ],
        })

    def post(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        teacher_id = request.data.get("teacher_id")
        date_str = request.data.get("date")
        reason = (request.data.get("reason") or "").strip()
        if not teacher_id or not date_str:
            return Response({"detail": "teacher_id and date required."}, status=400)
        try:
            teacher = User.objects.get(id=teacher_id, role="teacher")
        except User.DoesNotExist:
            return Response({"detail": "Teacher not found."}, status=404)
        try:
            date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "date must be YYYY-MM-DD."}, status=400)
        absence, created = TeacherAbsence.objects.update_or_create(
            teacher=teacher,
            date=date_val,
            defaults={
                "reason": reason,
                "is_approved": bool(request.data.get("is_approved", True)),
            },
        )
        return Response(
            {
                "id": str(absence.id),
                "created": created,
                "teacher_id": str(teacher.id),
                "date": str(date_val),
            },
            status=201 if created else 200,
        )


class SuggestSubstitutesView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)

        date_str = request.data.get("date")
        entry_id = request.data.get("timetable_entry_id")
        if not date_str:
            return Response({"detail": "date required."}, status=400)
        try:
            date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "date must be YYYY-MM-DD."}, status=400)

        if entry_id:
            try:
                entry = TimetableEntry.objects.select_related(
                    "class_course", "teacher"
                ).get(id=entry_id)
            except TimetableEntry.DoesNotExist:
                return Response({"detail": "Timetable entry not found."}, status=404)
            dow = entry.day_of_week
            start = entry.start_time
            end = entry.end_time
        else:
            dow = int(request.data.get("day_of_week", 0))
            start = request.data.get("start_time")
            end = request.data.get("end_time")
            if not start or not end:
                return Response(
                    {"detail": "Provide timetable_entry_id, or day_of_week + start_time + end_time."},
                    status=400,
                )

        busy_teacher_ids = set()
        busy_qs = TimetableEntry.objects.filter(
            day_of_week=dow,
            is_active=True,
            start_time__lt=end,
            end_time__gt=start,
        )
        for e in busy_qs:
            if e.teacher_id:
                busy_teacher_ids.add(str(e.teacher_id))
            if e.class_course and e.class_course.teacher_id:
                busy_teacher_ids.add(str(e.class_course.teacher_id))

        subs_qs = TeacherSubstitution.objects.filter(
            date=date_val,
            timetable_entry__day_of_week=dow,
            timetable_entry__start_time__lt=end,
            timetable_entry__end_time__gt=start,
        )
        for s in subs_qs:
            busy_teacher_ids.add(str(s.substitute_teacher_id))

        absent_ids = set(
            TeacherAbsence.objects.filter(date=date_val, is_approved=True)
            .values_list("teacher_id", flat=True)
        )
        absent_ids = {str(x) for x in absent_ids}

        teacher_qs = User.objects.filter(role="teacher", is_active=True)
        if request.user.institution_id:
            teacher_qs = teacher_qs.filter(institution_id=request.user.institution_id)

        available = []
        for t in teacher_qs:
            tid = str(t.id)
            if tid in busy_teacher_ids or tid in absent_ids:
                continue
            load = TimetableEntry.objects.filter(
                teacher=t, day_of_week=dow, is_active=True
            ).count()
            available.append({
                "id": tid,
                "full_name": t.get_full_name() or t.email,
                "email": t.email,
                "current_load": load,
            })

        available.sort(key=lambda x: x["current_load"])
        return Response({"date": str(date_val), "available": available})


class AssignSubstituteView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)

        entry_id = request.data.get("timetable_entry_id")
        date_str = request.data.get("date")
        sub_id = request.data.get("substitute_teacher_id")
        note = (request.data.get("note") or "").strip()

        if not (entry_id and date_str and sub_id):
            return Response({"detail": "Missing fields."}, status=400)

        try:
            entry = TimetableEntry.objects.select_related(
                "class_course", "teacher"
            ).get(id=entry_id)
        except TimetableEntry.DoesNotExist:
            return Response({"detail": "Timetable entry not found."}, status=404)

        try:
            sub_teacher = User.objects.get(id=sub_id, role="teacher")
        except User.DoesNotExist:
            return Response({"detail": "Substitute teacher not found."}, status=404)

        try:
            date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "date must be YYYY-MM-DD."}, status=400)

        original = entry.teacher or (entry.class_course.teacher if entry.class_course else None)
        if not original:
            return Response({"detail": "Original teacher missing."}, status=400)

        sub, created = TeacherSubstitution.objects.update_or_create(
            timetable_entry=entry,
            date=date_val,
            defaults={
                "original_teacher": original,
                "substitute_teacher": sub_teacher,
                "created_by": request.user,
                "note": note,
            },
        )
        return Response({
            "id": str(sub.id),
            "created": created,
            "timetable_entry_id": str(entry.id),
            "date": str(date_val),
            "substitute": {
                "id": str(sub_teacher.id),
                "full_name": sub_teacher.get_full_name() or sub_teacher.email,
            },
        }, status=201 if created else 200)