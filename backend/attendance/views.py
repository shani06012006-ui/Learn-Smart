# -*- coding: utf-8 -*-
from django.db import transaction
from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User, StudentAttendance
from classes.models import ClassCourse, StudentEnrollment
from .serializers import (
    StudentAttendanceReadSerializer,
    AttendanceBulkMarkSerializer,
)


class IsAdminOrTeacher(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        role = getattr(request.user, "role", None)
        return role in (
            getattr(User, "ROLE_ADMIN", "admin"),
            getattr(User, "ROLE_TEACHER", "teacher"),
        )


class AttendanceViewSet(viewsets.ViewSet):
    """
    Attendance for a class on a given date.
    Reads/writes accounts.models.StudentAttendance.
    """
    permission_classes = [IsAdminOrTeacher]

    def list(self, request):
        """GET /admin/attendance/?klass=<uuid>&date=YYYY-MM-DD"""
        klass_id = request.query_params.get("klass")
        date_str = request.query_params.get("date")

        if not klass_id or not date_str:
            return Response(
                {"error": {"detail": "klass and date are required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            klass = ClassCourse.objects.get(id=klass_id)
        except ClassCourse.DoesNotExist:
            return Response(
                {"error": {"detail": "Class not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Active enrolments in this class
        enrollments = StudentEnrollment.objects.filter(
            class_course=klass,
            status=StudentEnrollment.STATUS_ACTIVE,
        ).select_related("student")

        existing = {
            a.student_id: a
            for a in StudentAttendance.objects.filter(
                class_course=klass, date=date_str
            )
        }

        rows = []
        for e in enrollments:
            s = e.student
            rec = existing.get(s.id)
            full = f"{s.first_name or ''} {s.last_name or ''}".strip() or s.email
            rows.append({
                "student": str(s.id),
                "student_name": full,
                "status": rec.status if rec else None,
                "note": rec.note if rec else "",
                "record_id": str(rec.id) if rec else None,
            })

        rows.sort(key=lambda r: r["student_name"].lower())

        return Response({
            "klass": str(klass.id),
            "klass_name": klass.name,
            "date": date_str,
            "rows": rows,
        })

    @action(detail=False, methods=["post"], url_path="mark")
    def mark(self, request):
        """POST /admin/attendance/mark/
        Body: { klass, date, records:[{student, status, note}] }"""
        ser = AttendanceBulkMarkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            klass = ClassCourse.objects.get(id=data["klass"])
        except ClassCourse.DoesNotExist:
            return Response(
                {"error": {"detail": "Class not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved = 0
        with transaction.atomic():
            for item in data["records"]:
                StudentAttendance.objects.update_or_create(
                    student_id=item["student"],
                    class_course=klass,
                    date=data["date"],
                    defaults={
                        "status": item["status"],
                        "note": item.get("note", "") or "",
                        "source": StudentAttendance.SOURCE_MANUAL,
                        "marked_by": request.user,
                    },
                )
                saved += 1

        return Response({"saved": saved, "date": str(data["date"])})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """GET /admin/attendance/stats/?klass=<uuid>&from=&to="""
        klass_id = request.query_params.get("klass")
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        qs = StudentAttendance.objects.all()
        if klass_id:
            qs = qs.filter(class_course_id=klass_id)
        if from_str:
            qs = qs.filter(date__gte=from_str)
        if to_str:
            qs = qs.filter(date__lte=to_str)

        agg = qs.values("status").annotate(count=Count("id"))
        counts = {row["status"]: row["count"] for row in agg}
        total = sum(counts.values())
        present = counts.get("present", 0)
        rate = round((present / total) * 100, 1) if total else 0.0

        return Response({
            "total": total,
            "present": present,
            "absent": counts.get("absent", 0),
            "late": counts.get("late", 0),
            "excused": counts.get("excused", 0),
            "attendance_rate": rate,
        })
