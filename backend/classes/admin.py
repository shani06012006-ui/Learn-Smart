from django.contrib import admin

from .models import ClassCourse, StudentEnrollment


@admin.register(ClassCourse)
class ClassCourseAdmin(admin.ModelAdmin):
    list_display = ("name", "subject", "teacher", "institution", "is_archived", "is_deleted", "created_at")
    list_filter = ("is_archived", "is_deleted", "subject")
    search_fields = ("name", "subject", "teacher__email")

    def get_queryset(self, request):
        # Use all_objects here so soft-deleted classes remain visible/manageable
        # from the admin site even though they're hidden from the normal API.
        return ClassCourse.all_objects.select_related("teacher", "institution")


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "class_course", "joining_code", "status", "joined_at")
    list_filter = ("status",)
    search_fields = ("student__email", "joining_code", "class_course__name")
