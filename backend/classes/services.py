from django.db import transaction
from django.utils import timezone

from accounts.models import OnlineStatus, StudentProfile, User
from core.utils import generate_unique_code

from .models import StudentEnrollment


@transaction.atomic
def add_student_to_class(class_course, email, first_name, last_name):
    """
    Teacher-initiated: get-or-create the student User account (inactive
    until they claim it isn't required here since login just needs a
    password, which the student sets by... — for Module A we create the
    account with an unusable password; a "claim account" / set-password
    step is a natural extension point once email verification (explicitly
    deferred per product decision) is added.

    Returns (enrollment, created: bool). Idempotent per (student, class) —
    re-adding an already-enrolled student returns the existing enrollment
    unchanged rather than erroring, since a teacher retrying after a
    network blip shouldn't get a 400.
    """
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
    """
    Student-initiated: redeem a joining code. Raises StudentEnrollment.DoesNotExist
    if the code is invalid, and ValueError if the code belongs to a
    different student or has already been used/blocked/removed — the view
    translates both into the appropriate 4xx response.
    """
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
