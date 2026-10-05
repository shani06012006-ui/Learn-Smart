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


class Grade(TimeStampedModel):
    """
    A year level within an institution, e.g. "Class 1" ... "Class 12".

    Students belong to one Grade; ClassCourse rows may belong to a Grade.

    Design notes:
      - (institution, level) is unique — every institution has its own
        Grade 1..Grade 12 set (auto-seeded via `manage.py seed_grades`).
      - `name` is the display label; admins can rename ("Class 5" vs
        "Grade 5" vs "Year 5") without affecting structure.
      - Deleting a grade is allowed only if no classes/users reference it.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="grades",
    )
    level = models.PositiveSmallIntegerField(
        help_text="Numeric year level: 1, 2, ..., 12.",
    )
    name = models.CharField(
        max_length=100,
        help_text="Display name, e.g. 'Class 5' or 'Grade 5'.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["institution", "level"]
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "level"],
                name="unique_grade_level_per_institution",
            ),
        ]
        indexes = [
            models.Index(fields=["institution", "level"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.institution.name})"

