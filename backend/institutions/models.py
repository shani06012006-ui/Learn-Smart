import uuid
from django.db import models
from core.models import TimeStampedModel


class Institution(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Grade(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="grades",
    )
    level = models.PositiveSmallIntegerField(help_text="Numeric year level: 1, 2, ..., 12.")
    name = models.CharField(max_length=100, help_text="Display name, e.g. 'Class 5'.")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["institution", "level"]
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "level"],
                name="unique_grade_level_per_institution",
            ),
        ]
        indexes = [models.Index(fields=["institution", "level"])]

    def __str__(self):
        return f"{self.name} ({self.institution.name})"