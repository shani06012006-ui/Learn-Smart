# -*- coding: utf-8 -*-
from django.db import transaction
from django.db.models import Count, Q
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


# ═══════════════════════════════════════════════════════════════
# Permissions
# ═══════════════════════════════════════════════════════════════

class IsAdminOrTeacher(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        role = getattr(request.user, "role", None)
        return role in (
            getattr(User, "ROLE_ADMIN", "admin"),
            getattr(User, "ROLE_TEACHER", "teacher"),
        )


class IsTeacherOnly(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        role = getattr(request.user, "role", None)
        return role == getattr(User, "ROLE_TEACHER", "teacher")


# ═══════════════════════════════════════════════════════════════
# Shared helpers
# ═══════════════════════════════════════════════════════════════

def _list_class_attendance(klass, date_str):
    """Return roster rows for a class+date with existing statuses."""
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
    return rows


def _bulk_mark(klass, date_obj, records, marked_by):
    saved = 0
    with transaction.atomic():
        for item in records:
            StudentAttendance.objects.update_or_create(
                student_id=item["student"],
                class_course=klass,
                date=date_obj,
                defaults={
                    "status": item["status"],
                    "note": item.get("note", "") or "",
                    "source": StudentAttendance.SOURCE_MANUAL,
                    "marked_by": marked_by,
                },
            )
            saved += 1
    return saved


def _summary_rows(klass, date_from, date_to):
    """Per-student aggregates for a class in a date range."""
    enrollments = StudentEnrollment.objects.filter(
        class_course=klass,
        status=StudentEnrollment.STATUS_ACTIVE,
    ).select_related("student")

    qs = StudentAttendance.objects.filter(class_course=klass)
    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)

    # Build a per-student dict
    by_student = {}
    for a in qs.values("student_id", "status"):
        s = by_student.setdefault(a["student_id"], {
            "present": 0, "absent": 0, "late": 0, "excused": 0
        })
        if a["status"] in s:
            s[a["status"]] += 1

    rows = []
    for e in enrollments:
        u = e.student
        agg = by_student.get(u.id, {"present": 0, "absent": 0, "late": 0, "excused": 0})
        total = sum(agg.values())
        present = agg["present"]
        rate = round((present / total) * 100, 1) if total else 0.0
        full = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email
        rows.append({
            "student": str(u.id),
            "student_name": full,
            "present": agg["present"],
            "absent": agg["absent"],
            "late": agg["late"],
            "excused": agg["excused"],
            "total": total,
            "attendance_rate": rate,
        })

    rows.sort(key=lambda r: r["student_name"].lower())
    return rows


# ═══════════════════════════════════════════════════════════════
# Admin / Teacher shared attendance viewset
# ═══════════════════════════════════════════════════════════════

class AttendanceViewSet(viewsets.ViewSet):
    """
    Read-only attendance reports + marking for admins and teachers.
    Endpoints under /api/v1/admin/attendance/.
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

        # Admin view: show ONLY records actually saved by teachers.
        # Do NOT show a full roster — that's the teacher's UI.
        qs = (
            StudentAttendance.objects
            .filter(class_course=klass, date=date_str)
            .select_related("student", "marked_by")
            .order_by("student__first_name", "student__last_name")
        )

        rows = []
        for a in qs:
            s = a.student
            full = f"{s.first_name or ''} {s.last_name or ''}".strip() or s.email
            rows.append({
                "student": str(s.id),
                "student_name": full,
                "status": a.status,
                "note": a.note or "",
                "record_id": str(a.id),
                "marked_by": (
                    f"{(a.marked_by.first_name or '').strip()} {(a.marked_by.last_name or '').strip()}".strip()
                    or (a.marked_by.email if a.marked_by else None)
                ) if a.marked_by else None,
                "marked_at": a.updated_at.isoformat() if a.updated_at else None,
                "source": a.source,
            })

        return Response({
            "klass": str(klass.id),
            "klass_name": klass.name,
            "date": date_str,
            "count": len(rows),
            "rows": rows,
        })

    @action(detail=False, methods=["post"], url_path="mark")
    def mark(self, request):
        """POST /admin/attendance/mark/"""
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

        saved = _bulk_mark(klass, data["date"], data["records"], request.user)
        return Response({"saved": saved, "date": str(data["date"])})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """GET /admin/attendance/stats/?klass=&from=&to="""
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

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """GET /admin/attendance/summary/?klass=&from=&to="""
        klass_id = request.query_params.get("klass")
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        if not klass_id:
            return Response(
                {"error": {"detail": "klass is required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            klass = ClassCourse.objects.get(id=klass_id)
        except ClassCourse.DoesNotExist:
            return Response(
                {"error": {"detail": "Class not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        rows = _summary_rows(klass, from_str, to_str)
        return Response({
            "klass": str(klass.id),
            "klass_name": klass.name,
            "from": from_str,
            "to": to_str,
            "rows": rows,
        })


# ═══════════════════════════════════════════════════════════════
# Teacher-scoped attendance viewset
# ═══════════════════════════════════════════════════════════════

class TeacherAttendanceViewSet(viewsets.ViewSet):
    """
    Teacher-only attendance. Auto-scopes to classes owned by the
    requesting teacher.
    Endpoints under /api/v1/teacher/attendance/.
    """
    permission_classes = [IsTeacherOnly]

    def _get_owned_class(self, request, klass_id):
        return ClassCourse.objects.get(id=klass_id, teacher=request.user)

    def list(self, request):
        """GET /teacher/attendance/?klass=<uuid>&date=YYYY-MM-DD"""
        klass_id = request.query_params.get("klass")
        date_str = request.query_params.get("date")

        if not klass_id or not date_str:
            return Response(
                {"error": {"detail": "klass and date are required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            klass = self._get_owned_class(request, klass_id)
        except ClassCourse.DoesNotExist:
            return Response(
                {"error": {"detail": "Class not found or not yours.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        rows = _list_class_attendance(klass, date_str)
        return Response({
            "klass": str(klass.id),
            "klass_name": klass.name,
            "date": date_str,
            "rows": rows,
        })

    @action(detail=False, methods=["post"], url_path="mark")
    def mark(self, request):
        """POST /teacher/attendance/mark/"""
        ser = AttendanceBulkMarkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            klass = self._get_owned_class(request, data["klass"])
        except ClassCourse.DoesNotExist:
            return Response(
                {"error": {"detail": "Class not found or not yours.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        saved = _bulk_mark(klass, data["date"], data["records"], request.user)
        return Response({"saved": saved, "date": str(data["date"])})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """GET /teacher/attendance/stats/?klass=&from=&to="""
        klass_id = request.query_params.get("klass")
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        qs = StudentAttendance.objects.filter(class_course__teacher=request.user)
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

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """GET /teacher/attendance/summary/?klass=&from=&to="""
        klass_id = request.query_params.get("klass")
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        if not klass_id:
            return Response(
                {"error": {"detail": "klass is required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            klass = self._get_owned_class(request, klass_id)
        except ClassCourse.DoesNotExist:
            return Response(
                {"error": {"detail": "Class not found or not yours.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

        rows = _summary_rows(klass, from_str, to_str)
        return Response({
            "klass": str(klass.id),
            "klass_name": klass.name,
            "from": from_str,
            "to": to_str,
            "rows": rows,
        })
