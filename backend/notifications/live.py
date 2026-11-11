# backend/notifications/live.py
"""
Live platform notifications.

Audience rules:
  Admin and teacher  get every platform update in their institution.
  Student            gets only
                       - updates a teacher made to a class they are enrolled in
                       - their own progress (joined, status change, attendance, leave decision)
                     Admin-only updates never reach students.

Each notification is saved, then pushed to the recipient's WebSocket group
`user_<id>`, which NotificationConsumer joins. The push runs after the
database transaction commits, so a rolled-back change never notifies anyone.
"""
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from accounts.models import StudentAttendance, User
from classes.models import ClassCourse, LiveClass, StudentEnrollment
from leaves.models import StudentLeave, TeacherLeave

from .models import Notification

logger = logging.getLogger(__name__)

STAFF_ROLES = (User.ROLE_ADMIN, User.ROLE_TEACHER)


def _name(user):
    return user.get_full_name() or user.email


# ─────────────────────────────────────────────────────────
# Delivery
# ─────────────────────────────────────────────────────────

def _payload(n):
    # ✅ FIXED: Use the correct attribute names. 
    # We use getattr with a fallback so it works whether your model uses 
    # 'kind' or 'notification_type', and 'body' or 'message'.
    return {
        "id": str(n.id),
        "kind": getattr(n, "kind", getattr(n, "notification_type", "")),
        "title": n.title,
        "body": getattr(n, "body", getattr(n, "message", "")),
        "created_at": n.created_at.isoformat() if getattr(n, "created_at", None) else None,
        "is_read": False,
    }


def _push(pairs):
    layer = get_channel_layer()
    if layer is None:
        return
    for recipient_id, payload in pairs:
        try:
            async_to_sync(layer.group_send)(
                f"user_{recipient_id}",
                {"type": "send_notification", "notification": payload},
            )
        except Exception:
            logger.exception("live notification push failed for user %s", recipient_id)


def _deliver(recipient_ids, *, kind, title, body):
    ids = {rid for rid in recipient_ids if rid}
    if not ids:
        return

    # ✅ FIXED: Dynamically build the kwargs based on what your model expects.
    # This prevents the TypeError: unexpected keyword arguments.
    notification_kwargs = {
        "recipient_id": None,  # Will be replaced in the loop
        "title": title[:200],
    }

    # Check if your model uses `notification_type` or `kind`
    if hasattr(Notification, "notification_type"):
        notification_kwargs["notification_type"] = kind
    elif hasattr(Notification, "kind"):
        notification_kwargs["kind"] = kind

    # Check if your model uses `message` or `body`
    if hasattr(Notification, "message"):
        notification_kwargs["message"] = body[:500]
    elif hasattr(Notification, "body"):
        notification_kwargs["body"] = body[:500]

    rows = []
    for rid in ids:
        kwargs = notification_kwargs.copy()
        kwargs["recipient_id"] = rid
        rows.append(Notification(**kwargs))

    created = Notification.objects.bulk_create(rows)
    pairs = [(n.recipient_id, _payload(n)) for n in created]
    transaction.on_commit(lambda: _push(pairs))


# ─────────────────────────────────────────────────────────
# Audiences
# ─────────────────────────────────────────────────────────

def _staff_ids(institution_id, exclude_id=None):
    qs = User.objects.filter(
        institution_id=institution_id,
        role__in=STAFF_ROLES,
        is_active=True,
    )
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    return set(qs.values_list("id", flat=True))


def _enrolled_student_ids(class_id):
    return set(
        StudentEnrollment.objects.filter(
            class_course_id=class_id,
            status=StudentEnrollment.STATUS_ACTIVE,
        ).values_list("student_id", flat=True)
    )


def notify_staff(*, institution_id, kind, title, body, actor_id=None):
    """Platform activity. Admins and teachers see it. Students never do."""
    _deliver(_staff_ids(institution_id, exclude_id=actor_id), kind=kind, title=title, body=body)


def notify_teacher_update(*, teacher, kind, title, body, class_course=None):
    """
    A teacher's action. Staff see it. Students see it only when it is about
    a class they are enrolled in.
    """
    ids = _staff_ids(teacher.institution_id, exclude_id=teacher.id)
    if class_course is not None:
        ids |= _enrolled_student_ids(class_course.id)
    _deliver(ids, kind=kind, title=title, body=body)


def notify_person(*, person, kind, title, body):
    """Something happened to one person's progress. That person and staff see it."""
    ids = _staff_ids(person.institution_id)
    ids.add(person.id)
    _deliver(ids, kind=kind, title=title, body=body)


# ─────────────────────────────────────────────────────────
# Status tracking, so receivers can tell a real change from a re-save
# ─────────────────────────────────────────────────────────

def _remember_status(sender, instance, **kwargs):
    instance._previous_status = (
        sender.objects.filter(pk=instance.pk).values_list("status", flat=True).first()
        if instance.pk else None
    )


pre_save.connect(_remember_status, sender=StudentEnrollment, dispatch_uid="live_enr_status")
pre_save.connect(_remember_status, sender=StudentAttendance, dispatch_uid="live_att_status")
pre_save.connect(_remember_status, sender=StudentLeave, dispatch_uid="live_sl_status")
pre_save.connect(_remember_status, sender=TeacherLeave, dispatch_uid="live_tl_status")


# ─────────────────────────────────────────────────────────
# Receivers
# ─────────────────────────────────────────────────────────

@receiver(post_save, sender=ClassCourse, dispatch_uid="live_class_created")
def _class_created(sender, instance, created, **kwargs):
    if not created or instance.teacher_id is None:
        return
    teacher = instance.teacher
    notify_teacher_update(
        teacher=teacher,
        kind="class_created",
        title="New class created",
        body=f"{instance.name} ({instance.subject}) was created for {_name(teacher)}.",
    )


@receiver(post_save, sender=LiveClass, dispatch_uid="live_session_created")
def _live_class_created(sender, instance, created, **kwargs):
    if not created or instance.teacher_id is None:
        return
    notify_teacher_update(
        teacher=instance.teacher,
        class_course=instance.class_course,
        kind="live_class_scheduled",
        title="Live class scheduled",
        body=(
            f"{instance.class_course.name}: "
            f"{instance.scheduled_date} at {instance.scheduled_start:%H:%M}."
        ),
    )


@receiver(post_save, sender=StudentEnrollment, dispatch_uid="live_enrollment")
def _enrollment_saved(sender, instance, created, **kwargs):
    previous = getattr(instance, "_previous_status", None)
    if not created and previous == instance.status:
        return

    course = instance.class_course
    copy = {
        StudentEnrollment.STATUS_ACTIVE: (
            "Joined a class" if created else "Class access restored",
            f"You are enrolled in {course.name}.",
        ),
        StudentEnrollment.STATUS_BLOCKED: (
            "Blocked from a class",
            f"You were blocked from {course.name}. Contact your teacher.",
        ),
        StudentEnrollment.STATUS_REMOVED: (
            "Removed from a class",
            f"You were removed from {course.name}.",
        ),
    }.get(instance.status)
    if copy is None:
        return

    title, body = copy
    notify_person(
        person=instance.student,
        kind=f"enrollment_{instance.status}",
        title=title,
        body=body,
    )


@receiver(post_save, sender=StudentAttendance, dispatch_uid="live_attendance")
def _attendance_saved(sender, instance, created, **kwargs):
    # Present is not news. Only absent, late, and excused reach the student.
    if instance.status == StudentAttendance.STATUS_PRESENT:
        return
    previous = getattr(instance, "_previous_status", None)
    if not created and previous == instance.status:
        return

    notify_person(
        person=instance.student,
        kind=f"attendance_{instance.status}",
        title=f"Marked {instance.status}",
        body=f"{instance.class_course.name} on {instance.date}.",
    )


@receiver(post_save, sender=StudentLeave, dispatch_uid="live_student_leave")
def _student_leave_saved(sender, instance, created, **kwargs):
    student = instance.student
    if created:
        notify_staff(
            institution_id=instance.institution_id,
            kind="student_leave_requested",
            title="Student leave request",
            body=(
                f"{_name(student)} requested {instance.leave_type} leave, "
                f"{instance.start_date} to {instance.end_date}."
            ),
        )
        return

    previous = getattr(instance, "_previous_status", None)
    if previous == instance.status or instance.status == StudentLeave.STATUS_PENDING:
        return
    notify_person(
        person=student,
        kind=f"student_leave_{instance.status}",
        title=f"Leave {instance.status}",
        body=f"Your leave from {instance.start_date} to {instance.end_date} was {instance.status}.",
    )


@receiver(post_save, sender=TeacherLeave, dispatch_uid="live_teacher_leave")
def _teacher_leave_saved(sender, instance, created, **kwargs):
    teacher = instance.teacher
    if created:
        notify_staff(
            institution_id=instance.institution_id,
            actor_id=teacher.id,
            kind="teacher_leave_requested",
            title="Teacher leave request",
            body=(
                f"{_name(teacher)} requested {instance.leave_type} leave, "
                f"{instance.start_date} to {instance.end_date}."
            ),
        )
        return

    previous = getattr(instance, "_previous_status", None)
    if previous == instance.status or instance.status == TeacherLeave.STATUS_PENDING:
        return
    notify_person(
        person=teacher,
        kind=f"teacher_leave_{instance.status}",
        title=f"Leave {instance.status}",
        body=f"Your leave from {instance.start_date} to {instance.end_date} was {instance.status}.",
    )