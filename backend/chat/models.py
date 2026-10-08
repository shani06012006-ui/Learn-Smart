"""
Chat models — threads, memberships, and messages.

Design notes:

  - Thread is either a 1:1 DM or a class GROUP chat. `class_course` is
    only set for GROUP threads.
  - Institution is denormalized from the creator for scoping; every
    query is institution-scoped.
  - ThreadMember tracks "who is in this conversation" and per-user
    last-read timestamp (for unread badges later).
  - Message rows are never hard-deleted from the app flow; soft-delete
    via `deleted_at` so the UI can render "[message deleted]" while
    keeping history intact.
"""
import uuid

from django.db import models

from core.models import TimeStampedModel


class Thread(TimeStampedModel):
    """A conversation between users."""

    KIND_DM = "dm"
    KIND_GROUP = "group"
    KIND_CHOICES = [
        (KIND_DM, "Direct message"),
        (KIND_GROUP, "Group"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="chat_threads",
    )
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    class_course = models.ForeignKey(
        "classes.ClassCourse",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_threads",
    )
    title = models.CharField(max_length=200, blank=True, default="")
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_chat_threads",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["institution"]),
            models.Index(fields=["class_course"]),
        ]

    def __str__(self):
        return f"{self.get_kind_display()}: {self.title or self.id}"


class ThreadMember(TimeStampedModel):
    """Membership in a Thread — one row per (thread, user)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="chat_memberships",
    )
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["thread", "user"],
                name="unique_chat_thread_member",
            )
        ]
        indexes = [
            models.Index(fields=["thread"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user_id} in {self.thread_id}"


class Message(TimeStampedModel):
    """A single message in a Thread."""

    KIND_USER = "user"
    KIND_SYSTEM = "system"
    KIND_CHOICES = [
        (KIND_USER, "User"),
        (KIND_SYSTEM, "System"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="chat_messages_sent",
        null=True,
        blank=True,
        help_text="Null for system messages.",
    )
    kind = models.CharField(
        max_length=10,
        choices=KIND_CHOICES,
        default=KIND_USER,
    )
    body = models.TextField()
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["thread", "created_at"]),
        ]

    def __str__(self):
        return f"{self.sender_id} -> {self.thread_id}: {self.body[:40]}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

class MessageReaction(TimeStampedModel):
    """
    A single emoji reaction by one user on one message.

    Rules:
      - One reaction per (message, user). Adding a different emoji
        replaces the existing row (handled in the view layer).
      - Emoji is stored as the raw Unicode character (e.g. "👍").
      - Cascade-deletes with the message.

    Indexes:
      - (message, emoji)   -> fast aggregation for reaction summaries
      - (user_id)          -> "what did I react to" queries
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="chat_reactions",
    )
    emoji = models.CharField(max_length=16)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user"],
                name="unique_reaction_per_user_per_message",
            )
        ]
        indexes = [
            models.Index(fields=["message", "emoji"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user_id} reacted {self.emoji} to {self.message_id}"
