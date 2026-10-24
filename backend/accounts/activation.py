"""
Student account activation (admin creates a student -> one-time link -> student
chooses a password).

Flow
    1. An admin creates a student (POST /admin/users/, role "student"). No password
       is set; the account is flagged `must_set_password` and a one-time activation
       link is minted.
    2. The link is e-mailed to the student and/or handed to the admin as a WhatsApp
       click-to-chat link (see `invite_student`).
    3. POST /auth/activation/validate/  { token }
         -> is the link still good?  Does NOT use it up.
    4. POST /auth/activation/complete/  { token, new_password, confirm_password }
         -> password saved (hashed), flag cleared, link used up, student signed in.
    5. POST /auth/activation/request/   { email }
         -> "send me a new link". Always answers 200 so it cannot be used to find
            out which e-mail addresses have accounts.

Security properties (each one is covered by tests in test_activation.py)
    * The link carries a random 256-bit token. Only its SHA-256 hash is stored, so a
      database leak does not leak working links.
    * The token lives in the URL *fragment* (/activate#token=...). Browsers never send
      the fragment to a server, so it stays out of access logs and Referer headers.
    * Links expire (settings.ACTIVATION_TOKEN_TTL_HOURS, default 48 h) and work once.
      Issuing a new link, changing the student's e-mail, or finishing setup kills every
      older link.
    * A wrong / weak password never uses the link up, so the student can simply retry.
    * Until setup is finished the account has no usable password, and every other way
      in (password login, PIN, e-mail OTP, existing tokens) is refused by
      `User.must_set_password`.
    * Errors on these public endpoints are 400/403 - never 401 - so the frontend's
      token-refresh logic is not triggered by a bad link.
"""
import logging
import re
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape
from rest_framework import serializers
from rest_framework.throttling import AnonRateThrottle

from .models import PasswordResetToken, User
from .token_service import generate_opaque_token, hash_token, revoke_all_user_tokens

logger = logging.getLogger(__name__)

PURPOSE = PasswordResetToken.PURPOSE_ACTIVATION

# A student who asks for a new link twice within this window gets only one e-mail.
RESEND_COOLDOWN = timedelta(seconds=60)


# ---------------------------------------------------------------------- errors


class ActivationError(Exception):
    """A user-facing activation failure. `detail` is a string or a {field: [msgs]} dict."""

    def __init__(self, code, detail, http_status=400):
        super().__init__(code)
        self.code = code
        self.detail = detail
        self.http_status = http_status


class ActivationEmailError(Exception):
    """The activation e-mail could not be sent."""


_MESSAGES = {
    "invalid_token": "This activation link isn't valid. Request a new one below, or ask your school.",
    "token_expired": "This activation link has expired. Request a new one below.",
    "token_used": "This activation link has already been used or was replaced by a newer one.",
    "already_activated": "This account is already set up. Log in with your email and password.",
    "account_inactive": "This account has been deactivated. Please contact your school.",
}


def _err(code, http_status=400):
    return ActivationError(code, _MESSAGES[code], http_status)


# --------------------------------------------------------------------- settings


def token_ttl() -> timedelta:
    return timedelta(hours=int(getattr(settings, "ACTIVATION_TOKEN_TTL_HOURS", 48)))


def _frontend_url() -> str:
    return str(getattr(settings, "FRONTEND_URL", "http://localhost:5173")).rstrip("/")


def build_activation_url(raw_token: str) -> str:
    # Fragment (#), not query (?): never sent to any server, so it can't land in logs.
    return f"{_frontend_url()}/activate#token={raw_token}"


def build_login_url() -> str:
    return f"{_frontend_url()}/login"


def mask_email(email: str) -> str:
    """'aarav@example.com' -> 'a****@example.com' (shown on the activation page)."""
    local, _, domain = (email or "").partition("@")
    if not domain:
        return ""
    return f"{local[:1]}{'*' * min(max(len(local) - 1, 1), 6)}@{domain}"


# ---------------------------------------------------------------- token issuing


def _mint_token(user, *, issued_by=None):
    """Create a new activation token row. Returns (raw_token, row). Does not touch older ones."""
    now = timezone.now()
    # Opportunistic clean-up of long-dead links.
    PasswordResetToken.objects.filter(
        purpose=PURPOSE, expires_at__lt=now - timedelta(days=30)
    ).delete()

    raw = generate_opaque_token()  # 256 bits, URL-safe
    row = PasswordResetToken.objects.create(
        user=user,
        purpose=PURPOSE,
        token_hash=hash_token(raw),
        expires_at=now + token_ttl(),
        issued_by=issued_by,
    )
    return raw, row


def invalidate_activation_tokens(user, *, keep=None) -> int:
    """Mark every unused activation link of `user` as used (optionally except `keep`)."""
    qs = PasswordResetToken.objects.filter(
        user=user, purpose=PURPOSE, consumed_at__isnull=True
    )
    if keep is not None:
        qs = qs.exclude(pk=keep.pk)
    return qs.update(consumed_at=timezone.now())


# --------------------------------------------------------------------- delivery


def normalise_whatsapp_number(raw):
    """
    Return the number as digits only, in international format and without '+'
    (what wa.me expects), or None if it cannot be a valid mobile number.

    "+91 98765 43210" / "0091 98765 43210" -> "919876543210"
    "98765 43210" -> "919876543210" only if ACTIVATION_DEFAULT_COUNTRY_CODE="91" is set.

    A number typed WITHOUT "+" / "00" and with no default country code configured is
    refused (None): without a country code wa.me would open a chat with a different
    person's number, and a wrong link is worse than an error the admin can fix.
    """
    s = re.sub(r"[\s\-().]", "", str(raw or ""))
    if not s:
        return None

    international = False
    if s.startswith("+"):
        s, international = s[1:], True
    elif s.startswith("00"):
        s, international = s[2:], True

    if not re.fullmatch(r"[0-9]+", s):  # ASCII digits only (str.isdigit() accepts others)
        return None

    if not international:
        country = str(getattr(settings, "ACTIVATION_DEFAULT_COUNTRY_CODE", "") or "")
        if not country:
            return None  # cannot know which country this number belongs to
        national = s[1:] if s.startswith("0") else s  # drop a leading trunk "0"
        if len(national) == 10:
            s = country + national
        # otherwise it was typed with its country code already ("919876543210")

    if s.startswith("0") or not 8 <= len(s) <= 15:
        return None
    return s


def _whatsapp_message(user, activation_url, login_url):
    hours = int(token_ttl().total_seconds() // 3600)
    name = (user.first_name or "").strip() or "there"
    return (
        f"Hi {name}! Your Learn Smart account is ready.\n\n"
        f"Choose your password here (one-time link, valid for {hours} hours):\n"
        f"{activation_url}\n\n"
        f"After that, log in any time at {login_url} with your email and your new password."
    )


def build_whatsapp_url(user, number, activation_url, login_url) -> str:
    """wa.me click-to-chat link. The admin opens it and presses Send in WhatsApp."""
    text = quote(_whatsapp_message(user, activation_url, login_url), safe="")
    return f"https://wa.me/{number}?text={text}"


def send_activation_email(user, raw_token) -> None:
    """E-mail the link. Uses Django's e-mail backend (console in dev, SMTP in prod)."""
    url = build_activation_url(raw_token)
    login_url = build_login_url()
    hours = int(token_ttl().total_seconds() // 3600)
    name = (user.first_name or "").strip()
    greeting = f"Hi {name}," if name else "Hi,"

    subject = "Set up your Learn Smart account"
    text = (
        f"{greeting}\n\n"
        "Your school has created a Learn Smart account for you.\n\n"
        f"Choose your password here (the link works once and expires in {hours} hours):\n\n"
        f"    {url}\n\n"
        "After that you can log in any time at:\n\n"
        f"    {login_url}\n\n"
        "If you weren't expecting this e-mail you can ignore it; nothing happens "
        "unless the link is opened.\n\n"
        "- The Learn Smart team\n"
    )
    html = (
        '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:460px;'
        'margin:auto;color:#212d2a">'
        f"<p>{escape(greeting)}</p>"
        "<p>Your school has created a Learn Smart account for you.</p>"
        f'<p style="margin:24px 0"><a href="{escape(url)}" style="background:#2b3a35;'
        "color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;"
        'border-radius:999px;display:inline-block">Choose your password</a></p>'
        f'<p style="color:#4a635a;font-size:14px">The link works once and expires in '
        f"{hours} hours. After that you can log in any time at "
        f'<a href="{escape(login_url)}">{escape(login_url)}</a>.</p>'
        '<p style="color:#4a635a;font-size:13px">Button not working? Copy this link into '
        f"your browser:<br>{escape(url)}</p>"
        '<p style="color:#4a635a;font-size:13px">If you weren\'t expecting this e-mail you '
        "can ignore it; nothing happens unless the link is opened.</p></div>"
    )
    try:
        message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [user.email])
        message.attach_alternative(html, "text/html")
        message.send(fail_silently=False)
    except Exception as exc:  # SMTP down, bad credentials, ...
        logger.exception("activation.email_failed", extra={"user_id": str(user.pk)})
        raise ActivationEmailError(str(exc)) from exc


def invite_student(user, *, issued_by=None, send_email=True, whatsapp_number=None) -> dict:
    """
    Mint a fresh activation link for a student and deliver it.

    Every older link of this student stops working. The student account is never
    rolled back when delivery fails: the result says what happened, and the admin
    still gets the link to copy / send by WhatsApp.

    Returns a JSON-ready dict (the plaintext link appears ONLY here, never in storage):
        activation_url, login_url, expires_at, expires_in_hours,
        email_sent, email_error, whatsapp_url, whatsapp_to
    """
    raw, row = _mint_token(user, issued_by=issued_by)
    invalidate_activation_tokens(user, keep=row)

    activation_url = build_activation_url(raw)
    login_url = build_login_url()
    result = {
        "activation_url": activation_url,
        "login_url": login_url,
        "expires_at": row.expires_at.isoformat(),
        "expires_in_hours": int(token_ttl().total_seconds() // 3600),
        "email_sent": False,
        "email_error": None,
        "whatsapp_url": None,
        "whatsapp_to": None,
    }

    if send_email:
        try:
            send_activation_email(user, raw)
            result["email_sent"] = True
        except ActivationEmailError:
            result["email_error"] = (
                "The e-mail could not be sent. Copy the link or use WhatsApp instead."
            )

    if whatsapp_number:
        result["whatsapp_url"] = build_whatsapp_url(
            user, whatsapp_number, activation_url, login_url
        )
        result["whatsapp_to"] = f"+{whatsapp_number}"  # shown to the admin to double-check

    logger.info(
        "activation.invited",
        extra={
            "user_id": str(user.pk),
            "issued_by": str(issued_by.pk) if issued_by else None,
            "email_sent": result["email_sent"],
            "whatsapp": bool(whatsapp_number),
        },
    )
    return result


def request_new_link(email: str) -> None:
    """
    Self-service "send me a new link". Silent by design: it never says whether the
    address has an account. Only a still-pending, active student gets an e-mail, and
    only once per RESEND_COOLDOWN. The link goes to the address on file, never to
    whoever typed it in.
    """
    email = (email or "").strip().lower()
    user = User.objects.filter(
        email__iexact=email,
        role=User.ROLE_STUDENT,
        is_active=True,
        must_set_password=True,
    ).first()
    if user is None:
        return

    latest = (
        PasswordResetToken.objects.filter(user=user, purpose=PURPOSE)
        .order_by("-issued_at")
        .first()
    )
    if latest is not None and latest.issued_at > timezone.now() - RESEND_COOLDOWN:
        return

    raw, row = _mint_token(user)
    try:
        send_activation_email(user, raw)
    except ActivationEmailError:
        # Nothing was delivered: drop the new link and leave the student's old one alone.
        row.delete()
        return
    invalidate_activation_tokens(user, keep=row)


# ------------------------------------------------------------- validate / finish


def _load_row(raw_token, *, lock=False):
    raw = (raw_token or "").strip()
    if not raw:
        raise _err("invalid_token")
    qs = PasswordResetToken.objects.select_related("user").filter(purpose=PURPOSE)
    if lock:
        qs = qs.select_for_update()
    try:
        return qs.get(token_hash=hash_token(raw))
    except PasswordResetToken.DoesNotExist:
        raise _err("invalid_token")


def _assert_usable(row):
    user = row.user
    if row.consumed_at is not None:
        # Same link opened twice after a successful setup gets the friendlier message.
        if not user.must_set_password:
            raise _err("already_activated")
        raise _err("token_used")
    if row.expires_at <= timezone.now():
        raise _err("token_expired")
    if not user.is_active:
        raise _err("account_inactive", 403)
    if user.role != User.ROLE_STUDENT or not user.must_set_password:
        raise _err("already_activated")


def check_activation_token(raw_token):
    """Return the live token row (its `.user` is the student) or raise ActivationError."""
    row = _load_row(raw_token)
    _assert_usable(row)
    return row


@transaction.atomic
def complete_activation(raw_token, new_password):
    """
    Save the student's chosen password and use the link up. Returns the User.

    Runs under a row lock, so two simultaneous submits of the same link cannot both
    succeed. Everything is rolled back on error, which means a password that fails
    the policy does NOT burn the link.
    """
    row = _load_row(raw_token, lock=True)
    _assert_usable(row)
    user = row.user

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as exc:
        raise ActivationError("weak_password", {"new_password": list(exc.messages)})

    now = timezone.now()
    user.set_password(new_password)  # hashed with the project's password hasher
    user.must_set_password = False
    user.last_login = now
    user.save(update_fields=["password", "must_set_password", "last_login", "updated_at"])

    invalidate_activation_tokens(user)  # this link and any sibling links
    # Belt and braces: the account had no sessions, but make sure of it. We do not touch
    # `tokens_valid_after` - the access token we are about to issue would be rejected by it.
    revoke_all_user_tokens(user, reason="activated", set_tokens_valid_after=False)

    logger.info("activation.completed", extra={"user_id": str(user.pk)})
    return user


# ----------------------------------------------------------------- serializers


class TokenSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=200)


class CompleteSerializer(TokenSerializer):
    new_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": ["Passwords do not match."]})
        return attrs


class RequestLinkSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)

    def validate_email(self, value):
        return value.strip().lower()


# -------------------------------------------------------------------- throttles


class _FailOpenAnonThrottle(AnonRateThrottle):
    """Per-IP limit that lets the request through if the cache (Redis) is unreachable."""

    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:  # noqa: BLE001 - never turn a cache outage into a 500
            logger.warning("activation.throttle_unavailable", exc_info=True)
            return True


class ActivationThrottle(_FailOpenAnonThrottle):
    scope = "activation"


class ActivationRequestThrottle(_FailOpenAnonThrottle):
    scope = "activation_request"
