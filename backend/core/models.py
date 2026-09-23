import uuid

from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Adds created/updated timestamps. Abstract â€” mix into concrete models."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(is_deleted=False)

    def dead(self):
        return self.filter(is_deleted=True)

    def delete(self):
        """Bulk soft-delete when .delete() is called on a filtered queryset."""
        return self.update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()


class SoftDeleteManager(models.Manager):
    """Default manager â€” excludes soft-deleted rows from every normal query."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class AllObjectsManager(models.Manager):
    """Escape hatch manager â€” includes soft-deleted rows. Use sparingly (admin, audits)."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    """
    Abstract base for models that should never be hard-deleted by normal app
    flows (ClassCourse, Material, and later Quiz/Announcement).

    `.objects` only returns non-deleted rows.
    `.all_objects` returns everything, including soft-deleted rows.
    Call `instance.soft_delete()` instead of `instance.delete()` in views/services
    so the intent is explicit and `.delete()` isn't silently overridden.
    """

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at"])

    def delete(self, using=None, keep_parents=False):
        # Guard rail: force callers to be explicit about soft vs hard delete.
        raise NotImplementedError(
            "Direct .delete() is disabled on SoftDeleteModel subclasses. "
            "Call .soft_delete() for the normal app flow, or "
            ".hard_delete() if you truly need to remove the row."
        )

    def hard_delete(self, using=None, keep_parents=False):
        return models.Model.delete(self, using=using, keep_parents=keep_parents)


class UUIDPKModel(models.Model):
    """Abstract base giving a model a UUID primary key."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class AuditLog(models.Model):
    """
    Append-only audit trail.

    Constraints:
    - No updates or deletes via the ORM (save() rejects changes; delete()
      raises).
    - No updates or deletes at the DB level (a Postgres trigger installed
      in the migration rejects UPDATE and DELETE).
    - Never stores secrets: passwords, JWTs, refresh tokens, reset tokens.
      Enforced by core.audit.log_audit's sanitization and by callers never
      passing them.
    """

    id = models.BigAutoField(primary_key=True)
    occurred_at = models.DateTimeField(auto_now_add=True, db_index=True)

    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )
    actor_type = models.CharField(max_length=20)  # 'user' | 'system' | 'anonymous'

    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )

    action = models.CharField(max_length=80, db_index=True)
    resource_type = models.CharField(max_length=50, blank=True, default="")
    resource_id = models.UUIDField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-occurred_at"]
        indexes = [
            models.Index(fields=["-occurred_at"]),
            models.Index(fields=["institution", "-occurred_at"]),
            models.Index(fields=["actor", "-occurred_at"]),
            models.Index(fields=["action", "-occurred_at"]),
        ]

    def save(self, *args, **kwargs):
        # Reject updates. Only inserts are allowed.
        if self.pk is not None:
            raise NotImplementedError(
                "AuditLog is append-only. Use core.audit.log_audit() to add entries."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise NotImplementedError("AuditLog is append-only. Deletion is forbidden.")

    def __str__(self):
        return f"{self.occurred_at:%Y-%m-%d %H:%M:%S} {self.action} by {self.actor_id}"