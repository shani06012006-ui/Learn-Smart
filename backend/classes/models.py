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



class TimetableEntry(TimeStampedModel):
    """
    A weekly timetable slot for a class. One row = (class, day, time range).

    Soft-deleted via `is_active=False` so historical rows remain for
    audits. Overlapping conflicts (same teacher / same class / same room
    on the same day) are prevented at the serializer level — Django
    UniqueConstraint cannot express interval overlap cleanly.

    `room` is a free-text CharField. A dedicated Room model would be
    added in a future phase if room inventory becomes a first-class
    concept.
    """

    DAY_MONDAY = 0
    DAY_TUESDAY = 1
    DAY_WEDNESDAY = 2
    DAY_THURSDAY = 3
    DAY_FRIDAY = 4
    DAY_SATURDAY = 5
    DAY_SUNDAY = 6
    DAY_CHOICES = [
        (DAY_MONDAY, "Monday"),
        (DAY_TUESDAY, "Tuesday"),
        (DAY_WEDNESDAY, "Wednesday"),
        (DAY_THURSDAY, "Thursday"),
        (DAY_FRIDAY, "Friday"),
        (DAY_SATURDAY, "Saturday"),
        (DAY_SUNDAY, "Sunday"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="timetable_entries",
    )
    class_course = models.ForeignKey(
        ClassCourse,
        on_delete=models.CASCADE,
        related_name="timetable_entries",
    )

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="timetable_entries",
    )
    day_of_week = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(
        default=True,
        help_text="Soft-delete flag. Inactive rows are hidden from the UI.",
    )

    class Meta:
        ordering = ["day_of_week", "start_time"]
        indexes = [
            models.Index(fields=["institution", "day_of_week"]),
            models.Index(fields=["teacher", "day_of_week"]),
            models.Index(fields=["class_course", "day_of_week"]),
        ]
        constraints = [

            models.UniqueConstraint(
                fields=["class_course", "day_of_week", "start_time"],
                name="unique_timetable_class_slot",
            ),
        ]

    def __str__(self):
        return (
            f"{self.class_course.name} · {self.get_day_of_week_display()} "
            f"{self.start_time:%H:%M}-{self.end_time:%H:%M}"
        )
        


class LiveClass(TimeStampedModel):
    """
    An actual class session for a scheduled timetable occurrence.

    Design:
      - One LiveClass per scheduled occurrence (not per student).
      - Students are derived through active StudentEnrollment on the same
        class_course — they are NOT stored on this model.
      - Linked to a TimetableEntry so we know which recurring slot it
        came from.

    Lifecycle:
      - status: upcoming -> live -> completed (or cancelled)
      - `stored_status` is authoritative ONLY for `cancelled`.
      - `computed_status()` derives upcoming/live/completed from the
        scheduled window versus now.

    Future extensions (not built now):
      - meeting_url / stream_key for real-time
      - recording_url / recording_duration
      - started_at / ended_at (actual times vs scheduled)
    """

    STATUS_UPCOMING = "upcoming"
    STATUS_LIVE = "live"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_UPCOMING, "Upcoming"),
        (STATUS_LIVE, "Live"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    timetable_entry = models.ForeignKey(
        TimetableEntry,
        on_delete=models.CASCADE,
        related_name="live_classes",
        help_text="Recurring slot this session was materialized from.",
    )
    class_course = models.ForeignKey(
        ClassCourse,
        on_delete=models.CASCADE,
        related_name="live_classes",
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="live_classes_teaching",
    )
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="live_classes",
    )

    # The actual calendar date for this occurrence (not the weekly slot).
    scheduled_date = models.DateField(db_index=True)
    scheduled_start = models.DateTimeField(db_index=True)
    scheduled_end = models.DateTimeField()

    room = models.CharField(max_length=100, blank=True, default="")

    # Only 'cancelled' is authoritative in this field. The upcoming /
    # live / completed states are derived from the scheduled window.
    stored_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_UPCOMING,
    )

    # Placeholder fields for a future real-time integration.
    meeting_url = models.URLField(blank=True, default="")
    recording_url = models.URLField(blank=True, default="")

    class Meta:
        ordering = ["-scheduled_start"]
        constraints = [
            models.UniqueConstraint(
                fields=["timetable_entry", "scheduled_date"],
                name="unique_live_class_per_slot_per_day",
            )
        ]
        indexes = [
            models.Index(fields=["institution", "scheduled_date"]),
            models.Index(fields=["teacher", "scheduled_date"]),
            models.Index(fields=["class_course", "scheduled_date"]),
        ]

    def __str__(self):
        return (
            f"{self.class_course.name} · "
            f"{self.scheduled_start:%Y-%m-%d %H:%M}"
        )

    def computed_status(self):
        """
        Derive the effective status.

        Only `cancelled` is authoritative from `stored_status`. Everything
        else is computed from the scheduled window compared to `now`.
        """
        from django.utils import timezone

        if self.stored_status == self.STATUS_CANCELLED:
            return self.STATUS_CANCELLED

        now = timezone.now()
        if now < self.scheduled_start:
            return self.STATUS_UPCOMING
        if now <= self.scheduled_end:
            return self.STATUS_LIVE
        return self.STATUS_COMPLETED        