import logging

from django.db import transaction
from django.utils import timezone

from classes.models import LiveClass, StudentEnrollment

from .models import StudentAttendance, TeacherAttendance, User

logger = logging.getLogger("accounts.attendance")


# ----------------------------------------------------------------- helpers


def _active_live_class_for_teacher(teacher, now):

    return (
        LiveClass.objects.filter(
            teacher=teacher,
            scheduled_start__lte=now,
            scheduled_end__gte=now,
        )
        .exclude(stored_status=LiveClass.STATUS_CANCELLED)
        .order_by("-scheduled_start")
        .first()
    )


def _active_live_class_for_student_class(student, class_course, now):

    return (
        LiveClass.objects.filter(
            class_course=class_course,
            scheduled_start__lte=now,
            scheduled_end__gte=now,
        )
        .exclude(stored_status=LiveClass.STATUS_CANCELLED)
        .order_by("-scheduled_start")
        .first()
    )


# ----------------------------------------------------------------- teacher


@transaction.atomic
def touch_teacher_attendance(teacher_id) -> None:

    now = timezone.now()
    today = timezone.localdate()

    teacher = (
        User.objects.filter(pk=teacher_id, role=User.ROLE_TEACHER)
        .only("id", "role", "institution_id")
        .first()
    )
    if teacher is None:
        return

    active_session = _active_live_class_for_teacher(teacher, now)

    att, created = TeacherAttendance.objects.get_or_create(
        teacher=teacher,
        date=today,
        defaults={
            "institution": teacher.institution,
            "first_seen_at": now,
            "last_seen_at": now,
            "status": TeacherAttendance.STATUS_PRESENT,
            "duration_seconds": 0,
            "live_class": active_session,
        },
    )

    if created:
        logger.info(
            "attendance.teacher.created",
            extra={
                "teacher_id": str(teacher.id),
                "date": str(today),
                "live_class_id": str(active_session.id) if active_session else None,
            },
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

        # Look up an active LiveClass for this specific class.
        active_session = _active_live_class_for_student_class(
            student, course, now
        )

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
                "live_class": active_session,
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