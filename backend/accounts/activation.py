import logging
import re
import string
import secrets
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
RESEND_COOLDOWN = timedelta(seconds=60)

class ActivationError(Exception):
    def __init__(self, code, detail, http_status=400):
        super().__init__(code)
        self.code = code
        self.detail = detail
        self.http_status = http_status

class ActivationEmailError(Exception):
    pass

_MESSAGES = {
    "invalid_token": "This activation link isn't valid. Request a new one below, or ask your school.",
    "token_expired": "This activation link has expired. Request a new one below.",
    "token_used": "This activation link has already been used or was replaced by a newer one.",
    "already_activated": "This account is already set up. Log in with your email and password.",
    "account_inactive": "This account has been deactivated. Please contact your school.",
}

def _err(code, http_status=400):
    return ActivationError(code, _MESSAGES[code], http_status)

def token_ttl() -> timedelta:
    return timedelta(hours=int(getattr(settings, "ACTIVATION_TOKEN_TTL_HOURS", 48)))

def _frontend_url() -> str:
    return str(getattr(settings, "FRONTEND_URL", "http://localhost:5173")).rstrip("/")

def build_activation_url(raw_token: str) -> str:
    return f"{_frontend_url()}/activate#token={raw_token}"

def build_login_url() -> str:
    return f"{_frontend_url()}/login"

def mask_email(email: str) -> str:
    local, _, domain = (email or "").partition("@")
    if not domain:
        return ""
    return f"{local[:1]}{'*' * min(max(len(local) - 1, 1), 6)}@{domain}"

def _mint_token(user, *, issued_by=None):
    now = timezone.now()
    PasswordResetToken.objects.filter(
        purpose=PURPOSE, expires_at__lt=now - timedelta(days=30)
    ).delete()

    raw = generate_opaque_token()
    row = PasswordResetToken.objects.create(
        user=user,
        purpose=PURPOSE,
        token_hash=hash_token(raw),
        expires_at=now + token_ttl(),
        issued_by=issued_by,
    )
    return raw, row

def invalidate_activation_tokens(user, *, keep=None) -> int:
    qs = PasswordResetToken.objects.filter(
        user=user, purpose=PURPOSE, consumed_at__isnull=True
    )
    if keep is not None:
        qs = qs.exclude(pk=keep.pk)
    return qs.update(consumed_at=timezone.now())

def normalise_whatsapp_number(raw):
    s = re.sub(r"[\s\-().]", "", str(raw or ""))
    if not s:
        return None

    international = False
    if s.startswith("+"):
        s, international = s[1:], True
    elif s.startswith("00"):
        s, international = s[2:], True

    if not re.fullmatch(r"[0-9]+", s):
        return None

    if not international:
        country = str(getattr(settings, "ACTIVATION_DEFAULT_COUNTRY_CODE", "") or "")
        if not country:
            return None
        national = s[1:] if s.startswith("0") else s
        if len(national) == 10:
            s = country + national

    if s.startswith("0") or not 8 <= len(s) <= 15:
        return None
    return s

def _whatsapp_message(user, activation_url, login_url, temp_password=None):
    hours = int(token_ttl().total_seconds() // 3600)
    name = (user.first_name or "").strip() or "there"
    
    if temp_password:
        return (
            f"Hi {name}! Your Learn Smart account is ready.\n\n"
            f"Your temporary password is: {temp_password}\n\n"
            f"Log in here to set your new permanent password:\n{login_url}\n\n"
            f"This temporary password expires in {hours} hours."
        )
    
    return (
        f"Hi {name}! Your Learn Smart account is ready.\n\n"
        f"Choose your password here (one-time link, valid for {hours} hours):\n"
        f"{activation_url}\n\n"
        f"After that, log in any time at {login_url} with your email and your new password."
    )

def build_whatsapp_url(user, number, activation_url, login_url, temp_password=None) -> str:
    text = quote(_whatsapp_message(user, activation_url, login_url, temp_password), safe="")
    return f"https://wa.me/{number}?text={text}"

def send_activation_email(user, raw_token) -> None:
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
    except Exception as exc:
        logger.exception("activation.email_failed", extra={"user_id": str(user.pk)})
        raise ActivationEmailError(str(exc)) from exc

def send_temporary_password_email(user, temp_password, ttl_hours) -> None:
    login_url = build_login_url()
    name = (user.first_name or "").strip()
    greeting = f"Hi {name}," if name else "Hi,"

    subject = "Your Learn Smart temporary password"
    text = (
        f"{greeting}\n\n"
        "Your school has created a Learn Smart account for you.\n\n"
        f"Your temporary password is: {temp_password}\n\n"
        f"Log in here to set your new permanent password:\n\n"
        f"    {login_url}\n\n"
        f"This temporary password expires in {ttl_hours} hours.\n\n"
        "- The Learn Smart team\n"
    )
    html = (
        '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:460px;'
        'margin:auto;color:#212d2a">'
        f"<p>{escape(greeting)}</p>"
        "<p>Your school has created a Learn Smart account for you.</p>"
        f'<p style="font-size:18px;margin:20px 0"><strong>Your temporary password:</strong> '
        f'<span style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-family:monospace;">{escape(temp_password)}</span></p>'
        f'<p style="margin:24px 0"><a href="{escape(login_url)}" style="background:#2b3a35;'
        "color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;"
        'border-radius:999px;display:inline-block">Log in to set your password</a></p>'
        f'<p style="color:#4a635a;font-size:14px">This temporary password expires in '
        f"{ttl_hours} hours.</p></div>"
    )
    try:
        message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [user.email])
        message.attach_alternative(html, "text/html")
        message.send(fail_silently=False)
    except Exception as exc:
        logger.exception("activation.temp_password_email_failed", extra={"user_id": str(user.pk)})
        raise ActivationEmailError(str(exc)) from exc

def generate_temp_password(length=10) -> str:
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    pwd = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*"),
    ]
    pwd += [secrets.choice(chars) for _ in range(max(length - 4, 4))]
    secrets.SystemRandom().shuffle(pwd)
    return "".join(pwd)

def invite_student(user, *, issued_by=None, send_email=True, whatsapp_number=None, mode="temporary_password") -> dict:
    ttl_hours = int(token_ttl().total_seconds() // 3600)
    raw, row = _mint_token(user, issued_by=issued_by)
    invalidate_activation_tokens(user, keep=row)
    
    activation_url = build_activation_url(raw)
    login_url = build_login_url()
    temp_password = None

    if mode == "temporary_password":
        temp_password = generate_temp_password()
        user.set_password(temp_password)
        user.must_set_password = True
        user.temp_password_expires_at = timezone.now() + token_ttl()
        user.save(update_fields=["password", "must_set_password", "temp_password_expires_at", "updated_at"])
    else:
        user.set_unusable_password()
        user.must_set_password = True
        user.temp_password_expires_at = None
        user.save(update_fields=["password", "must_set_password", "temp_password_expires_at", "updated_at"])

    result = {
        "invite_mode": mode,
        "temporary_password": temp_password,
        "activation_url": activation_url,
        "login_url": login_url,
        "expires_at": row.expires_at.isoformat(),
        "expires_in_hours": ttl_hours,
        "email_sent": False,
        "email_error": None,
        "whatsapp_url": None,
        "whatsapp_to": None,
    }

    if send_email:
        try:
            if mode == "temporary_password":
                send_temporary_password_email(user, temp_password, ttl_hours)
            else:
                send_activation_email(user, raw)
            result["email_sent"] = True
        except ActivationEmailError:
            result["email_error"] = "The e-mail could not be sent. Copy the credentials or use WhatsApp instead."

    if whatsapp_number:
        result["whatsapp_url"] = build_whatsapp_url(
            user, whatsapp_number, activation_url, login_url, temp_password=temp_password
        )
        result["whatsapp_to"] = f"+{whatsapp_number}"

    return result

def request_new_link(email: str) -> None:
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
        row.delete()
        return
    invalidate_activation_tokens(user, keep=row)

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
    row = _load_row(raw_token)
    _assert_usable(row)
    return row

@transaction.atomic
def complete_activation(raw_token, new_password):
    row = _load_row(raw_token, lock=True)
    _assert_usable(row)
    user = row.user

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as exc:
        raise ActivationError("weak_password", {"new_password": list(exc.messages)})

    now = timezone.now()
    user.set_password(new_password)
    user.must_set_password = False
    user.temp_password_expires_at = None
    user.last_login = now
    user.save(update_fields=["password", "must_set_password", "temp_password_expires_at", "last_login", "updated_at"])

    invalidate_activation_tokens(user)
    revoke_all_user_tokens(user, reason="activated", set_tokens_valid_after=False)
    return user

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

class _FailOpenAnonThrottle(AnonRateThrottle):
    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:
            logger.warning("activation.throttle_unavailable", exc_info=True)
            return True

class ActivationThrottle(_FailOpenAnonThrottle):
    scope = "activation"

class ActivationRequestThrottle(_FailOpenAnonThrottle):
    scope = "activation_request"