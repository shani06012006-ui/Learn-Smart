"""
Teacher sign-up with e-mail verification.

Flow
    1. POST /auth/register/          details + password  -> a 6-digit code is e-mailed
                                      and the browser gets a secret `registration_token`
    2. POST /auth/register/verify/   e-mail + code + token -> the account is created
                                      and the user is signed in
    3. POST /auth/register/resend/   e-mail + token        -> a fresh code (60 s cooldown)

Security properties (each one is covered by tests)
    * No User row exists until the e-mail is verified. Google sign-in matches
      accounts by e-mail, so an unverified account could otherwise be
      "pre-hijacked" by someone who registered a victim's address first.
    * The role is always "teacher". Admins come from the admin panel and
      students are added by their teacher, never by public sign-up.
    * The code only works together with the token that was returned to the
      browser that submitted the form. Someone who re-submits a victim's e-mail
      with their own password cannot trick the victim into finishing it.
    * 5 wrong codes burn the sign-up; codes expire after 15 minutes; a new code
      can be sent at most once a minute.
    * The password is stored hashed; the code and token only as keyed hashes.
    * The e-mail contains no user-supplied text, so this endpoint cannot be
      abused to send somebody else's words to a stranger.
"""
import logging
import math
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac
from rest_framework import serializers
from rest_framework.throttling import AnonRateThrottle

from .models import PendingRegistration, User

logger = logging.getLogger(__name__)

CODE_TTL = timedelta(minutes=15)
RESEND_COOLDOWN = timedelta(seconds=60)
MAX_ATTEMPTS = 5


class RegistrationEmailError(Exception):
    """The verification e-mail could not be sent."""


# --------------------------------------------------------------------- hashing


def _keyed_hash(purpose: str, email: str, secret: str) -> str:
    return salted_hmac(f"learnsmart.registration.{purpose}", f"{email}:{secret}").hexdigest()


def hash_code(email: str, code: str) -> str:
    return _keyed_hash("code", email, code)


def hash_token(email: str, token: str) -> str:
    return _keyed_hash("token", email, token)


def code_matches(pending: PendingRegistration, code: str) -> bool:
    return constant_time_compare(pending.code_hash, hash_code(pending.email, code))


def token_matches(pending: PendingRegistration, token: str) -> bool:
    return constant_time_compare(pending.token_hash, hash_token(pending.email, token))


def _new_code() -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(6))


# ---------------------------------------------------------------------- e-mail


def send_registration_code(email: str, code: str) -> None:
    """E-mail the code. Uses Django's e-mail backend (console in dev, SMTP in prod)."""
    minutes = int(CODE_TTL.total_seconds() // 60)
    subject = "Your Learn Smart verification code"
    text = (
        "Hi,\n\n"
        "Use this code to finish creating your Learn Smart account:\n\n"
        f"    {code}\n\n"
        f"It expires in {minutes} minutes. If you did not try to sign up, "
        "you can safely ignore this e-mail.\n\n"
        "- The Learn Smart team\n"
    )
    html = (
        '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:420px;margin:auto;color:#212d2a">'
        "<p>Use this code to finish creating your Learn Smart account:</p>"
        '<p style="font-size:34px;font-weight:700;letter-spacing:8px;background:#e8f0e5;'
        f'padding:14px 0;text-align:center;border-radius:14px;margin:18px 0">{code}</p>'
        f'<p style="color:#4a635a;font-size:14px">It expires in {minutes} minutes. If you did not try to sign up, '
        "you can safely ignore this e-mail.</p></div>"
    )
    try:
        message = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [email])
        message.attach_alternative(html, "text/html")
        message.send(fail_silently=False)
    except Exception as exc:  # SMTP down, bad credentials, ...
        logger.exception("registration.email_failed", extra={"email": email})
        raise RegistrationEmailError(str(exc)) from exc


# -------------------------------------------------------------------- services


def seconds_until_resend(pending: PendingRegistration) -> int:
    remaining = (pending.last_sent_at + RESEND_COOLDOWN - timezone.now()).total_seconds()
    return max(0, math.ceil(remaining))


def begin_registration(*, email, first_name, last_name, password):
    """
    Park the sign-up and e-mail a code.

    Returns (pending, raw_token). Raises RegistrationEmailError if the mail
    could not be sent. The caller must have checked seconds_until_resend()
    for an existing pending row first (see RegisterView).
    """
    now = timezone.now()
    # Opportunistic clean-up of long-dead sign-ups.
    PendingRegistration.objects.filter(expires_at__lt=now - timedelta(days=1)).delete()

    code = _new_code()
    token = secrets.token_urlsafe(32)
    pending, _created = PendingRegistration.objects.update_or_create(
        email=email,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "password_hash": make_password(password),
            "code_hash": hash_code(email, code),
            "token_hash": hash_token(email, token),
            "attempts": 0,
            "last_sent_at": now,
            "expires_at": now + CODE_TTL,
        },
    )
    try:
        send_registration_code(email, code)
    except RegistrationEmailError:
        pending.delete()  # nothing was delivered, so don't leave a dangling sign-up
        raise
    return pending, token


def resend_code(pending: PendingRegistration) -> None:
    """New code for an existing pending sign-up (caller checks the cooldown)."""
    now = timezone.now()
    code = _new_code()
    pending.code_hash = hash_code(pending.email, code)
    pending.attempts = 0
    pending.last_sent_at = now
    pending.expires_at = now + CODE_TTL
    pending.save(update_fields=["code_hash", "attempts", "last_sent_at", "expires_at"])
    send_registration_code(pending.email, code)  # may raise RegistrationEmailError


def create_user_from_pending(pending: PendingRegistration) -> User:
    """Turn a verified sign-up into a real teacher account (caller deletes `pending`)."""
    user = User(
        email=pending.email,
        first_name=pending.first_name,
        last_name=pending.last_name,
        role=User.ROLE_TEACHER,
        is_active=True,
    )
    user.password = pending.password_hash  # already hashed
    user.last_login = timezone.now()
    user.save()
    return user


# ----------------------------------------------------------------- serializers


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    role = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists. Try logging in instead."
            )
        return email

    def validate_role(self, value):
        if value and value != User.ROLE_TEACHER:
            raise serializers.ValidationError(
                "Only teacher accounts can be created here. "
                "Students are added by their teacher or school."
            )
        return User.ROLE_TEACHER

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": ["Passwords do not match."]})
        candidate = User(
            email=attrs["email"], first_name=attrs["first_name"], last_name=attrs["last_name"]
        )
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs


class VerifySerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    code = serializers.RegexField(r"^\d{6}$", error_messages={"invalid": "Enter the 6-digit code."})
    registration_token = serializers.CharField(max_length=200)

    def validate_email(self, value):
        return value.strip().lower()


class ResendSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    registration_token = serializers.CharField(max_length=200)

    def validate_email(self, value):
        return value.strip().lower()


# -------------------------------------------------------------------- throttle


class RegistrationThrottle(AnonRateThrottle):
    """
    Per-IP limit shared by the three sign-up endpoints (rate: settings
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["registration"]).

    Fails OPEN: if the cache (Redis) is unreachable we log it and let the
    request through, so a cache outage never makes sign-up crash.
    """

    scope = "registration"

    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:  # noqa: BLE001 - deliberate: never turn a cache outage into a 500
            logger.warning("registration.throttle_unavailable", exc_info=True)
            return True
