"""
Refresh token and access token service.

Design summary:

- Refresh tokens are opaque (base64url of 32 random bytes). The plaintext
  is returned to the client once and never stored. Only the SHA-256 hash
  is persisted.
- Every refresh token belongs to a **family** (`family_id`, UUID). A
  login creates a new family. Rotation issues a new token in the same
  family and revokes the old one.
- If a rotated token is presented again, the entire family is revoked —
  this is reuse detection.
- Access tokens remain JWTs. They carry `iat`, which the custom DRF
  authentication class compares against `user.tokens_valid_after` for
  global revocation.
- Rotation is performed under a DB row lock (`select_for_update`) so two
  concurrent refresh calls cannot both succeed.

Transaction boundary note:

  The reuse detection has to run in a *separate transaction* from the one
  that raises the error. If the family-revoke happened inside the same
  atomic block as the raise, the rollback triggered by the raise would
  undo it, and the rest of the family would stay refreshable. So
  `rotate_refresh_token` is a thin wrapper around an atomic
  `_rotate_impl`, and the family kill runs in a fresh transaction after
  the rollback.
"""
import hashlib
import secrets
from datetime import timedelta
from uuid import uuid4

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken as SimpleJWTRefresh

from .models import RefreshToken


REFRESH_TOKEN_LIFETIME = timedelta(days=7)


# ---------------------------------------------------------------------------
# Hashing and generation
# ---------------------------------------------------------------------------

def hash_token(raw: str) -> str:
    """SHA-256 hex digest of the plaintext token."""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def generate_opaque_token() -> str:
    """A URL-safe random string with >= 256 bits of entropy."""
    return secrets.token_urlsafe(32)


# ---------------------------------------------------------------------------
# Device label parser
# ---------------------------------------------------------------------------

_OS_LABELS = [
    ("Windows", "Windows"),
    ("Mac OS X", "macOS"),
    ("Macintosh", "macOS"),
    ("Android", "Android"),
    ("iPhone", "iPhone"),
    ("iPad", "iPad"),
    ("Linux", "Linux"),
    ("CrOS", "ChromeOS"),
]

_BROWSER_LABELS = [
    ("Edg/", "Edge"),
    ("OPR/", "Opera"),
    ("Chrome/", "Chrome"),
    ("Firefox/", "Firefox"),
    ("Safari/", "Safari"),
]


def parse_device_label(user_agent: str) -> str:
    """Best-effort label like 'Chrome on Windows'."""
    if not user_agent:
        return "Unknown device"

    browser = None
    for needle, label in _BROWSER_LABELS:
        if needle in user_agent:
            browser = label
            break

    os_label = None
    for needle, label in _OS_LABELS:
        if needle in user_agent:
            os_label = label
            break

    if browser and os_label:
        return f"{browser} on {os_label}"
    if browser:
        return browser
    if os_label:
        return os_label
    return "Unknown device"


# ---------------------------------------------------------------------------
# Access token (JWT)
# ---------------------------------------------------------------------------

def issue_access_token(user) -> str:
    """Short-lived JWT, courtesy of SimpleJWT."""
    jwt = SimpleJWTRefresh.for_user(user)
    return str(jwt.access_token)


# ---------------------------------------------------------------------------
# Refresh token issuance
# ---------------------------------------------------------------------------

def issue_refresh_token(user, *, family_id=None, ip_address=None, user_agent=""):
    """Create a new refresh token row and return (plaintext, row)."""
    raw = generate_opaque_token()
    token_hash = hash_token(raw)

    if family_id is None:
        family_id = uuid4()

    row = RefreshToken.objects.create(
        user=user,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=timezone.now() + REFRESH_TOKEN_LIFETIME,
        ip_address=ip_address or None,
        user_agent=user_agent or "",
        device_label=parse_device_label(user_agent or ""),
    )
    return raw, row


# ---------------------------------------------------------------------------
# Refresh token rotation with reuse detection
# ---------------------------------------------------------------------------

class RefreshTokenError(Exception):
    """Raised by rotate_refresh_token on any non-success path.

    reason:
        - "not_found"       token hash not in DB at all
        - "revoked"         token revoked for a non-rotation reason
        - "expired"         token past expires_at
        - "reuse_detected"  token had already been rotated
    """

    def __init__(self, reason, *, user=None):
        super().__init__(reason)
        self.reason = reason
        self.user = user


def rotate_refresh_token(raw_token, *, ip_address=None, user_agent=""):
    """
    Exchange a refresh token for a new one + a new access token.

    Returns (new_raw_refresh, new_access_token, user) on success.
    Raises RefreshTokenError with a reason on failure.
    """
    try:
        return _rotate_impl(
            raw_token, ip_address=ip_address, user_agent=user_agent
        )
    except RefreshTokenError as e:
        # The atomic block that raised has been rolled back. If this was a
        # reuse detection, kill the family now, in a fresh transaction, so
        # the rollback cannot undo it.
        if e.reason == "reuse_detected":
            _revoke_family_by_token_hash(
                hash_token(raw_token), reason="reuse_detected"
            )
        raise


@transaction.atomic
def _rotate_impl(raw_token, *, ip_address=None, user_agent=""):
    """The actual rotation logic. Rolled back automatically on raise."""
    token_hash = hash_token(raw_token)

    try:
        token = (
            RefreshToken.objects
            .select_for_update()
            .get(token_hash=token_hash)
        )
    except RefreshToken.DoesNotExist:
        raise RefreshTokenError("not_found")

    # Rotated already — signal reuse. Do NOT revoke the family here;
    # the raise would roll back the update. The outer wrapper handles it.
    if token.revoked_at is not None and token.revoked_reason == "rotated":
        raise RefreshTokenError("reuse_detected", user=token.user)

    if token.revoked_at is not None:
        raise RefreshTokenError("revoked", user=token.user)

    if token.expires_at <= timezone.now():
        token.revoked_at = timezone.now()
        token.revoked_reason = "expired"
        token.save(update_fields=["revoked_at", "revoked_reason"])
        raise RefreshTokenError("expired", user=token.user)

    # Success path.
    new_raw, new_row = issue_refresh_token(
        user=token.user,
        family_id=token.family_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    token.revoked_at = timezone.now()
    token.revoked_reason = "rotated"
    token.used_at = timezone.now()
    token.last_used_at = timezone.now()
    token.replaced_by = new_row
    token.save(
        update_fields=[
            "revoked_at", "revoked_reason",
            "used_at", "last_used_at", "replaced_by",
        ]
    )

    access = issue_access_token(token.user)
    return new_raw, access, token.user


def _revoke_family_by_token_hash(token_hash, *, reason):
    """
    Revoke every live token in the family that contains the given hash.

    Runs in its own transaction. Idempotent. Safe to call when the token
    no longer exists (returns silently).
    """
    with transaction.atomic():
        try:
            token = (
                RefreshToken.objects
                .select_for_update()
                .get(token_hash=token_hash)
            )
        except RefreshToken.DoesNotExist:
            return

        RefreshToken.objects.filter(
            family_id=token.family_id,
            revoked_at__isnull=True,
        ).update(
            revoked_at=timezone.now(),
            revoked_reason=reason,
        )


def _revoke_family(family_id, *, reason):
    """Revoke every un-revoked token in a family. Idempotent."""
    now = timezone.now()
    RefreshToken.objects.filter(
        family_id=family_id, revoked_at__isnull=True
    ).update(
        revoked_at=now,
        revoked_reason=reason,
    )


# ---------------------------------------------------------------------------
# Revocation helpers
# ---------------------------------------------------------------------------

def revoke_one(raw_token, *, reason="logout"):
    """Revoke a single refresh token by its plaintext. Idempotent."""
    token_hash = hash_token(raw_token)
    RefreshToken.objects.filter(
        token_hash=token_hash, revoked_at__isnull=True
    ).update(
        revoked_at=timezone.now(),
        revoked_reason=reason,
    )


def revoke_all_user_tokens(user, *, reason, set_tokens_valid_after=True):
    """
    Revoke every active refresh token for a user. Optionally set
    `tokens_valid_after = now()` so already-issued access JWTs are also
    rejected on their next use.
    """
    now = timezone.now()
    RefreshToken.objects.filter(
        user=user, revoked_at__isnull=True
    ).update(
        revoked_at=now,
        revoked_reason=reason,
    )

    if set_tokens_valid_after:
        user.tokens_valid_after = now
        user.save(update_fields=["tokens_valid_after"])