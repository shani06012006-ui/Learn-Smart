"""
Admin CRUD for ClassSection.
"""
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from institutions.models import Grade
from .models import ClassSection, StudentEnrollment
from django.db import transaction


def _section_dict(s):
    return {
        "id": str(s.id),
        "name": s.name,
        "grade_id": str(s.grade_id),
        "grade_name": s.grade.name,
        "grade_level": s.grade.level,
        "capacity": s.capacity,
        "room": s.room,
        "is_active": s.is_active,
        "student_count": s.section_enrollments.filter(
            status=StudentEnrollment.STATUS_ACTIVE
        ).count(),
        "created_at": s.created_at.isoformat(),
    }


def _is_admin(user):
    return getattr(user, "role", None) == "admin" or user.is_superuser


class AdminSectionsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        qs = ClassSection.objects.select_related("grade").all()
        if request.user.institution_id:
            qs = qs.filter(grade__institution_id=request.user.institution_id)
        grade_id = request.query_params.get("grade")
        if grade_id:
            qs = qs.filter(grade_id=grade_id)
        return Response({
            "count": qs.count(),
            "results": [_section_dict(s) for s in qs.order_by("grade__level", "name")],
        })

    def post(self, request):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        grade_id = request.data.get("grade_id") or request.data.get("grade")
        name = (request.data.get("name") or "").strip()
        if not grade_id or not name:
            return Response({"detail": "grade_id and name required."}, status=400)
        try:
            grade = Grade.objects.get(id=grade_id)
        except Grade.DoesNotExist:
            return Response({"detail": "Grade not found."}, status=404)
        if request.user.institution_id and grade.institution_id != request.user.institution_id:
            return Response({"detail": "Grade not in your institution."}, status=403)
        if ClassSection.objects.filter(grade=grade, name=name).exists():
            return Response({"detail": f"Section '{name}' already exists."}, status=409)
        section = ClassSection.objects.create(
            grade=grade,
            name=name,
            capacity=int(request.data.get("capacity") or 40),
            room=(request.data.get("room") or "").strip(),
            is_active=bool(request.data.get("is_active", True)),
        )
        return Response(_section_dict(section), status=201)


class AdminSectionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def _get(self, request, pk):
        qs = ClassSection.objects.select_related("grade")
        if request.user.institution_id:
            qs = qs.filter(grade__institution_id=request.user.institution_id)
        try:
            return qs.get(pk=pk)
        except ClassSection.DoesNotExist:
            return None

    def get(self, request, pk):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        s = self._get(request, pk)
        if not s:
            return Response({"detail": "Not found."}, status=404)
        return Response(_section_dict(s))

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        s = self._get(request, pk)
        if not s:
            return Response({"detail": "Not found."}, status=404)
        if "name" in request.data:
            s.name = (request.data.get("name") or "").strip()
        if "capacity" in request.data:
            s.capacity = int(request.data.get("capacity") or 40)
        if "room" in request.data:
            s.room = (request.data.get("room") or "").strip()
        if "is_active" in request.data:
            s.is_active = bool(request.data.get("is_active"))
        s.save()
        return Response(_section_dict(s))

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        s = self._get(request, pk)
        if not s:
            return Response({"detail": "Not found."}, status=404)
        s.delete()
        return Response(status=204)


class SectionAssignStudentsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request, pk):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        try:
            section = ClassSection.objects.get(pk=pk)
        except ClassSection.DoesNotExist:
            return Response({"detail": "Section not found."}, status=404)
        ids = request.data.get("enrollment_ids") or []
        if not isinstance(ids, list):
            return Response({"detail": "enrollment_ids must be a list."}, status=400)
        updated = StudentEnrollment.objects.filter(
            id__in=ids,
            class_course__grade=section.grade,
        ).update(section=section)
        return Response({"assigned": updated})
    

class SectionStudentsView(APIView):
    """
    GET  /api/v1/admin/sections/<uuid:pk>/students/  → list students in section
    POST /api/v1/admin/sections/<uuid:pk>/students/  → assign/unassign students

    POST body:
      {
        "assign":   ["enrollment_uuid", ...],   # add these to this section
        "unassign": ["enrollment_uuid", ...]    # set their section to null
      }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def _get_section(self, request, pk):
        qs = ClassSection.objects.select_related("grade")
        if request.user.institution_id:
            qs = qs.filter(grade__institution_id=request.user.institution_id)
        try:
            return qs.get(pk=pk)
        except ClassSection.DoesNotExist:
            return None

    def get(self, request, pk):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        section = self._get_section(request, pk)
        if not section:
            return Response({"detail": "Not found."}, status=404)

        # Students currently assigned to this section
        assigned = (
            StudentEnrollment.objects
            .filter(section=section, status=StudentEnrollment.STATUS_ACTIVE)
            .select_related("student")
        )
        assigned_rows = []
        for e in assigned:
            s = e.student
            full = (f"{s.first_name or ''} {s.last_name or ''}").strip() or s.email
            assigned_rows.append({
                "enrollment_id": str(e.id),
                "student_id": str(s.id),
                "full_name": full,
                "email": s.email,
            })

        # Candidates: active enrollments in this grade that are NOT yet in this section
        candidates = (
            StudentEnrollment.objects
            .filter(
                class_course__grade=section.grade,
                status=StudentEnrollment.STATUS_ACTIVE,
            )
            .exclude(section=section)
            .select_related("student", "class_course")
        )
        # dedupe by student
        seen = set()
        candidate_rows = []
        for e in candidates:
            sid = str(e.student_id)
            if sid in seen:
                continue
            seen.add(sid)
            s = e.student
            full = (f"{s.first_name or ''} {s.last_name or ''}").strip() or s.email
            candidate_rows.append({
                "enrollment_id": str(e.id),
                "student_id": sid,
                "full_name": full,
                "email": s.email,
                "current_section_id": str(e.section_id) if e.section_id else None,
            })

        return Response({
            "section": _section_dict(section),
            "assigned": assigned_rows,
            "candidates": candidate_rows,
        })

    def post(self, request, pk):
        if not _is_admin(request.user):
            return Response({"detail": "Admin access only."}, status=403)
        section = self._get_section(request, pk)
        if not section:
            return Response({"detail": "Not found."}, status=404)

        assign_ids = request.data.get("assign") or []
        unassign_ids = request.data.get("unassign") or []

        assigned_n = 0
        unassigned_n = 0
        with transaction.atomic():
            if assign_ids:
                assigned_n = (
                    StudentEnrollment.objects
                    .filter(
                        id__in=assign_ids,
                        class_course__grade=section.grade,
                        status=StudentEnrollment.STATUS_ACTIVE,
                    )
                    .update(section=section)
                )
            if unassign_ids:
                unassigned_n = (
                    StudentEnrollment.objects
                    .filter(id__in=unassign_ids, section=section)
                    .update(section=None)
                )

        return Response({"assigned": assigned_n, "unassigned": unassigned_n})    