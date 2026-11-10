# backend/accounts/teacher_onboarding.py
"""
Teacher onboarding.

An admin creates the teacher account. No one types a password for the teacher.
The system emails a one-time link that expires after a short window (default
30 minutes). The teacher opens it, chooses their own password in a popup, and
is signed in.

Kept separate from activation.py on purpose: that module is student-only
(role checks, PIN wording, 48-hour window). Storage is shared: rows in
PasswordResetToken with purpose=activation, hashed with the same helpers.
"""
import logging
import smtplib
from datetime import timedelta
from typing import Optional, Tuple

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape
from rest_framework import serializers

from .models import PasswordResetToken, User
from .token_service import generate_opaque_token, hash_token, revoke_all_user_tokens

logger = logging.getLogger(__name__)

PURPOSE = PasswordResetToken.PURPOSE_ACTIVATION
LINK_TTL = timedelta(minutes=int(getattr(settings, "TEACHER_ONBOARDING_TTL_MINUTES", 30)))
RESEND_COOLDOWN = timedelta(seconds=60)

MESSAGES = {
    "invalid_link": "This setup link isn't valid. Ask your school admin to send a new one.",
    "link_expired": "This setup link has expired. Ask your school admin to send a new one.",
    "link_used": (
        "This setup link was already used or replaced by a newer one. "
        "Use the most recent email from your school, or log in if you finished setup."
    ),
    "account_inactive": "This account is deactivated. Please contact your school.",
    "cooldown": "A new link was sent recently. Please wait a minute and try again.",
}


class OnboardingError(Exception):
    def __init__(self, code, detail, http_status=400):
        super().__init__(code)
        self.code = code
        self.detail = detail
        self.http_status = http_status


# ---------------------------------------------------------------------------
# Links and email
# ---------------------------------------------------------------------------

def build_setup_url(raw_token: str) -> str:
    base = str(getattr(settings, "FRONTEND_URL", "http://localhost:5173")).rstrip("/")
    # Fragment, not query string: fragments are never sent to a server.
    return f"{base}/onboarding/teacher#token={raw_token}"


def _send_invite_email(user, raw_token: str) -> None:
    url = build_setup_url(raw_token)
    minutes = int(LINK_TTL.total_seconds() // 60)
    name = (user.first_name or "").strip()
    greeting = f"Hi {name}," if name else "Hi,"

    text = (
        f"{greeting}\n\n"
        "Your school has created a Learn Smart teacher account for you.\n\n"
        f"Open this link to choose your password. It works once and expires in {minutes} minutes:\n\n"
        f"{url}\n\n"
        "Your school will never ask you for your password. "
        "If you weren't expecting this email, ignore it.\n\n"
        "- The Learn Smart team\n"
    )
    html = (
        '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:480px;'
        'margin:auto;color:#212d2a;">'
        f"<p>{escape(greeting)}</p>"
        "<p>Your school has created a Learn Smart teacher account for you.</p>"
        f'<p style="margin:24px 0"><a href="{escape(url)}" style="background:#2b3a35;color:#fff;'
        'text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;'
        'display:inline-block;">Choose your password</a></p>'
        f'<p style="color:#4a635a;font-size:14px;">This link works once and expires in {minutes} minutes. '
        "Your school will never ask you for your password.</p>"
        '<p style="color:#888;font-size:12px;margin-top:32px;">'
        "If you weren't expecting this email, you can ignore it.</p>"
        "</div>"
    )

    message = EmailMultiAlternatives(
        "Set up your Learn Smart teacher account",
        text,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )
    message.attach_alternative(html, "text/html")
    message.send(fail_silently=False)


def _email_error_message(exc: Exception) -> str:
    """Turn a mail exception into a sentence the admin can act on. Never includes secrets."""
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return (
            "The email server rejected the login. Check EMAIL_HOST_USER and "
            "EMAIL_HOST_PASSWORD in backend/.env (Gmail needs an app password)."
        )
    if isinstance(exc, (smtplib.SMTPException, OSError)):
        return (
            "Could not connect to the email server. Check your internet connection "
            "and the EMAIL_* settings in backend/.env."
        )
    return f"The email could not be sent ({exc.__class__.__name__})."


def _issue_and_send(user, issued_by) -> Tuple[bool, Optional[str]]:
    """
    Create a new link and email it. Returns (sent, error_message).

    The new email is sent first. Older links are retired only after it succeeds,
    so a failed send never leaves the teacher without a working link.
    """
    raw = generate_opaque_token()
    row = PasswordResetToken.objects.create(
        user=user,
        purpose=PURPOSE,
        token_hash=hash_token(raw),
        expires_at=timezone.now() + LINK_TTL,
        issued_by=issued_by,
    )

    try:
        _send_invite_email(user, raw)
    except Exception as exc:
        # Nothing new reached the teacher, so discard the unused link.
        row.delete()
        # Logs the traceback. The raw token is never logged.
        logger.exception("teacher_onboarding.email_failed user_id=%s", user.pk)
        return False, _email_error_message(exc)

    logger.info("teacher_onboarding.email_sent user_id=%s to=%s", user.pk, user.email)

    # The new email is on its way, so retire every older link.
    (
        PasswordResetToken.objects.filter(user=user, purpose=PURPOSE, consumed_at__isnull=True)
        .exclude(pk=row.pk)
        .update(consumed_at=timezone.now())
    )
    return True, None


# ---------------------------------------------------------------------------
# Called by the admin side
# ---------------------------------------------------------------------------

def invite_teacher_with_result(user, *, issued_by=None) -> Tuple[bool, Optional[str]]:
    """
    Call right after an admin creates a teacher.
    Returns (email_sent, error_message). The raw link is never returned.
    """
    user.set_unusable_password()
    user.must_set_password = True
    user.save(update_fields=["password", "must_set_password", "updated_at"])
    return _issue_and_send(user, issued_by)


def invite_teacher(user, *, issued_by=None) -> bool:
    """Boolean-only wrapper, kept for callers that don't need the error text."""
    sent, _ = invite_teacher_with_result(user, issued_by=issued_by)
    return sent


def resend_teacher_invite_with_result(user, *, issued_by=None) -> Tuple[bool, Optional[str]]:
    if not user.must_set_password:
        raise OnboardingError(
            "already_activated", "This teacher has already set their password.", 400
        )
    latest = (
        PasswordResetToken.objects.filter(user=user, purpose=PURPOSE)
        .order_by("-issued_at")
        .first()
    )
    if latest is not None and latest.issued_at > timezone.now() - RESEND_COOLDOWN:
        raise OnboardingError("cooldown", MESSAGES["cooldown"], 429)
    return _issue_and_send(user, issued_by)


def resend_teacher_invite(user, *, issued_by=None) -> bool:
    """Boolean-only wrapper, used by AdminResendTeacherInviteView."""
    sent, _ = resend_teacher_invite_with_result(user, issued_by=issued_by)
    return sent


# ---------------------------------------------------------------------------
# Called by the teacher's browser
# ---------------------------------------------------------------------------

def _load_link(raw_token, *, lock=False):
    raw = (raw_token or "").strip()
    if not raw:
        raise OnboardingError("invalid_link", MESSAGES["invalid_link"])

    qs = PasswordResetToken.objects.select_related("user").filter(
        purpose=PURPOSE, token_hash=hash_token(raw)
    )
    if lock:
        qs = qs.select_for_update(of=("self",))
    row = qs.first()

    # A student's token must never open the teacher flow.
    if row is None or row.user.role != User.ROLE_TEACHER:
        raise OnboardingError("invalid_link", MESSAGES["invalid_link"])
    return row


def _assert_open(row):
    user = row.user
    if not user.is_active:
        raise OnboardingError("account_inactive", MESSAGES["account_inactive"], 403)
    if row.consumed_at is not None or not user.must_set_password:
        raise OnboardingError("link_used", MESSAGES["link_used"])
    if row.expires_at <= timezone.now():
        raise OnboardingError("link_expired", MESSAGES["link_expired"])


def check_teacher_link(raw_token):
    """Read-only check. Does not consume the link, so a page reload still works."""
    row = _load_link(raw_token)
    _assert_open(row)
    return row


@transaction.atomic
def complete_teacher_onboarding(raw_token, new_password):
    row = _load_link(raw_token, lock=True)
    _assert_open(row)
    user = row.user

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as exc:
        raise OnboardingError("weak_password", " ".join(exc.messages), 400)

    now = timezone.now()
    user.set_password(new_password)
    user.must_set_password = False
    user.last_login = now
    user.save(update_fields=["password", "must_set_password", "last_login", "updated_at"])

    PasswordResetToken.objects.filter(
        user=user, purpose=PURPOSE, consumed_at__isnull=True
    ).update(consumed_at=now)

    # Sign out any other sessions this account might have.
    revoke_all_user_tokens(user, reason="activated", set_tokens_valid_after=False)
    return user


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------

class LinkSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=200)


class CompleteSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=200)
    new_password = serializers.CharField(
        write_only=True, trim_whitespace=False, max_length=128
    )
    confirm_password = serializers.CharField(
        write_only=True, trim_whitespace=False, max_length=128
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": ["Passwords do not match."]}
            )
        return attrs