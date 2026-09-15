"""
Shared, reusable DRF permission classes.

Domain-specific object-level permissions (e.g. "is this the teacher who
owns this exact class") live in each app's own permissions.py and compose
with these where useful. Access control is always enforced here at the API
layer — the frontend route guards are a UX convenience only, never trusted.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsInstitutionAdmin(BasePermission):
    message = "Only institution admins may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsTeacher(BasePermission):
    message = "Only teachers may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "teacher")


class IsStudent(BasePermission):
    message = "Only students may perform this action."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "student")


class IsTeacherOfClass(BasePermission):
    """
    Object-level check: the request.user must be the teacher who owns the
    ClassCourse (or an object with a `class_course` FK to it).
    """

    message = "You are not the teacher assigned to this class."

    def has_object_permission(self, request, view, obj):
        class_course = obj if hasattr(obj, "teacher") else getattr(obj, "class_course", None)
        if class_course is None:
            return False
        return class_course.teacher_id == request.user.id


class IsEnrolledStudent(BasePermission):
    """
    Object-level check: the request.user must have an *active* enrollment
    in the ClassCourse (or an object with a `class_course` FK to it).
    """

    message = "You are not an active student in this class."

    def has_object_permission(self, request, view, obj):
        class_course = obj if hasattr(obj, "enrollments") else getattr(obj, "class_course", None)
        if class_course is None:
            return False
        return class_course.enrollments.filter(
            student_id=request.user.id, status="active"
        ).exists()


class ReadOnlyOrIsTeacherOfClass(BasePermission):
    """Students (and others) can read; only the owning teacher can write."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        class_course = obj if hasattr(obj, "teacher") else getattr(obj, "class_course", None)
        return bool(class_course and class_course.teacher_id == request.user.id)
