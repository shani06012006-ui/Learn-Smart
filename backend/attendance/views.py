# backend/attendance/views.py
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
    grade_id = request.query_params.get("grade")
    klass_id = (
        request.query_params.get("klass")
        or request.query_params.get("class_course")
        or request.query_params.get("class_id")
    )

    if not grade_id and not klass_id:
        return None, None, None, Response(
            {"error": {"detail": "Provide ?grade= or ?klass=", "status_code": 400}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if grade_id:
        try:
            grade = Grade.objects.get(id=grade_id)
            # Section is currently disabled because the Section model doesn't exist
            return grade, None, None, None
        except Grade.DoesNotExist:
            return None, None, None, Response(
                {"error": {"detail": "Grade not found.", "status_code": 404}},
                status=status.HTTP_404_NOT_FOUND,
            )

    try:
        klass = ClassCourse.objects.get(id=klass_id)
        return None, klass, None, None
    except ClassCourse.DoesNotExist:
        return None, None, None, Response(
            {"error": {"detail": "Class not found.", "status_code": 404}},
            status=status.HTTP_404_NOT_FOUND,
        )

def _students_for_grade(grade, section=None):
    """Fetch active students for a grade. (Section filtering disabled)."""
    qs = User.objects.filter(
        role=getattr(User, "ROLE_STUDENT", "student"),
        is_active=True,
        grade=grade,
    )
    return qs.order_by("first_name", "last_name")

def _students_for_class(klass):
    return [
        e.student for e in StudentEnrollment.objects.filter(
            class_course=klass,
            status=StudentEnrollment.STATUS_ACTIVE,
        ).select_related("student")
    ]

def _full_name(u):
    return (f"{u.first_name or ''} {u.last_name or ''}".strip()) or u.email

def _record_rows(grade, klass, date_str, section=None):
    if grade:
        students = list(_students_for_grade(grade, section))
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
            "student_email": s.email,
            "status": rec.status if rec else None,
            "note": rec.note if rec else "",
            "record_id": str(rec.id) if rec else None,
        })
    rows.sort(key=lambda r: r["student_name"].lower())
    return rows

def _roll_number_for(student, klass):
    if not klass:
        return ""
    try:
        enroll = student.enrollments.filter(class_course=klass).first()
        return enroll.roll_number if enroll else ""
    except Exception:
        return ""

def _record_rows_for_admin(grade, klass, date_str):
    """Helper specifically for the admin daily record view."""
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
            "marked_by": (_full_name(a.marked_by) if a.marked_by else None),
            "marked_by_id": str(a.marked_by_id) if a.marked_by_id else None,
            "marked_at": a.updated_at.isoformat() if a.updated_at else None,
            "source": a.source,
        })
    return rows

def _submitted_meta(grade, klass, date_str):
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

        grade, klass, section, err = _resolve_target(request)
        if err:
            return err

        rows = _record_rows_for_admin(grade, klass, date_str)
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
        grade, klass, section, err = _resolve_target(request)
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
        grade, klass, section, err = _resolve_target(request)
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
        
        grade, klass, section, err = _resolve_target(request)
        if err:
            return err

        rows = _record_rows(grade, klass, date_str, section=section)
        
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
        grade, klass, section, err = _resolve_target(request)
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
    permission_classes = [IsTeacherOnly]

    def list(self, request):
        from accounts.models import User, StudentAttendance, StudentCredentials
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

        students_qs = User.objects.filter(
            role=User.ROLE_STUDENT,
            is_active=True,
        ).select_related("grade", "institution")

        if getattr(user, "institution_id", None):
            students_qs = students_qs.filter(institution_id=user.institution_id)

        if grade_id:
            students_qs = students_qs.filter(grade_id=grade_id)
        if q_str:
            students_qs = students_qs.filter(
                Q(first_name__icontains=q_str)
                | Q(last_name__icontains=q_str)
                | Q(email__icontains=q_str)
            )

        enrollments_by_student = {}
        if class_course_id:
            enrollments = StudentEnrollment.objects.filter(
                class_course_id=class_course_id,
                status=StudentEnrollment.STATUS_ACTIVE,
            ).select_related("student", "class_course", "class_course__teacher")
            
            enrollments_by_student = {
                str(e.student_id): e for e in enrollments
            }
            students_qs = students_qs.filter(id__in=list(enrollments_by_student.keys()))

        student_ids = [str(s.id) for s in students_qs]
        all_enrollments = StudentEnrollment.objects.filter(
            student_id__in=student_ids,
            status=StudentEnrollment.STATUS_ACTIVE,
        ).select_related("student", "class_course", "class_course__teacher")

        enrollment_by_student = {}
        for e in all_enrollments:
            if str(e.student_id) not in enrollment_by_student:
                enrollment_by_student[str(e.student_id)] = e

        attendance_map = {}
        if student_ids:
            att_rows = StudentAttendance.objects.filter(
                student_id__in=student_ids,
            ).values("student_id", "status")
            counts = defaultdict(lambda: {"total": 0, "present": 0})
            for r in att_rows:
                key = str(r["student_id"])
                counts[key]["total"] += 1
                if r["status"] == StudentAttendance.STATUS_PRESENT:
                    counts[key]["present"] += 1
            attendance_map = dict(counts)

        pin_map = {}
        pin_active_map = {}
        if student_ids:
            for cred in StudentCredentials.objects.filter(student_id__in=student_ids):
                pin_map[str(cred.student_id)] = cred.pin or ""
                pin_active_map[str(cred.student_id)] = bool(cred.is_active)

        results = []
        for s in students_qs:
            sid = str(s.id)
            enrollment = enrollment_by_student.get(sid)
            cls = enrollment.class_course if enrollment else None

            pct = 0.0
            agg = attendance_map.get(sid)
            if agg and agg["total"] > 0:
                pct = round((agg["present"] / agg["total"]) * 100, 1)

            full_name = (f"{s.first_name or ''} {s.last_name or ''}".strip()) or s.email
            teacher = cls.teacher if cls else None
            teacher_name = (
                (f"{teacher.first_name or ''} {teacher.last_name or ''}".strip() or teacher.email)
                if teacher else ""
            )

            results.append({
                "id": sid,
                "enrollment_id": str(enrollment.id) if enrollment else None,
                "full_name": full_name,
                "email": s.email,
                "roll_number": getattr(enrollment, "roll_number", "") if enrollment else "",
                "class_id": str(cls.id) if cls else None,
                "class_name": cls.name if cls else "",
                "class_teacher_id": str(teacher.id) if teacher else None,
                "class_teacher_name": teacher_name,
                "attendance_pct": pct,
                "student_pin": pin_map.get(sid, ""),
                "student_pin_active": pin_active_map.get(sid, False),
                "grade_name": s.grade.name if s.grade else "",
            })

        results.sort(key=lambda r: r["full_name"].lower())

        grades_qs = Grade.objects.all()
        if getattr(user, "institution_id", None):
            grades_qs = grades_qs.filter(institution_id=user.institution_id)
        grades = [{"id": str(g.id), "name": g.name} for g in grades_qs.order_by("level", "name")]

        return Response({"count": len(results), "grades": grades, "results": results})