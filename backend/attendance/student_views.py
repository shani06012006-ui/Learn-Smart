# -*- coding: utf-8 -*-
"""
Student self-service endpoints. Safe for PIN-login students.
Every endpoint auto-scopes to request.user — a student can never see
another student's data.
"""
from datetime import date as date_cls

from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User, StudentAttendance
from classes.models import ClassCourse, StudentEnrollment


class IsStudentSelf(IsAuthenticated):
    """
    Only the logged-in student may call these endpoints.
    Admins/teachers are rejected so PIN-login scope is strict.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "role", None) == getattr(User, "ROLE_STUDENT", "student")


def _full_name(u):
    return (f"{u.first_name or ''} {u.last_name or ''}").strip() or u.email


class StudentSelfViewSet(viewsets.ViewSet):
    permission_classes = [IsStudentSelf]

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        u = request.user
        return Response({
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "full_name": _full_name(u),
            "role": u.role,
            "grade": {
                "id": str(u.grade_id),
                "name": u.grade.name if u.grade_id else None,
            } if u.grade_id else None,
            "institution": {
                "id": str(u.institution_id),
                "name": u.institution.name if u.institution_id else None,
            } if u.institution_id else None,
        })

    @action(detail=False, methods=["get"], url_path="my-classes")
    def my_classes(self, request):
        u = request.user
        enrollments = (
            StudentEnrollment.objects
            .filter(student=u, status=StudentEnrollment.STATUS_ACTIVE)
            .select_related("class_course", "class_course__teacher", "class_course__grade")
            .order_by("class_course__name")
        )
        rows = []
        for e in enrollments:
            c = e.class_course
            rows.append({
                "id": str(c.id),
                "name": c.name,
                "subject": c.subject,
                "teacher": _full_name(c.teacher) if c.teacher else None,
                "grade": c.grade.name if c.grade_id else None,
                "is_archived": c.is_archived,
            })
        return Response({"count": len(rows), "results": rows})

    @action(detail=False, methods=["get"], url_path="my-attendance")
    def my_attendance(self, request):
        u = request.user
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        qs = StudentAttendance.objects.filter(student=u)
        if from_str:
            qs = qs.filter(date__gte=from_str)
        if to_str:
            qs = qs.filter(date__lte=to_str)

        agg = qs.values("status").annotate(count=Count("id"))
        counts = {row["status"]: row["count"] for row in agg}
        total = sum(counts.values())
        present = counts.get("present", 0)
        rate = round((present / total) * 100, 1) if total else 0.0

        recent = (
            qs.select_related("class_course")
            .order_by("-date")[:20]
        )
        recent_rows = [{
            "date": str(a.date),
            "status": a.status,
            "class_name": a.class_course.name if a.class_course else None,
            "note": a.note or "",
        } for a in recent]

        return Response({
            "total": total,
            "present": present,
            "absent": counts.get("absent", 0),
            "late": counts.get("late", 0),
            "excused": counts.get("excused", 0),
            "attendance_rate": rate,
            "recent": recent_rows,
        })

    @action(detail=False, methods=["get"], url_path="my-grades")
    def my_grades(self, request):
        # Placeholder until the grades schema lands. Returns an empty list
        # rather than a fake success so the UI can show a real empty state.
        return Response({"count": 0, "results": []})