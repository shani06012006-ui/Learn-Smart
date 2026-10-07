# -*- coding: utf-8 -*-
from django.db import transaction
from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User, StudentAttendance
from classes.models import ClassCourse, StudentEnrollment
from institutions.models import Grade
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
# Helpers
# ═══════════════════════════════════════════════════════════════

def _resolve_target(request):
    """
    Parse ?grade=<uuid> or ?klass=<uuid>.
    Returns (grade_obj, class_obj) — one is None, one is set.
    Raises Response on error.
    """
    grade_id = request.query_params.get("grade")
    klass_id = request.query_params.get("klass")

    if not grade_id and not klass_id:
        return None, None, Response(
            {"error": {"detail": "Provide ?grade= or ?klass=", "status_code": 400}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if grade_id:
        try:
            return Grade.objects.get(id=grade_id), None, None
        except Grade.DoesNotExist:
            return None, None, Response(
                {"error": {"detail": "Grade not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

    try:
        return None, ClassCourse.objects.get(id=klass_id), None
    except ClassCourse.DoesNotExist:
        return None, None, Response(
            {"error": {"detail": "Class not found.", "status_code": 404}},
            status=status.HTTP_404_NOT_FOUND,
        )


def _students_for_grade(grade):
    return User.objects.filter(
        role=getattr(User, "ROLE_STUDENT", "student"),
        is_active=True,
        grade=grade,
    ).order_by("first_name", "last_name")


def _students_for_class(klass):
    return [
        e.student for e in StudentEnrollment.objects.filter(
            class_course=klass,
            status=StudentEnrollment.STATUS_ACTIVE,
        ).select_related("student")
    ]


def _full_name(u):
    return (f"{u.first_name or ''} {u.last_name or ''}").strip() or u.email


def _roster_rows(grade, klass, date_str):
    """Return roster with existing statuses. Used by teacher view."""
    if grade:
        students = list(_students_for_grade(grade))
        existing = {
            a.student_id: a
            for a in StudentAttendance.objects.filter(grade=grade, date=date_str)
        }
    else:
        students = _students_for_class(klass)
        existing = {
            a.student_id: a
            for a in StudentAttendance.objects.filter(class_course=klass, date=date_str)
        }

    rows = []
    for s in students:
        rec = existing.get(s.id)
        rows.append({
            "student": str(s.id),
            "student_name": _full_name(s),
            "status": rec.status if rec else None,
            "note": rec.note if rec else "",
            "record_id": str(rec.id) if rec else None,
        })
    rows.sort(key=lambda r: r["student_name"].lower())
    return rows


def _record_rows(grade, klass, date_str):
    """Return ONLY saved records. Used by admin view."""
    if grade:
        qs = StudentAttendance.objects.filter(grade=grade, date=date_str)
    else:
        qs = StudentAttendance.objects.filter(class_course=klass, date=date_str)

    qs = qs.select_related("student", "marked_by").order_by(
        "student__first_name", "student__last_name"
    )

    rows = []
    for a in qs:
        rows.append({
            "student": str(a.student_id),
            "student_name": _full_name(a.student),
            "status": a.status,
            "note": a.note or "",
            "record_id": str(a.id),
            "marked_by": (
                _full_name(a.marked_by) if a.marked_by else None
            ),
            "marked_at": a.updated_at.isoformat() if a.updated_at else None,
            "source": a.source,
        })
    return rows


def _bulk_mark(grade, klass, date_obj, records, marked_by):
    saved = 0
    with transaction.atomic():
        for item in records:
            defaults = {
                "status": item["status"],
                "note": item.get("note", "") or "",
                "source": StudentAttendance.SOURCE_MANUAL,
                "marked_by": marked_by,
            }
            if grade:
                StudentAttendance.objects.update_or_create(
                    student_id=item["student"],
                    grade=grade,
                    date=date_obj,
                    defaults=defaults,
                )
            else:
                StudentAttendance.objects.update_or_create(
                    student_id=item["student"],
                    class_course=klass,
                    date=date_obj,
                    defaults=defaults,
                )
            saved += 1
    return saved


def _summary_rows(grade, klass, date_from, date_to):
    if grade:
        students = list(_students_for_grade(grade))
        qs = StudentAttendance.objects.filter(grade=grade)
    else:
        students = _students_for_class(klass)
        qs = StudentAttendance.objects.filter(class_course=klass)

    if date_from:
        qs = qs.filter(date__gte=date_from)
    if date_to:
        qs = qs.filter(date__lte=date_to)

    by_student = {}
    for a in qs.values("student_id", "status"):
        s = by_student.setdefault(
            a["student_id"],
            {"present": 0, "absent": 0, "late": 0, "excused": 0},
        )
        if a["status"] in s:
            s[a["status"]] += 1

    rows = []
    for u in students:
        agg = by_student.get(u.id, {"present": 0, "absent": 0, "late": 0, "excused": 0})
        total = sum(agg.values())
        present = agg["present"]
        rate = round((present / total) * 100, 1) if total else 0.0
        rows.append({
            "student": str(u.id),
            "student_name": _full_name(u),
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
# Admin viewset (records-only view)
# ═══════════════════════════════════════════════════════════════

class AttendanceViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminOrTeacher]

    def list(self, request):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response(
                {"error": {"detail": "date is required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade, klass, err = _resolve_target(request)
        if err:
            return err

        rows = _record_rows(grade, klass, date_str)
        return Response({
            "grade": str(grade.id) if grade else None,
            "grade_name": grade.name if grade else None,
            "klass": str(klass.id) if klass else None,
            "klass_name": klass.name if klass else None,
            "date": date_str,
            "count": len(rows),
            "rows": rows,
        })

    @action(detail=False, methods=["post"], url_path="mark")
    def mark(self, request):
        ser = AttendanceBulkMarkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        grade = None
        klass = None
        if data.get("grade"):
            try:
                grade = Grade.objects.get(id=data["grade"])
            except Grade.DoesNotExist:
                return Response(
                    {"error": {"detail": "Grade not found.", "status_code": 404}},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif data.get("klass"):
            try:
                klass = ClassCourse.objects.get(id=data["klass"])
            except ClassCourse.DoesNotExist:
                return Response(
                    {"error": {"detail": "Class not found.", "status_code": 404}},
                    status=status.HTTP_404_NOT_FOUND,
                )

        saved = _bulk_mark(grade, klass, data["date"], data["records"], request.user)
        return Response({"saved": saved, "date": str(data["date"])})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")
        grade, klass, err = _resolve_target(request)
        if err:
            return err

        if grade:
            qs = StudentAttendance.objects.filter(grade=grade)
        else:
            qs = StudentAttendance.objects.filter(class_course=klass)

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
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")
        grade, klass, err = _resolve_target(request)
        if err:
            return err

        rows = _summary_rows(grade, klass, from_str, to_str)
        return Response({
            "grade": str(grade.id) if grade else None,
            "grade_name": grade.name if grade else None,
            "klass": str(klass.id) if klass else None,
            "klass_name": klass.name if klass else None,
            "from": from_str,
            "to": to_str,
            "rows": rows,
        })


# ═══════════════════════════════════════════════════════════════
# Teacher viewset (roster + statuses)
# ═══════════════════════════════════════════════════════════════

class TeacherAttendanceViewSet(viewsets.ViewSet):
    permission_classes = [IsTeacherOnly]

    def list(self, request):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response(
                {"error": {"detail": "date is required.", "status_code": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade, klass, err = _resolve_target(request)
        if err:
            return err

        rows = _roster_rows(grade, klass, date_str)
        return Response({
            "grade": str(grade.id) if grade else None,
            "grade_name": grade.name if grade else None,
            "klass": str(klass.id) if klass else None,
            "klass_name": klass.name if klass else None,
            "date": date_str,
            "rows": rows,
        })

    @action(detail=False, methods=["post"], url_path="mark")
    def mark(self, request):
        ser = AttendanceBulkMarkSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        grade = None
        klass = None
        if data.get("grade"):
            try:
                grade = Grade.objects.get(id=data["grade"])
            except Grade.DoesNotExist:
                return Response(
                    {"error": {"detail": "Grade not found.", "status_code": 404}},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif data.get("klass"):
            try:
                klass = ClassCourse.objects.get(id=data["klass"], teacher=request.user)
            except ClassCourse.DoesNotExist:
                return Response(
                    {"error": {"detail": "Class not found or not yours.", "status_code": 404}},
                    status=status.HTTP_404_NOT_FOUND,
                )

        saved = _bulk_mark(grade, klass, data["date"], data["records"], request.user)
        return Response({"saved": saved, "date": str(data["date"])})

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        # Teacher stats: limit to their own classes or all grades
        klass_id = request.query_params.get("klass")
        grade_id = request.query_params.get("grade")

        if grade_id:
            qs = StudentAttendance.objects.filter(grade_id=grade_id)
        elif klass_id:
            qs = StudentAttendance.objects.filter(
                class_course_id=klass_id, class_course__teacher=request.user
            )
        else:
            qs = StudentAttendance.objects.filter(class_course__teacher=request.user)

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
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")
        grade, klass, err = _resolve_target(request)
        if err:
            return err

        rows = _summary_rows(grade, klass, from_str, to_str)
        return Response({
            "grade": str(grade.id) if grade else None,
            "grade_name": grade.name if grade else None,
            "klass": str(klass.id) if klass else None,
            "klass_name": klass.name if klass else None,
            "from": from_str,
            "to": to_str,
            "rows": rows,
        })


# ═══════════════════════════════════════════════════════════════
# Teacher: enrolled students (real enrollments only)
# ═══════════════════════════════════════════════════════════════

class TeacherStudentsViewSet(viewsets.ViewSet):
    """
    GET /api/v1/teacher/students/
    Returns ONLY students actively enrolled in classes the requesting
    teacher teaches. Groups by grade, tags each student with the classes
    they're in (for this teacher).
    """
    permission_classes = [IsTeacherOnly]

    def list(self, request):
        from classes.models import StudentEnrollment

        # Filter param: ?grade=<uuid>
        grade_id = request.query_params.get("grade")

        enrollments = (
            StudentEnrollment.objects
            .filter(
                class_course__teacher=request.user,
                status=StudentEnrollment.STATUS_ACTIVE,
            )
            .select_related("student", "class_course", "student__grade")
            .order_by("student__first_name", "student__last_name")
        )

        if grade_id:
            enrollments = enrollments.filter(student__grade_id=grade_id)

        # Aggregate per student
        by_student = {}
        for e in enrollments:
            s = e.student
            entry = by_student.setdefault(s.id, {
                "student": str(s.id),
                "student_name": _full_name(s),
                "email": s.email,
                "grade_id": str(s.grade_id) if s.grade_id else None,
                "grade_name": s.grade.name if s.grade_id else None,
                "classes": [],
            })
            entry["classes"].append({
                "id": str(e.class_course_id),
                "name": e.class_course.name,
                "subject": e.class_course.subject,
            })

        rows = list(by_student.values())
        rows.sort(key=lambda r: r["student_name"].lower())

        # Grade buckets for the chip filter
        grades_seen = {}
        for r in rows:
            if r["grade_id"]:
                grades_seen[r["grade_id"]] = r["grade_name"]

        return Response({
            "count": len(rows),
            "grades": [{"id": gid, "name": gname}
                       for gid, gname in sorted(grades_seen.items(), key=lambda x: x[1])],
            "rows": rows,
        })

