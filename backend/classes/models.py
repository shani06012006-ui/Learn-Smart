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
    grade = models.ForeignKey(
        "institutions.Grade",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="class_courses",
        help_text=(
            "Optional grade/standard this class is taught at. "
            "If set, all students in that grade auto-enroll."
        ),
    )
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

class ClassSection(TimeStampedModel):
    """
    A section within a Grade — e.g. "5-A", "5-B", "5-C".
    Students can be tagged with a section for filtering.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    grade = models.ForeignKey(
        "institutions.Grade",
        on_delete=models.CASCADE,
        related_name="sections",
    )
    name = models.CharField(max_length=50, help_text="Short label — e.g. 'A', 'B', '5-A'.")
    capacity = models.PositiveIntegerField(default=40)
    room = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["grade__level", "name"]
        unique_together = [("grade", "name")]
        indexes = [
            models.Index(fields=["grade"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.grade.name} - Section {self.name}"


class TeacherAbsence(TimeStampedModel):
    """Records a teacher's absence on a specific date."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="absences",
    )
    date = models.DateField()
    reason = models.TextField(blank=True)
    is_approved = models.BooleanField(default=True)

    class Meta:
        ordering = ["-date"]
        unique_together = [("teacher", "date")]
        indexes = [
            models.Index(fields=["teacher", "date"]),
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.teacher.email} absent on {self.date}"


class TeacherSubstitution(TimeStampedModel):
    """A substitute teacher assigned for one specific TimetableEntry on a date."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timetable_entry = models.ForeignKey(
        "TimetableEntry",
        on_delete=models.CASCADE,
        related_name="substitutions",
    )
    date = models.DateField()
    original_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="substituted_out",
    )
    substitute_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="substituted_in",
        limit_choices_to={"role": "teacher"},
    )
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="substitutions_created",
    )
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-date"]
        unique_together = [("timetable_entry", "date")]
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["timetable_entry"]),
        ]

    def __str__(self):
        return f"{self.substitute_teacher.email} subs {self.original_teacher.email} on {self.date}"
    
    
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
    section = models.ForeignKey(
        "ClassSection",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="section_enrollments",
        help_text="Which section of the grade this period belongs to.",
    )
    period_number = models.PositiveIntegerField(
        default=1,
        help_text="1-indexed period within the day (1 = first period).",
    )

    roll_number = models.CharField(
        max_length=32,
        blank=True,
        db_index=True,
        help_text="Optional human-readable roll number (e.g. STU-2026-001, or just 01).",
    )
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

    section = models.ForeignKey(
        "ClassSection",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="timetable_entries",
        help_text="Which section of the grade this period belongs to.",
    )
    period_number = models.PositiveIntegerField(
        default=1,
        help_text="1-indexed period within the day (1 = first period).",
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
                fields=["class_course", "section", "day_of_week", "period_number"],
                name="unique_class_section_day_period",
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

class Material(SoftDeleteModel, TimeStampedModel):
    """
    A file uploaded by a teacher for one of their classes.

    Soft-deleted so that historical references (assignments, activity logs)
    to a since-removed material remain resolvable via `.all_objects`.

    File storage:
        - Files land under MEDIA_ROOT/materials/<year>/<month>/<random>.<ext>
        - The original filename is stored in `file_name` for UI display.
        - `file_size` and `mime_type` are captured on upload for downstream use.

    Validation (extension whitelist, 50 MB cap) lives in the upload
    serializer -- not on the model -- so the model stays storage-mechanism
    agnostic.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_course = models.ForeignKey(
        ClassCourse,
        on_delete=models.CASCADE,
        related_name="materials",
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_materials",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    file = models.FileField(upload_to="materials/%Y/%m/")
    file_name = models.CharField(max_length=255, blank=True, default="")
    file_size = models.PositiveBigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["class_course", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.class_course.name})"


class Announcement(TimeStampedModel):
    """
    A teacher-authored announcement for one of their classes, or for
    all their classes (class_course is null).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="announcements",
    )
    class_course = models.ForeignKey(
        ClassCourse,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="announcements",
        help_text="Null = announcement targets all of this teacher's classes.",
    )
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["teacher"]),
            models.Index(fields=["class_course"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return self.title

