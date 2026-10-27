from django.utils import timezone
from datetime import timedelta
import secrets
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from institutions.models import Institution
from core.models import TimeStampedModel

from django.contrib.auth.hashers import make_password

from django.contrib.auth.hashers import check_password

from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_ADMIN = "admin"
    ROLE_TEACHER = "teacher"
    ROLE_STUDENT = "student"
    ROLE_CHOICES = (
        (ROLE_ADMIN, "Admin"),
        (ROLE_TEACHER, "Teacher"),
        (ROLE_STUDENT, "Student"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=254)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    institution = models.ForeignKey(
        "institutions.Institution",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
    )
    grade = models.ForeignKey(
        "institutions.Grade",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="students",
    )

    # Activation & Password fields
    must_set_password = models.BooleanField(
        default=False,
        help_text=(
            "True for a student created by an admin who has not yet chosen a password "
            "through the one-time activation link. While True the account cannot sign "
            "in (password, PIN or OTP) and cannot call the API."
        ),
    )
    temp_password_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Expiration timestamp for the temporary password if one was issued.",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    phone = models.CharField(max_length=20, blank=True)
    must_set_password = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_students"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class PasswordActivation(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="password_activation")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    temporary_password = models.CharField(max_length=128)  # hashed, not plaintext
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    def is_valid(self):
        return self.used_at is None and timezone.now() < self.expires_at

    @classmethod
    def create_for_user(cls, user, validity_hours=24):
        token = secrets.token_urlsafe(48)
        temp_password = User.objects.make_random_password(length=12)
        obj, _ = cls.objects.update_or_create(
            user=user,
            defaults={
                "token": token,
                "temporary_password": temp_password,  # replace with hashing below
                "expires_at": timezone.now() + timedelta(hours=validity_hours),
                "used_at": None,
            },
        )
        return obj, temp_password


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
    """
    One-time, expiring, hashed token that lets its holder choose a password.

    `purpose` keeps the two uses apart: an account-activation token (see
    accounts/activation.py) can never be accepted by a reset flow, or vice versa.
    """

    PURPOSE_RESET = "reset"
    PURPOSE_ACTIVATION = "activation"
    PURPOSE_CHOICES = [
        (PURPOSE_RESET, "Password reset"),
        (PURPOSE_ACTIVATION, "Account activation"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    purpose = models.CharField(
        max_length=20, choices=PURPOSE_CHOICES, default=PURPOSE_RESET
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
        indexes = [
            models.Index(fields=["institution", "date"]),
        ]
        ordering = ["-date", "-first_seen_at"]

    def __str__(self):
        return f"{self.teacher.email} @ {self.date} [{self.status}]"


class StudentAttendance(TimeStampedModel):
    """Student attendance for a class on a given day."""

    STATUS_PRESENT = "present"
    STATUS_ABSENT = "absent"
    STATUS_LATE = "late"
    STATUS_EXCUSED = "excused"
    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
        (STATUS_ABSENT, "Absent"),
        (STATUS_LATE, "Late"),
        (STATUS_EXCUSED, "Excused"),
    ]

    SOURCE_AUTO = "auto"
    SOURCE_MANUAL = "manual"
    SOURCE_CHOICES = [
        (SOURCE_AUTO, "Auto"),
        (SOURCE_MANUAL, "Manual"),
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
        null=True,
        blank=True,
    )
    grade = models.ForeignKey(
        "institutions.Grade",
        on_delete=models.CASCADE,
        related_name="student_attendance",
        null=True,
        blank=True,
        help_text="Set when attendance is recorded at the grade level (daily roll call).",
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
    joined_at = models.DateTimeField(null=True, blank=True)
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
    marked_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marked_student_attendance",
        help_text="Who marked this record (null for auto-generated).",
    )
    note = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["institution", "date"]),
            models.Index(fields=["class_course", "date"]),
        ]
        ordering = ["-date", "-joined_at"]

    def __str__(self):
        return f"{self.student.email} @ {self.class_course.name} on {self.date}"


class TeacherGradeAssignment(models.Model):
    """
    Links a teacher to the grades they are responsible for.

    The admin decides which grades each teacher handles when creating or
    editing the teacher. Students whose `grade` matches one of these rows
    are considered "students of that teacher" — independent of any
    ClassCourse enrollment.

    Managed by admin only.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="grade_assignments",
    )
    grade = models.ForeignKey(
        "institutions.Grade",
        on_delete=models.CASCADE,
        related_name="teacher_assignments",
    )
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.CASCADE,
        related_name="teacher_grade_assignments",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["teacher", "grade"],
                name="unique_teacher_per_grade",
            )
        ]
        indexes = [
            models.Index(fields=["teacher"]),
            models.Index(fields=["grade"]),
        ]
        ordering = ["grade__level"]

    def __str__(self):
        return f"{self.teacher.email} handles {self.grade.name}"


class StudentCredentials(models.Model):
    """
    Alternative credential for young students: a 6-digit PIN.

    - One-to-one with the student.
    - PIN is unique across the whole platform.
    - `is_active=False` revokes login without changing the PIN.
    - Rate limiting: `failed_attempts` + `locked_until` block brute-force.
    """
    student = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="credentials",
        limit_choices_to={"role": "student"},
    )
    pin = models.CharField(max_length=8, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Student credentials"
        indexes = [
            models.Index(fields=["pin"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"PIN for {self.student.email} (active={self.is_active})"

    def is_locked(self):
        from django.utils import timezone
        return self.locked_until is not None and self.locked_until > timezone.now()

    def register_failure(self, lock_after=5, lock_minutes=15):
        from django.utils import timezone
        from datetime import timedelta
        self.failed_attempts = (self.failed_attempts or 0) + 1
        if self.failed_attempts >= lock_after:
            self.locked_until = timezone.now() + timedelta(minutes=lock_minutes)
            self.failed_attempts = 0
        self.save(update_fields=["failed_attempts", "locked_until", "updated_at"])

    def register_success(self):
        from django.utils import timezone
        self.failed_attempts = 0
        self.locked_until = None
        self.last_login_at = timezone.now()
        self.save(update_fields=["failed_attempts", "locked_until", "last_login_at", "updated_at"])


class LoginOTP(models.Model):
    """
    One-time passcodes for passwordless login.
    - Generated when a user requests a code via /auth/request-otp/
    - Consumed once at /auth/verify-otp/ (is_used=True)
    - Expires after 10 minutes
    - Cleaned up opportunistically (older rows can be pruned by a cron)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "code", "is_used"]),
        ]

    def __str__(self):
        return f"OTP for {self.email} (used={self.is_used})"

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


class PendingRegistration(models.Model):
    """
    A teacher sign-up that is waiting for its e-mail address to be verified.

    The real User row is NOT created until the 6-digit code from the e-mail is
    confirmed. That matters because Google sign-in matches accounts by e-mail:
    if unverified sign-ups became real accounts, someone could register
    somebody else's address with a password they know.

    Nothing secret is stored in plain text: the password is already hashed
    (same hasher as User.password), and the code and the browser token are
    stored as keyed hashes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    password_hash = models.CharField(max_length=128)
    code_hash = models.CharField(max_length=64)
    token_hash = models.CharField(max_length=64)
    attempts = models.PositiveSmallIntegerField(default=0)
    last_sent_at = models.DateTimeField()
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pending sign-up for {self.email}"

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
