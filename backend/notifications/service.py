import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)

def notify(user_id, title, message, notification_type="general"):
    """
    Creates a Notification record, then broadcasts it via WebSocket to
    that specific user.
    """
    if not user_id:
        return None

    # 1. Save to DB
    notif = Notification.objects.create(
        recipient_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )

    # 2. Broadcast via WebSocket
    channel_layer = get_channel_layer()
    if channel_layer is not None:
        try:
            payload = NotificationSerializer(notif).data
            async_to_sync(channel_layer.group_send)(
                f"user_{user_id}",
                {
                    "type": "send_notification",
                    "notification": payload,
                },
            )
        except Exception as exc:
            logger.warning("Failed to broadcast notification: %s", exc)

    return notif

def notify_all_teachers(institution, title, message, notification_type="admin_update"):
    """
    Send a notification to every active teacher in an institution.
    """
    from accounts.models import User
    teachers = User.objects.filter(
        institution=institution,
        role="teacher",
        is_active=True,
    ).values_list("id", flat=True)

    for teacher_id in teachers:
        notify(
            user_id=teacher_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )