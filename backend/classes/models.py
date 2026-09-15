import uuid

from django.db import models

from core.models import SoftDeleteModel, TimeStampedModel


class ClassCourse(SoftDeleteModel, TimeStampedModel):
    """A teacher's class/course. Soft-deleted (never hard-deleted) so that
    materials, exams, and grades tied to it stay intact for historical
    reporting even after a teacher removes it from their active list."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="classes",
        null=True,
        blank=True,
        help_text=(
            "Nullable until Module J (Institution Management) exists — a "
            "self-registered teacher has no institution to attach yet. "
            "Once Module J ships, backfill this and consider making it required."
        ),
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="classes_taught",
    )
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_archived = models.BooleanField(
        default=False,
        help_text="Archived = read-only but still visible. Distinct from is_deleted (soft-delete).",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["teacher"]),
            models.Index(fields=["institution"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.teacher.get_full_name()})"


class StudentEnrollment(TimeStampedModel):
    """Links a student to a class via a unique 6-character joining code.
    Not soft-deleted itself — status transitions (pending/active/blocked/
    removed) capture the lifecycle instead, which is what the teacher
    roster UI and analytics both need to query against."""

    STATUS_PENDING = "pending"
    STATUS_ACTIVE = "active"
    STATUS_BLOCKED = "blocked"
    STATUS_REMOVED = "removed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_BLOCKED, "Blocked"),
        (STATUS_REMOVED, "Removed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"},
        related_name="enrollments",
    )
    class_course = models.ForeignKey(
        ClassCourse, on_delete=models.CASCADE, related_name="enrollments"
    )
    joining_code = models.CharField(max_length=6, unique=True, db_index=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    joined_at = models.DateTimeField(null=True, blank=True)

    # StudentEnrollment is never soft-deleted, so `objects` and `all_objects`
    # are identical here — `all_objects` exists purely so
    # core.utils.generate_unique_code()'s convention (prefer all_objects
    # when present) works uniformly across models. NOTE: once you declare
    # any manager explicitly on a model, Django stops auto-adding the
    # implicit `objects` manager, so it must be declared explicitly too.
    objects = models.Manager()
    all_objects = models.Manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "class_course"], name="unique_student_per_class"
            )
        ]
        indexes = [models.Index(fields=["joining_code"])]

    def __str__(self):
        return f"{self.student.email} -> {self.class_course.name} [{self.status}]"
