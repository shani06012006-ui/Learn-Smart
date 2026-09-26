"""
Leave management models.

Two concrete leave types — StudentLeave and TeacherLeave — share an
abstract base (BaseLeave) so the common fields and validation logic live
in one place. They are stored in separate tables so that:

    - FKs (student vs teacher) stay clean with distinct related_names.
    - Reporting queries can target one audience without a role filter.
    - Future extensions (leave balance, per-audience policy) can diverge.

Overlap prevention is enforced at the serializer layer (Django cannot
express interval overlap as a DB constraint without raw SQL). The
serializer rejects a new request if an existing *pending* or *approved*
leave for the same person overlaps the requested [start_date, end_date].
Cancelled and rejected rows do not block re-application.
"""
import uuid

from django.core.exceptions import ValidationError
from django.db import models

from core.models import TimeStampedModel


class BaseLeave(TimeStampedModel):
    """
    Abstract base for leave requests.

    Concrete subclasses (StudentLeave, TeacherLeave) add their respective
    FK to accounts.User plus a per-audience `reviewer` related_name.
    """

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    LEAVE_SICK = "sick"
    LEAVE_CASUAL = "casual"
    LEAVE_VACATION = "vacation"
    LEAVE_OTHER = "other"
    LEAVE_TYPE_CHOICES = [
        (LEAVE_SICK, "Sick"),
        (LEAVE_CASUAL, "Casual"),
        (LEAVE_VACATION, "Vacation"),
        (LEAVE_OTHER, "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Institution is denormalized from the requester's institution for
    # fast scoping queries. Set server-side on create.
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="+",
    )

    leave_type = models.CharField(
        max_length=20,
        choices=LEAVE_TYPE_CHOICES,
    )
    start_date = models.DateField(db_index=True)
    end_date = models.DateField()
    days = models.PositiveIntegerField(
        default=1,
        help_text="Derived from start_date/end_date on save.",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )
    reason = models.TextField(blank=True, default="")

    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    admin_remarks = models.TextField(blank=True, default="")

    class Meta:
        abstract = True
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.leave_type} [{self.start_date} → {self.end_date}] ({self.status})"

    def save(self, *args, **kwargs):
        # `days` is derived, never trusted from the client.
        if self.start_date and self.end_date:
            self.days = (self.end_date - self.start_date).days + 1
        super().save(*args, **kwargs)

    def clean(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError(
                {"end_date": "End date cannot be before start date."}
            )


class StudentLeave(BaseLeave):
    """A leave request from a student."""

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"},
        related_name="student_leaves",
    )

    # Shadow the base FK to give it a per-audience related_name.
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="student_leaves",
    )
    reviewer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_student_leaves",
    )

    class Meta(BaseLeave.Meta):
        indexes = [
            models.Index(fields=["institution", "status"]),
            models.Index(fields=["student", "start_date"]),
        ]

    def __str__(self):
        return f"StudentLeave({self.student_id}) {self.start_date} → {self.end_date} [{self.status}]"


class TeacherLeave(BaseLeave):
    """A leave request from a teacher."""

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="teacher_leaves",
    )

    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="teacher_leaves",
    )
    reviewer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_teacher_leaves",
    )

    class Meta(BaseLeave.Meta):
        indexes = [
            models.Index(fields=["institution", "status"]),
            models.Index(fields=["teacher", "start_date"]),
        ]

    def __str__(self):
        return f"TeacherLeave({self.teacher_id}) {self.start_date} → {self.end_date} [{self.status}]"
