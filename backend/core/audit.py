
import logging
from typing import Any, Optional

from .models import AuditLog


logger = logging.getLogger("core.audit")



AUDIT_ACTION_WHITELIST = frozenset({
    # Authentication
    "auth.login.success",
    "auth.login.failed",
    "auth.login.blocked",
    "auth.logout",
    "auth.refresh.reuse_detected",
    "auth.password_reset.requested",
    "auth.password_reset.completed",
    "auth.ws_ticket.issued",

    # User management
    "user.created",
    "user.updated",
    "user.activated",
    "user.deactivated",
    "user.suspended",
    "user.reactivated",

    # Sessions
    "session.revoked",
    "sessions.revoked_all",

    # Courses
    "course.created",
    "course.updated",
    "course.archived",
    "course.restored",

    # Timetable
    "timetable.created",
    "timetable.updated",
    "timetable.deleted",

    # System / test
    "test.verify",
})



_SECRET_KEY_PATTERNS = (
    "password",
    "token",
    "secret",
    "api_key",
    "apikey",
    "authorization",
    "cookie",
    "session",
    "jwt",
)

_MAX_STRING_LEN = 500


def _is_secret_key(key: str) -> bool:
    k = key.lower()
    return any(pattern in k for pattern in _SECRET_KEY_PATTERNS)


def _sanitize_metadata(metadata: Optional[dict]) -> dict:
    """
    Return a new dict with secret-shaped keys removed, long strings
    truncated, and non-JSON-serializable values coerced to strings.
    """
    if not metadata:
        return {}

    clean: dict[str, Any] = {}
    for key, value in metadata.items():
        if _is_secret_key(key):
            continue

        if isinstance(value, str):
            clean[key] = value[:_MAX_STRING_LEN]
        elif isinstance(value, (int, float, bool)) or value is None:
            clean[key] = value
        elif isinstance(value, (list, tuple)):
            clean[key] = [
                str(v)[:_MAX_STRING_LEN] if isinstance(v, (str, bytes)) else v
                for v in value
            ]
        elif isinstance(value, dict):
            clean[key] = {
                str(k)[:_MAX_STRING_LEN]: (
                    str(v)[:_MAX_STRING_LEN]
                    if isinstance(v, (str, bytes))
                    else v
                )
                for k, v in value.items()
                if not _is_secret_key(str(k))
            }
        else:
            clean[key] = str(value)[:_MAX_STRING_LEN]

    return clean


def log_audit(
    *,
    action: str,
    actor=None,
    actor_type: str = "user",
    institution=None,
    resource_type: Optional[str] = None,
    resource_id=None,
    metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: str = "",
    request=None,
) -> Optional[AuditLog]:
    """
    Write one audit row.

    `request` is an optional convenience: when passed, ip_address and
    user_agent are extracted from it if not otherwise provided, and the
    actor is inferred from request.user if not explicitly given.

    Returns the created row on success, or None on failure. Never raises.
    """
    # Convenience extraction from request
    if request is not None:
        if ip_address is None:
            ip_address = request.META.get("REMOTE_ADDR")
        if not user_agent:
            user_agent = request.META.get("HTTP_USER_AGENT", "") or ""
        if actor is None and getattr(request, "user", None) and request.user.is_authenticated:
            actor = request.user

    # Reject unknown actions. Log a warning but do not raise — a bad
    # action code shouldn't break the caller's request.
    if action not in AUDIT_ACTION_WHITELIST:
        logger.warning(
            "audit.unknown_action",
            extra={
                "action": action,
                "actor_id": str(actor.id) if actor else None,
            },
        )
        return None

    clean_meta = _sanitize_metadata(metadata)

    try:
        row = AuditLog.objects.create(
            actor=actor,
            actor_type=actor_type,
            institution=institution,
            action=action,
            resource_type=resource_type or "",
            resource_id=resource_id,
            metadata=clean_meta,
            ip_address=ip_address,
            user_agent=user_agent[:2000],  # cap UA to a sane length
        )
        return row
    except Exception as exc:  # noqa: BLE001 — intentional broad catch
        logger.error(
            "audit.write_failed",
            extra={
                "action": action,
                "actor_id": str(actor.id) if actor else None,
                "institution_id": str(institution.id) if institution else None,
                "resource_type": resource_type,
                "error_class": type(exc).__name__,
                "error_message": str(exc)[:200],
            },
            exc_info=True,
        )
        return None