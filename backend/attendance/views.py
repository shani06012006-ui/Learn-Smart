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
    klass_id = (
        request.query_params.get("klass")
        or request.query_params.get("class_course")
        or request.query_params.get("class_id")
    )

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


def _roll_number_for(student, klass):
    """Return the student's roll_number for a given class enrollment, or ''."""
    if not klass:
        return ""
    try:
        enroll = student.enrollments.filter(class_course=klass).first()
        return enroll.roll_number if enroll else ""
    except Exception:
        return ""


def _record_rows(grade, klass, date_str):
    """Return ONLY saved records. Used by admin view."""
    if grade:
        qs = StudentAttendance.objects.filter(grade=grade, date=date_str)
    else:
        qs = StudentAttendance.objects.filter(class_course=klass, date=date_str)

    qs = qs.select_related("student", "marked_by", "class_course").order_by(
        "student__first_name", "student__last_name"
    )

    rows = []
    for a in qs:
        rows.append({
            "student": str(a.student_id),
            "student_name": _full_name(a.student),
            "roll_number": _roll_number_for(a.student, a.class_course) if a.class_course else "",
            "status": a.status,
            "note": a.note or "",
            "record_id": str(a.id),
            "marked_by": (
                _full_name(a.marked_by) if a.marked_by else None
            ),
            "marked_by_id": str(a.marked_by_id) if a.marked_by_id else None,
            "marked_at": a.updated_at.isoformat() if a.updated_at else None,
            "source": a.source,
        })
    return rows


def _submitted_meta(grade, klass, date_str):
    """
    Return {teacher_name, teacher_id, submitted_at} for the given target+date,
    based on the most recent marked_by on any record. None if no records.
    """
    if grade:
        qs = StudentAttendance.objects.filter(grade=grade, date=date_str)
    elif klass:
        qs = StudentAttendance.objects.filter(class_course=klass, date=date_str)
    else:
        return None
    rec = qs.select_related("marked_by").order_by("-updated_at").first()
    if not rec or not rec.marked_by:
        return None
    return {
        "teacher_id": str(rec.marked_by_id),
        "teacher_name": _full_name(rec.marked_by),
        "submitted_at": rec.updated_at.isoformat() if rec.updated_at else None,
    }


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
        class_teacher_name = None
        if klass and klass.teacher_id:
            class_teacher_name = _full_name(klass.teacher)
        return Response({
            "grade": str(grade.id) if grade else None,
            "grade_name": grade.name if grade else None,
            "klass": str(klass.id) if klass else None,
            "klass_name": klass.name if klass else None,
            "class_teacher_name": class_teacher_name,
            "date": date_str,
            "count": len(rows),
            "rows": rows,
            "submitted": _submitted_meta(grade, klass, date_str),
        })

    @action(detail=False, methods=["post"], url_path="bulk-save")
    def bulk_save(self, request):
        """Alias for `mark` — spec-friendly URL."""
        return self.mark(request)

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

    Institution-wide student directory for teachers.

    Query params:
      class_course / class_id / klass -- filter to a ClassCourse UUID
      grade                            -- filter by Grade UUID
      scope                            -- "mine" | "all" (default "all")
      q                                -- search email / first / last name

    Response:
      {
        "count": N,
        "grades": [{id, name}, ...],
        "results": [
          {
            "id": <student_uuid>,
            "enrollment_id": <enrollment_uuid>,
            "full_name": "...",
            "email": "...",
            "roll_number": "",
            "class_id": <class_uuid or null>,
            "class_name": "...",
            "class_teacher_id": <teacher_uuid or null>,
            "class_teacher_name": "...",
            "attendance_pct": <float 0-100>
          }, ...
        ]
      }

    Cross-teacher read is allowed within the same institution.
    """
    permission_classes = [IsTeacherOnly]

    def list(self, request):
        from accounts.models import User, StudentAttendance
        from classes.models import ClassCourse, StudentEnrollment
        from institutions.models import Grade
        from django.db.models import Q
        from collections import defaultdict

        user = request.user

        class_course_id = (
            request.query_params.get("class_course")
            or request.query_params.get("class_id")
            or request.query_params.get("klass")
        )
        grade_id = request.query_params.get("grade")
        scope = (request.query_params.get("scope") or "all").lower()
        q_str = (request.query_params.get("q") or "").strip()

        enroll_qs = (
            StudentEnrollment.objects
            .filter(status=StudentEnrollment.STATUS_ACTIVE)
            .select_related(
                "student",
                "class_course",
                "class_course__teacher",
                "class_course__grade",
                "class_course__institution",
            )
        )

        # Institution scope
        if user.institution_id:
            enroll_qs = enroll_qs.filter(
                class_course__institution_id=user.institution_id
            )

        # Optional scope=mine
        if scope == "mine":
            enroll_qs = enroll_qs.filter(class_course__teacher=user)

        # Filters
        if class_course_id:
            enroll_qs = enroll_qs.filter(class_course_id=class_course_id)
        if grade_id:
            enroll_qs = enroll_qs.filter(class_course__grade_id=grade_id)
        if q_str:
            enroll_qs = enroll_qs.filter(
                Q(student__first_name__icontains=q_str)
                | Q(student__last_name__icontains=q_str)
                | Q(student__email__icontains=q_str)
            )

        # Pre-fetch attendance: (student_id, class_id) -> {total, present}
        attendance_map = {}
        student_ids = list({str(e.student_id) for e in enroll_qs})
        class_ids = list({
            str(e.class_course_id) for e in enroll_qs if e.class_course_id
        })

        if student_ids and class_ids:
            att_rows = (
                StudentAttendance.objects
                .filter(
                    student_id__in=student_ids,
                    class_course_id__in=class_ids,
                )
                .values("student_id", "class_course_id", "status")
            )
            counts = defaultdict(lambda: {"total": 0, "present": 0})
            for r in att_rows:
                key = (str(r["student_id"]), str(r["class_course_id"]))
                counts[key]["total"] += 1
                if r["status"] == StudentAttendance.STATUS_PRESENT:
                    counts[key]["present"] += 1
            attendance_map = dict(counts)

        # Build rows
        results = []
        seen = set()
        for e in enroll_qs:
            s = e.student
            cls = e.class_course

            dedupe_key = (str(s.id), str(cls.id) if cls else None)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            pct = 0.0
            if cls:
                agg = attendance_map.get((str(s.id), str(cls.id)))
                if agg and agg["total"] > 0:
                    pct = round((agg["present"] / agg["total"]) * 100, 1)

            full_name = (
                f"{s.first_name or ''} {s.last_name or ''}".strip()
            ) or s.email
            ct = cls.teacher if cls else None
            class_teacher_name = (
                (f"{ct.first_name or ''} {ct.last_name or ''}".strip() or ct.email)
                if ct else ""
            )

            results.append({
                "id": str(s.id),
                "enrollment_id": str(e.id),
                "full_name": full_name,
                "email": s.email,
                "roll_number": getattr(e, "roll_number", "") or "",
                "class_id": str(cls.id) if cls else None,
                "class_name": cls.name if cls else "",
                "class_teacher_id": str(ct.id) if ct else None,
                "class_teacher_name": class_teacher_name,
                "attendance_pct": pct,
            })

        results.sort(key=lambda r: r["full_name"].lower())

        # Grades for filter dropdown
        grades_qs = Grade.objects.all()
        if user.institution_id:
            grades_qs = grades_qs.filter(institution_id=user.institution_id)
        grades = [
            {"id": str(g.id), "name": g.name}
            for g in grades_qs.order_by("level", "name")
        ]

        return Response({
            "count": len(results),
            "grades": grades,
            "results": results,
        })
