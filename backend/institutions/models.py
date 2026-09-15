import uuid

from django.db import models

from core.models import TimeStampedModel


class Institution(TimeStampedModel):
    """
    Minimal institution record for Module A/B — just enough to scope users
    and classes to a tenant. Departments, academic years, and admin-facing
    management (roles/permissions UI, institution-wide reports) are built
    out in Module J without needing to change this table's shape.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
