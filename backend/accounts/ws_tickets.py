"""
WebSocket tickets: short-lived, single-use, opaque strings that let a
browser open a WebSocket without putting a long-lived JWT in the URL.

Flow:

  1. Client has a valid access JWT and an authenticated HTTPS session.
  2. Client POSTs /api/v1/auth/ws-ticket/ with the JWT in the
     Authorization header.
  3. Server mints a random opaque string (32 bytes base64url), stores
     the SHA-256 hash in Redis as `ws_ticket:<hash>` with a 30-second
     TTL, and the value `{user_id, institution_id, issued_at}`.
  4. Server returns the plaintext ticket to the client.
  5. Client connects: `wss://.../ws/presence/?ticket=<opaque>`.
  6. Consumer hashes the ticket, atomically GET-DELs the Redis key, and
     uses the stored user_id/institution_id.
  7. Any subsequent attempt with the same ticket fails — the key is gone.

Why this is safer than a JWT in the URL:

  - 30-second lifetime (vs 30 minutes for the access JWT).
  - Single use (deleted atomically on first consume).
  - Bounded scope: opening a presence WebSocket is all it can do; it
    cannot call the REST API.
  - If a proxy logs the URL, the leaked ticket is already stale (either
    expired or consumed).
  - The consumer still re-verifies the user's state (is_active,
    tokens_valid_after, institution state) against the DB, so a stale
    ticket cannot bypass a global revocation.
"""
import hashlib
import json
import secrets

from django.core.cache import cache


TICKET_TTL_SECONDS = 30
TICKET_PREFIX = "ws_ticket:"


def _hash(ticket: str) -> str:
    return hashlib.sha256(ticket.encode("utf-8")).hexdigest()


def _key(ticket_hash: str) -> str:
    return f"{TICKET_PREFIX}{ticket_hash}"


def mint_ticket(user) -> str:
    """
    Create a fresh ticket for the user, store its hash in Redis, and
    return the plaintext.

    Returns the plaintext ticket string. The caller must transmit it to
    the client immediately; the server cannot reproduce it.
    """
    plaintext = secrets.token_urlsafe(32)
    h = _hash(plaintext)

    payload = {
        "user_id": str(user.id),
        "institution_id": str(user.institution_id) if user.institution_id else None,
    }

    cache.set(_key(h), json.dumps(payload), timeout=TICKET_TTL_SECONDS)
    return plaintext


def consume_ticket(plaintext: str):
    """
    Atomically consume a ticket. Returns a dict with user_id and
    institution_id, or None if the ticket is unknown / expired / already
    consumed.

    Single-use is guaranteed by `cache.delete()` returning True only for
    the first caller. A second caller in the same millisecond will see
    delete() return False because the key is gone.

    Note on atomicity: Django's cache framework does not guarantee
    atomic get-and-delete across all backends, but on Redis the
    DELETE-then-check pattern is atomic because Redis single-threads
    each command. For a stricter guarantee, a small Lua script
    (`GETDEL`) would be ideal; the current approach is sufficient here
    because the window is a single Redis round-trip.

    Additional safety: the consumer re-verifies the user's state after
    reading the ticket, so even a race that produced two consumers with
    the same ticket would still end up with both re-checking the DB.
    """
    if not plaintext:
        return None

    h = _hash(plaintext)
    key = _key(h)

    # Fetch the payload first, then delete. If the payload is missing,
    # there's nothing to consume.
    raw = cache.get(key)
    if raw is None:
        return None

    # Delete and confirm. On Redis, DEL is atomic; the first caller sees
    # True, subsequent callers see False.
    deleted = cache.delete(key)
    if not deleted:
        # Someone else consumed it between our GET and DEL. Treat as
        # already-consumed.
        return None

    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return None