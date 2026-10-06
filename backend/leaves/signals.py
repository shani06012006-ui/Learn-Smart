"""
Post-save signals on TeacherLeave + StudentLeave.

When the status changes from `pending` to approved/rejected/cancelled,
broadcast the new state to the requester's user group so their open
websocket can show the update in real time.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import StudentLeave, TeacherLeave


def _owner_id(instance):
    return getattr(instance, "student_id", None) or getattr(instance, "teacher_id", None)


def _serialize_for_user(instance, user):
    return {
        "id": str(instance.id),
        "leave_type": instance.leave_type,
        "start_date": instance.start_date.isoformat(),
        "end_date": instance.end_date.isoformat(),
        "days": instance.days,
        "status": instance.status,
        "reason": instance.reason,
        "applied_at": instance.applied_at.isoformat() if instance.applied_at else None,
        "reviewed_at": instance.reviewed_at.isoformat() if instance.reviewed_at else None,
        "admin_remarks": instance.admin_remarks,
        "reviewer": (
            {
                "id": str(instance.reviewer.id),
                "full_name": instance.reviewer.get_full_name() or instance.reviewer.email,
                "email": instance.reviewer.email,
            }
            if instance.reviewer_id else None
        ),
    }


@receiver(pre_save, sender=StudentLeave)
@receiver(pre_save, sender=TeacherLeave)
def _capture_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            instance._old_status = old.status
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=StudentLeave)
@receiver(post_save, sender=TeacherLeave)
def _broadcast_leave_update(sender, instance, created, **kwargs):
    if created:
        return
    old_status = getattr(instance, "_old_status", None)
    if old_status == instance.status:
        return

    user_id = _owner_id(instance)
    if not user_id:
        return

    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        from accounts.models import User
        layer = get_channel_layer()
        if layer is None:
            return
        user = User.objects.filter(id=user_id).first()
        if user is None:
            return
        payload = _serialize_for_user(instance, user)
        async_to_sync(layer.group_send)(
            f"leaves_user_{user_id}",
            {"type": "leave.updated", "leave": payload},
        )
    except Exception:
        import logging
        logging.getLogger(__name__).exception("broadcast_leave_update failed")
