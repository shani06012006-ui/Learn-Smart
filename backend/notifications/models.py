import uuid
from django.db import models
from core.models import TimeStampedModel

class Notification(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(
        max_length=50,
        default="general",
        help_text="e.g. quiz_submit, leave_request, chat, grade",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
        ]

    def __str__(self):
        return f"[{self.recipient.email}] {self.title}"