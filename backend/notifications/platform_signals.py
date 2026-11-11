# backend/notifications/platform_signals.py
"""
Receivers for platform events that the live-notification rules in live.py
don't cover yet: teacher accounts, quizzes.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from accounts.models import User
from quizzes.models import Quiz

from .live import _name, notify_staff, notify_teacher_update

PUBLISHED = getattr(Quiz, "STATUS_PUBLISHED", "published")


# ─────────────────────────────────────────────────────────
# Teacher account created (by admin)
# ─────────────────────────────────────────────────────────

@receiver(post_save, sender=User, dispatch_uid="live_teacher_account_created")
def _teacher_account_created(sender, instance, created, **kwargs):
    if not created or instance.role != User.ROLE_TEACHER or instance.institution_id is None:
        return
    # Admins and teachers see it. Students never do.
    notify_staff(
        institution_id=instance.institution_id,
        actor_id=instance.id,
        kind="teacher_added",
        title="New teacher added",
        body=f"{_name(instance)} ({instance.email}) was added to the platform.",
    )


# ─────────────────────────────────────────────────────────
# Quiz published by a teacher
# ─────────────────────────────────────────────────────────

@receiver(pre_save, sender=Quiz, dispatch_uid="live_quiz_prev_status")
def _quiz_remember_status(sender, instance, **kwargs):
    instance._was_published = (
        sender.objects.filter(pk=instance.pk).values_list("is_published", flat=True).first()
        if instance.pk else False
    )


@receiver(post_save, sender=Quiz, dispatch_uid="live_quiz_published")
def _quiz_published(sender, instance, created, **kwargs):
    if not instance.is_published:
        return
    # Only notify on the transition from draft to published, not on every save.
    if not created and getattr(instance, "_was_published", False):
        return

    course = instance.class_course
    teacher = instance.teacher or (course.teacher if course else None)
    if course is None or teacher is None:
        return

    notify_teacher_update(
        teacher=teacher,
        class_course=course,
        kind="quiz_published",
        title="New quiz",
        body=f"{course.name}: {instance.title}",
    )