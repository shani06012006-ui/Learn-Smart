import uuid

from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Adds created/updated timestamps. Abstract — mix into concrete models."""

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
    """Default manager — excludes soft-deleted rows from every normal query."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class AllObjectsManager(models.Manager):
    """Escape hatch manager — includes soft-deleted rows. Use sparingly (admin, audits)."""

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
