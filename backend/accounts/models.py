import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from institutions.models import Institution
from core.models import TimeStampedModel


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The email field is required.")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", User.ROLE_ADMIN)

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    ROLE_ADMIN = "admin"
    ROLE_TEACHER = "teacher"
    ROLE_STUDENT = "student"

    ROLE_CHOICES = [
        (ROLE_ADMIN, "Admin"),
        (ROLE_TEACHER, "Teacher"),
        (ROLE_STUDENT, "Student"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    last_seen_at = models.DateTimeField(null=True, blank=True, db_index=True)

    tokens_valid_after = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name or self.email


class StudentProfile(TimeStampedModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )

    def __str__(self):
        return f"Student Profile - {self.user.get_full_name()}"


class OnlineStatus(TimeStampedModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="online_status",
    )
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - {'Online' if self.is_online else 'Offline'}"


class RefreshToken(models.Model):

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="refresh_tokens"
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    family_id = models.UUIDField(db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_reason = models.CharField(max_length=50, blank=True, default="")
    replaced_by = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="replaces",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    device_label = models.CharField(max_length=80, blank=True, default="")

    class Meta:
        indexes = [
            models.Index(
                fields=["user"],
                name="idx_refresh_token_user_active",
                condition=models.Q(revoked_at__isnull=True),
            ),
            models.Index(fields=["family_id"]),
        ]

    def is_active(self):
        from django.utils import timezone
        return self.revoked_at is None and self.expires_at > timezone.now()

    def __str__(self):
        return f"RefreshToken({self.user_id}, family={self.family_id})"


class PasswordResetToken(models.Model):

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    consumed_at = models.DateTimeField(null=True, blank=True)
    issued_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="password_resets_issued",
    )

    class Meta:
        indexes = [
            models.Index(
                fields=["user"],
                name="idx_password_reset_user_active",
                condition=models.Q(consumed_at__isnull=True),
            ),
        ]

    def is_active(self):
        from django.utils import timezone
        return self.consumed_at is None and self.expires_at > timezone.now()

    def __str__(self):
        return f"PasswordResetToken({self.user_id})"


# ---------------------------------------------------------------- attendance


class TeacherAttendance(TimeStampedModel):

    STATUS_PRESENT = "present"
    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="teacher_attendance",
    )
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teacher_attendance",
    )
    live_class = models.ForeignKey(
        "classes.LiveClass",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teacher_attendance",
    )
    date = models.DateField(db_index=True)
    first_seen_at = models.DateTimeField()
    last_seen_at = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PRESENT,
    )
    duration_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["teacher", "date"],
                name="unique_teacher_attendance_per_day",
            )
        ]
        indexes = [
            models.Index(fields=["institution", "date"]),
        ]
        ordering = ["-date", "-first_seen_at"]

    def __str__(self):
        return f"{self.teacher.email} @ {self.date} [{self.status}]"


class StudentAttendance(TimeStampedModel):
    """Student attendance for a class on a given day."""

    STATUS_PRESENT = "present"
    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
    ]

    SOURCE_AUTO = "auto"
    SOURCE_CHOICES = [
        (SOURCE_AUTO, "Auto"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"},
        related_name="student_attendance",
    )
    class_course = models.ForeignKey(
        "classes.ClassCourse",
        on_delete=models.CASCADE,
        related_name="student_attendance",
    )
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_attendance",
    )
    live_class = models.ForeignKey(
        "classes.LiveClass",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_attendance",
    )
    date = models.DateField(db_index=True)
    joined_at = models.DateTimeField()
    left_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PRESENT,
    )
    duration_seconds = models.PositiveIntegerField(default=0)
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default=SOURCE_AUTO,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "class_course", "date"],
                name="unique_student_attendance_per_class_per_day",
            )
        ]
        indexes = [
            models.Index(fields=["institution", "date"]),
            models.Index(fields=["class_course", "date"]),
        ]
        ordering = ["-date", "-joined_at"]

    def __str__(self):
        return f"{self.student.email} @ {self.class_course.name} on {self.date}"
