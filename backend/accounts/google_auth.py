"""
Google Sign-In support.

The browser (Google Identity Services) hands the frontend a signed *ID token*
(a JWT). We never trust anything the browser says about the user; instead we
verify the token ourselves with Google's public keys:

    * the signature is genuine (Google signed it)
    * it was issued for OUR OAuth client (audience == GOOGLE_OAUTH_CLIENT_ID)
    * it has not expired, and the issuer is Google
    * Google has verified the e-mail address (email_verified is true)

Only after all of that do we look the e-mail up in our own user table.
See accounts.views.GoogleLoginView.
"""
from django.conf import settings


class GoogleAuthNotConfigured(Exception):
    """GOOGLE_OAUTH_CLIENT_ID is not set on the server."""


class GoogleUnavailable(Exception):
    """We could not reach Google to fetch the public keys."""


class GoogleTokenError(Exception):
    """The credential is invalid, expired, for another app, or the e-mail is unverified."""


def verify_google_credential(credential: str) -> dict:
    """Return the verified claims of a Google ID token, or raise one of the errors above."""
    client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or ""
    if not client_id:
        raise GoogleAuthNotConfigured()

    # Imported lazily so the rest of the API still starts if google-auth is missing.
    from google.auth import exceptions as google_exceptions
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        claims = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id
        )
    except google_exceptions.TransportError as exc:
        raise GoogleUnavailable(str(exc)) from exc
    except ValueError as exc:  # bad signature / audience / issuer / expired / malformed
        raise GoogleTokenError(str(exc)) from exc

    if not claims.get("email") or not claims.get("email_verified"):
        raise GoogleTokenError("Google has not verified this e-mail address.")

    return claims