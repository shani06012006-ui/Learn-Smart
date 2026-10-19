from datetime import timedelta
from unittest import mock

from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.google_auth import (
    GoogleAuthNotConfigured,
    GoogleTokenError,
    GoogleUnavailable,
    verify_google_credential,
)
from accounts.models import RefreshToken, User
from institutions.models import Institution

CLIENT_ID = "test-client.apps.googleusercontent.com"
VERIFY = "accounts.views.verify_google_credential"


def claims(email="teacher@example.com", **extra):
    base = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "email": email,
        "email_verified": True,
        "given_name": "Anita",
        "family_name": "Iyer",
    }
    base.update(extra)
    return base


class GoogleLoginViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("auth-google")
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.teacher = User.objects.create_user(
            email="teacher@example.com", password="pass12345",
            first_name="Anita", last_name="Iyer",
            role=User.ROLE_TEACHER, institution=self.institution,
        )

    # --- happy path -------------------------------------------------------
    def test_existing_teacher_can_sign_in(self):
        with mock.patch(VERIFY, return_value=claims()):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["user"]["email"], "teacher@example.com")
        self.assertEqual(res.data["user"]["role"], "teacher")
        self.assertTrue(res.data["access"])
        self.assertTrue(res.data["refresh"])
        self.assertEqual(RefreshToken.objects.filter(user=self.teacher).count(), 1)
        self.teacher.refresh_from_db()
        self.assertIsNotNone(self.teacher.last_login)

    def test_email_match_ignores_case(self):
        with mock.patch(VERIFY, return_value=claims(email="Teacher@Example.COM")):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_remember_me_gives_a_30_day_refresh_token(self):
        with mock.patch(VERIFY, return_value=claims()):
            res = self.client.post(self.url, {"credential": "tok", "remember_me": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["remember_me"])
        row = RefreshToken.objects.get(user=self.teacher)
        self.assertGreater(row.expires_at, timezone.now() + timedelta(days=29))

    def test_missing_names_are_filled_from_google_but_never_overwritten(self):
        nameless = User.objects.create_user(
            email="new@example.com", password="pass12345", role=User.ROLE_TEACHER,
        )
        with mock.patch(VERIFY, return_value=claims(email="new@example.com", given_name="Meera", family_name="Rao")):
            self.client.post(self.url, {"credential": "tok"}, format="json")
        nameless.refresh_from_db()
        self.assertEqual((nameless.first_name, nameless.last_name), ("Meera", "Rao"))

        with mock.patch(VERIFY, return_value=claims(given_name="Someone", family_name="Else")):
            self.client.post(self.url, {"credential": "tok"}, format="json")
        self.teacher.refresh_from_db()
        self.assertEqual((self.teacher.first_name, self.teacher.last_name), ("Anita", "Iyer"))

    def test_admin_can_sign_in(self):
        User.objects.create_user(email="boss@example.com", password="x", role=User.ROLE_ADMIN)
        with mock.patch(VERIFY, return_value=claims(email="boss@example.com")):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["user"]["role"], "admin")

    # --- refusals ---------------------------------------------------------
    def test_unknown_email_is_refused_and_no_account_is_created(self):
        before = User.objects.count()
        with mock.patch(VERIFY, return_value=claims(email="stranger@gmail.com")):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data["error"]["code"], "no_account")
        self.assertEqual(User.objects.count(), before)

    def test_deactivated_account_is_refused(self):
        self.teacher.is_active = False
        self.teacher.save(update_fields=["is_active"])
        with mock.patch(VERIFY, return_value=claims()):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data["error"]["code"], "deactivated")

    def test_student_accounts_must_use_their_pin(self):
        User.objects.create_user(email="kid@example.com", password="x", role=User.ROLE_STUDENT)
        with mock.patch(VERIFY, return_value=claims(email="kid@example.com")):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data["error"]["code"], "student_use_pin")
        self.assertFalse(RefreshToken.objects.filter(user__email="kid@example.com").exists())

    def test_missing_credential_is_a_400(self):
        res = self.client.post(self.url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["error"]["code"], "missing_credential")

    def test_invalid_token_is_a_400_never_a_401(self):
        with mock.patch(VERIFY, side_effect=GoogleTokenError("bad")):
            res = self.client.post(self.url, {"credential": "junk"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["error"]["code"], "invalid_google_token")

    def test_not_configured_is_a_503(self):
        with mock.patch(VERIFY, side_effect=GoogleAuthNotConfigured()):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(res.data["error"]["code"], "google_not_configured")

    def test_google_unreachable_is_a_503(self):
        with mock.patch(VERIFY, side_effect=GoogleUnavailable("offline")):
            res = self.client.post(self.url, {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(res.data["error"]["code"], "google_unreachable")


class VerifyGoogleCredentialTests(APITestCase):
    """The helper itself, with Google's library mocked (no network)."""

    @override_settings(GOOGLE_OAUTH_CLIENT_ID="")
    def test_raises_when_client_id_missing(self):
        with self.assertRaises(GoogleAuthNotConfigured):
            verify_google_credential("tok")

    @override_settings(GOOGLE_OAUTH_CLIENT_ID=CLIENT_ID)
    def test_returns_claims_for_a_valid_token(self):
        with mock.patch("google.oauth2.id_token.verify_oauth2_token", return_value=claims()) as m:
            out = verify_google_credential("tok")
        self.assertEqual(out["email"], "teacher@example.com")
        # It must verify against OUR client id, so tokens minted for other apps are rejected.
        self.assertEqual(m.call_args.args[2], CLIENT_ID)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID=CLIENT_ID)
    def test_rejects_unverified_email(self):
        with mock.patch(
            "google.oauth2.id_token.verify_oauth2_token",
            return_value=claims(email_verified=False),
        ):
            with self.assertRaises(GoogleTokenError):
                verify_google_credential("tok")

    @override_settings(GOOGLE_OAUTH_CLIENT_ID=CLIENT_ID)
    def test_library_value_error_becomes_token_error(self):
        with mock.patch(
            "google.oauth2.id_token.verify_oauth2_token",
            side_effect=ValueError("Wrong recipient"),
        ):
            with self.assertRaises(GoogleTokenError):
                verify_google_credential("tok")

    @override_settings(GOOGLE_OAUTH_CLIENT_ID=CLIENT_ID)
    def test_network_failure_becomes_unavailable(self):
        from google.auth.exceptions import TransportError

        with mock.patch(
            "google.oauth2.id_token.verify_oauth2_token",
            side_effect=TransportError("no network"),
        ):
            with self.assertRaises(GoogleUnavailable):
                verify_google_credential("tok")


class PasswordLoginRememberMeRegressionTests(APITestCase):
    """'Remember me for 30 days' used to crash with a 500 (missing import)."""

    def setUp(self):
        User.objects.create_user(
            email="teacher@example.com", password="pass12345", role=User.ROLE_TEACHER
        )

    def test_remember_me_login_succeeds_with_a_30_day_token(self):
        res = self.client.post(
            reverse("auth-login"),
            {"email": "teacher@example.com", "password": "pass12345", "remember_me": True},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        row = RefreshToken.objects.get(user__email="teacher@example.com")
        self.assertGreater(row.expires_at, timezone.now() + timedelta(days=29))

    def test_plain_login_still_uses_the_default_lifetime(self):
        res = self.client.post(
            reverse("auth-login"),
            {"email": "teacher@example.com", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        row = RefreshToken.objects.get(user__email="teacher@example.com")
        self.assertLess(row.expires_at, timezone.now() + timedelta(days=10))