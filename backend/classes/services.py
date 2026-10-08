from datetime import datetime, timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from accounts.models import OnlineStatus, StudentProfile, User
from core.utils import generate_unique_code

from .models import ClassCourse, LiveClass, StudentEnrollment, TimetableEntry

@transaction.atomic
def add_student_to_class(class_course, email, first_name, last_name, grade=None):
    """
    Create (or fetch) a student and enroll them in the given class.

    If `grade` is provided (a Grade instance), it is set on the student
    (for new or existing) and the student is auto-enrolled into every
    matching class of that grade.
    """

    student, student_created = User.objects.get_or_create(
        email=email.lower().strip(),
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "role": User.ROLE_STUDENT,
            "institution": class_course.institution,
            "grade": grade,
        },
    )

    if student_created:
        student.set_unusable_password()
        student.save(update_fields=["password"])
        StudentProfile.objects.create(user=student)
        OnlineStatus.objects.create(user=student)
    else:
        # Existing student — update grade if provided
        if grade is not None and student.grade_id != grade.id:
            student.grade = grade
            student.save(update_fields=["grade", "updated_at"])

    # Enrollment in the current class
    enrollment, enrollment_created = StudentEnrollment.objects.get_or_create(
        student=student,
        class_course=class_course,
        defaults={
            "joining_code": generate_unique_code(StudentEnrollment, field_name="joining_code"),
            "status": StudentEnrollment.STATUS_ACTIVE,
        },
    )

    # If the student now has a grade, auto-enroll into matching classes
    # (idempotent — won't duplicate the current class).
    if student.grade_id is not None:
        try:
            auto_enroll_student_into_grade(student)
        except Exception:
            import logging
            logging.getLogger(__name__).exception(
                "auto-enroll failed for student %s", student.id
            )

    # Ensure the student has a PIN credential for the quick-login page.
    try:
        from accounts.services import generate_student_pin
        from accounts.models import StudentCredentials
        if not StudentCredentials.objects.filter(student=student).exists():
            generate_student_pin(student)
    except Exception:
        import logging
        logging.getLogger(__name__).exception(
            "PIN generation failed for student %s", student.id
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


# ---------------------------------------------------------------- grade sync


@transaction.atomic
def auto_enroll_class_into_grade(class_course):
    """
    Called after a ClassCourse is created with `grade` set.

    Enrolls every active student of that grade in the class. Idempotent —
    existing enrollments are left alone (including ones that were blocked
    or removed by the teacher).

    Returns the number of NEW enrollments created.
    """
    grade = getattr(class_course, "grade", None)
    if grade is None:
        return 0

    institution = class_course.institution
    if institution is None:
        return 0

    students = (
        User.objects
        .filter(
            role=User.ROLE_STUDENT,
            institution=institution,
            grade=grade,
            is_active=True,
        )
        .exclude(id__in=StudentEnrollment.objects.filter(
            class_course=class_course
        ).values_list("student_id", flat=True))
    )

    created = 0
    for student in students:
        StudentEnrollment.objects.create(
            student=student,
            class_course=class_course,
            joining_code=generate_unique_code(
                StudentEnrollment, field_name="joining_code"
            ),
            status=StudentEnrollment.STATUS_ACTIVE,
            joined_at=timezone.now(),
        )
        created += 1

    return created


@transaction.atomic
def auto_enroll_student_into_grade(student):
    """
    Called after a student's `grade` is set or changed.

    Enrolls the student into every active ClassCourse of that grade in
    their institution. Idempotent — existing enrollments are left alone.

    Returns the number of NEW enrollments created.
    """
    if student.role != User.ROLE_STUDENT:
        return 0
    if student.grade_id is None or student.institution_id is None:
        return 0

    classes = ClassCourse.objects.filter(
        institution=student.institution,
        grade_id=student.grade_id,
        is_archived=False,
        is_deleted=False,
    ).exclude(id__in=StudentEnrollment.objects.filter(
        student=student
    ).values_list("class_course_id", flat=True))

    created = 0
    for klass in classes:
        StudentEnrollment.objects.create(
            student=student,
            class_course=klass,
            joining_code=generate_unique_code(
                StudentEnrollment, field_name="joining_code"
            ),
            status=StudentEnrollment.STATUS_ACTIVE,
            joined_at=timezone.now(),
        )
        created += 1

    return created

