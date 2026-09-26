from datetime import datetime, timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from accounts.models import OnlineStatus, StudentProfile, User
from core.utils import generate_unique_code

from .models import LiveClass, StudentEnrollment, TimetableEntry

@transaction.atomic
def add_student_to_class(class_course, email, first_name, last_name):

    student, student_created = User.objects.get_or_create(
        email=email.lower().strip(),
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "role": User.ROLE_STUDENT,
            "institution": class_course.institution,
        },
    )
    if student_created:
        student.set_unusable_password()
        student.save(update_fields=["password"])
        StudentProfile.objects.create(user=student)
        OnlineStatus.objects.create(user=student)

    enrollment, enrollment_created = StudentEnrollment.objects.get_or_create(
        student=student,
        class_course=class_course,
        defaults={
            "joining_code": generate_unique_code(StudentEnrollment, field_name="joining_code"),
        },
    )
    return enrollment, enrollment_created


@transaction.atomic
def join_class_with_code(student, joining_code):

    enrollment = StudentEnrollment.objects.select_related("class_course").get(
        joining_code=joining_code.upper().strip()
    )

    if enrollment.student_id != student.id:
        raise ValueError("This joining code does not belong to your account.")

    if enrollment.status == StudentEnrollment.STATUS_BLOCKED:
        raise ValueError("You have been blocked from this class.")

    if enrollment.status == StudentEnrollment.STATUS_REMOVED:
        raise ValueError("This enrollment is no longer active. Contact your teacher.")

    if enrollment.status != StudentEnrollment.STATUS_ACTIVE:
        enrollment.status = StudentEnrollment.STATUS_ACTIVE
        enrollment.joined_at = timezone.now()
        enrollment.save(update_fields=["status", "joined_at"])

    return enrollment




# ---------------------------------------------------------------- live classes


def _horizon_weeks():
    """Read the configured materialization horizon (default 4 weeks)."""
    return getattr(settings, "LIVE_CLASS_HORIZON_WEEKS", 4)


def _occurrence_dates_for(entry, *, weeks):
    """
    Yield the next `weeks` calendar dates that match `entry.day_of_week`,
    starting from today (inclusive of today if the weekday matches).
    """
    today = timezone.localdate()
    for week_offset in range(weeks):
        target = today + timedelta(weeks=week_offset)
        days_ahead = (entry.day_of_week - target.weekday()) % 7
        yield target + timedelta(days=days_ahead)


def _combine(date, t):
    """
    Combine a local date and a naive time into an aware datetime using
    the current timezone.
    """
    naive = datetime.combine(date, t)
    return timezone.make_aware(naive, timezone.get_current_timezone())


@transaction.atomic
def materialize_upcoming_sessions(timetable_entry, *, weeks=None):

    if not timetable_entry.is_active:
        return 0

    weeks = weeks if weeks is not None else _horizon_weeks()
    created_count = 0

    for occurrence_date in _occurrence_dates_for(timetable_entry, weeks=weeks):
        _, created = LiveClass.objects.get_or_create(
            timetable_entry=timetable_entry,
            scheduled_date=occurrence_date,
            defaults={
                "class_course": timetable_entry.class_course,
                "teacher": timetable_entry.teacher,
                "institution": timetable_entry.institution,
                "scheduled_start": _combine(
                    occurrence_date, timetable_entry.start_time
                ),
                "scheduled_end": _combine(
                    occurrence_date, timetable_entry.end_time
                ),
                "room": timetable_entry.room,
            },
        )
        if created:
            created_count += 1

    return created_count


@transaction.atomic
def cancel_future_sessions(timetable_entry):

    now = timezone.now()
    updated = LiveClass.objects.filter(
        timetable_entry=timetable_entry,
        scheduled_start__gte=now,
    ).exclude(
        stored_status=LiveClass.STATUS_CANCELLED,
    ).update(
        stored_status=LiveClass.STATUS_CANCELLED,
        updated_at=now,
    )
    return updated


@transaction.atomic
def regenerate_future_sessions(timetable_entry):
    """
    Delete future LiveClass rows (past rows kept for history) and
    recreate them from the current TimetableEntry values. Used after the
    timetable entry's day/time/room is edited.
    """
    now = timezone.now()
    LiveClass.objects.filter(
        timetable_entry=timetable_entry,
        scheduled_start__gte=now,
    ).delete()

    return materialize_upcoming_sessions(timetable_entry)