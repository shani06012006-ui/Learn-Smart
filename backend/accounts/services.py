"""
Attendance services.

Called from the presence consumer (accounts/consumers.py) when a user is
seen active. These functions own the auto-creation / auto-update logic
for TeacherAttendance and StudentAttendance rows.

Design notes:

- Only `present` status is supported for now. Manual overrides
  (late / half-day / leave / absent) are a future phase.
- Idempotent: calling twice in a second is harmless — the unique
  constraints guarantee no duplicates, and the update path only touches
  the `last_seen_at` / duration fields.
- Institution scoping is implicit: it comes from the user's own
  `institution` FK, never from client input.
"""
import logging

from django.db import transaction
from django.utils import timezone

from classes.models import StudentEnrollment

from .models import StudentAttendance, TeacherAttendance, User

logger = logging.getLogger("accounts.attendance")


# ----------------------------------------------------------------- teacher


@transaction.atomic
def touch_teacher_attendance(teacher_id) -> None:
    """
    Called when a teacher is observed active. Creates today's row on
    first call; updates `last_seen_at` / duration on subsequent calls.

    No-op if the user is not a teacher or is missing.
    """
    now = timezone.now()
    today = timezone.localdate()

    teacher = (
        User.objects.filter(pk=teacher_id, role=User.ROLE_TEACHER)
        .only("id", "role", "institution_id")
        .first()
    )
    if teacher is None:
        return

    att, created = TeacherAttendance.objects.get_or_create(
        teacher=teacher,
        date=today,
        defaults={
            "institution": teacher.institution,
            "first_seen_at": now,
            "last_seen_at": now,
            "status": TeacherAttendance.STATUS_PRESENT,
            "duration_seconds": 0,
        },
    )

    if created:
        logger.info(
            "attendance.teacher.created",
            extra={"teacher_id": str(teacher.id), "date": str(today)},
        )
        return

    # Idempotent update — bump last_seen_at and duration.
    duration = int((now - att.first_seen_at).total_seconds())
    if duration < 0:
        duration = 0  # clock skew safety

    att.last_seen_at = now
    att.duration_seconds = duration
    att.save(update_fields=["last_seen_at", "duration_seconds", "updated_at"])


# ----------------------------------------------------------------- student


@transaction.atomic
def touch_student_attendance(student_id) -> None:
    """
    Called when a student is observed active. Creates today's row for
    every class where the student has an *active* enrollment.

    No-op if the user is not a student or has no active enrollments.
    """
    now = timezone.now()
    today = timezone.localdate()

    student = (
        User.objects.filter(pk=student_id, role=User.ROLE_STUDENT)
        .only("id", "role", "institution_id")
        .first()
    )
    if student is None:
        return

    enrollments = (
        StudentEnrollment.objects.filter(
            student=student,
            status=StudentEnrollment.STATUS_ACTIVE,
        )
        .select_related("class_course")
        .only("id", "class_course_id", "class_course__institution_id")
    )

    created_count = 0
    for enrollment in enrollments:
        course = enrollment.class_course
        att, created = StudentAttendance.objects.get_or_create(
            student=student,
            class_course=course,
            date=today,
            defaults={
                "institution": course.institution or student.institution,
                "joined_at": now,
                "status": StudentAttendance.STATUS_PRESENT,
                "source": StudentAttendance.SOURCE_AUTO,
                "duration_seconds": 0,
            },
        )

        if created:
            created_count += 1
            continue

        # Idempotent update — bump duration from joined_at.
        duration = int((now - att.joined_at).total_seconds())
        if duration < 0:
            duration = 0
        att.duration_seconds = duration
        att.save(update_fields=["duration_seconds", "updated_at"])

    if created_count:
        logger.info(
            "attendance.student.created",
            extra={
                "student_id": str(student.id),
                "date": str(today),
                "count": created_count,
            },
        )