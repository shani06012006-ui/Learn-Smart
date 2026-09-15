from rest_framework.permissions import BasePermission

from core.permissions import IsTeacher  # re-exported for convenience

__all__ = ["IsTeacher", "IsClassOwner", "CanViewClass"]


class IsClassOwner(BasePermission):
    """Object-level: request.user must be the teacher who owns this ClassCourse."""

    message = "You are not the teacher assigned to this class."

    def has_object_permission(self, request, view, obj):
        class_course = obj if hasattr(obj, "teacher_id") else obj.class_course
        return class_course.teacher_id == request.user.id


class CanViewClass(BasePermission):
    """
    Object-level read access: the owning teacher, OR a student with an
    active enrollment in the class. Used on endpoints both roles need to
    read (e.g. class detail) but only the teacher can write to — pair with
    a method-based check in the view, or with IsClassOwner for write-only
    endpoints.
    """

    message = "You do not have access to this class."

    def has_object_permission(self, request, view, obj):
        class_course = obj if hasattr(obj, "teacher_id") else obj.class_course

        if class_course.teacher_id == request.user.id:
            return True

        if request.user.role == "student":
            return class_course.enrollments.filter(
                student_id=request.user.id, status="active"
            ).exists()

        return False
