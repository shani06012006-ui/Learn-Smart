"""
Tests for the student creation + activation flow (accounts/activation.py).

Run:  pytest accounts/test_activation.py
"""
import hashlib
from datetime import timedelta
from unittest import mock

from django.contrib.auth.hashers import check_password
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.activation import (
    ActivationRequestThrottle,
    mask_email,
    normalise_whatsapp_number,
)
from accounts.models import LoginOTP, PasswordResetToken, RefreshToken, StudentCredentials, User
from accounts.services import generate_login_otp, generate_student_pin
from accounts.token_service import issue_access_token
from institutions.models import Institution

LOCMEM = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
GOOD_PASSWORD = "Sunflower-Maths-42"
USERS_URL = "/api/v1/admin/users/"


def error_of(response):
    return response.data["error"]


def raw_token_of(invitation):
    """The plaintext token is the part after '#token=' in the activation URL."""
    return invitation["activation_url"].split("#token=", 1)[1]


@override_settings(CACHES=LOCMEM)
class ActivationBase(APITestCase):
    def setUp(self):
        cache.clear()
        self.school = Institution.objects.create(name="Northwood", slug="northwood")
        self.admin = User.objects.create_user(
            email="admin@school.test",
            password="AdminPass-123!",
            role=User.ROLE_ADMIN,
            institution=self.school,
        )
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(self.admin)
        self.public = APIClient()  # what a student's browser is: no credentials at all

    # -- helpers ---------------------------------------------------------
    def create_student(self, client=None, **over):
        body = {
            "email": "aarav@school.test",
            "first_name": "Aarav",
            "last_name": "Sharma",
            "role": "student",
        }
        body.update(over)
        return (client or self.admin_client).post(USERS_URL, body, format="json")

    def new_student(self, **over):
        """Create a pending student through the real admin endpoint. Returns (user, raw_token)."""
        res = self.create_student(**over)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        user = User.objects.get(email=res.data["email"])
        return user, raw_token_of(res.data["invitation"])

    def validate(self, token):
        return self.public.post(reverse("auth-activation-validate"), {"token": token}, format="json")

    def complete(self, token, password=GOOD_PASSWORD, confirm=None):
        return self.public.post(
            reverse("auth-activation-complete"),
            {
                "token": token,
                "new_password": password,
                "confirm_password": password if confirm is None else confirm,
            },
            format="json",
        )

    def request_link(self, email):
        return self.public.post(reverse("auth-activation-request"), {"email": email}, format="json")


# =============================================================================
# Step 1-3: admin creates a student, the system issues + sends a link
# =============================================================================
class AdminCreatesStudentTests(ActivationBase):
    def test_student_is_created_without_a_password_and_flagged(self):
        res = self.create_student()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)

        user = User.objects.get(email="aarav@school.test")
        self.assertEqual(user.role, User.ROLE_STUDENT)
        self.assertEqual(user.institution, self.school)
        self.assertTrue(user.must_set_password)
        self.assertFalse(user.has_usable_password())
        self.assertTrue(res.data["must_set_password"])

    def test_a_password_sent_for_a_student_is_ignored(self):
        res = self.create_student(password="AdminChosen-123!")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        user = User.objects.get(email="aarav@school.test")
        self.assertFalse(user.has_usable_password())
        self.assertNotIn("password", res.data)
        login = self.public.post(
            reverse("auth-login"),
            {"email": "aarav@school.test", "password": "AdminChosen-123!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_activation_link_is_emailed_with_login_url(self):
        res = self.create_student()
        invitation = res.data["invitation"]

        self.assertTrue(invitation["email_sent"])
        self.assertIsNone(invitation["email_error"])
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["aarav@school.test"])
        self.assertIn(invitation["activation_url"], message.body)
        self.assertIn(invitation["login_url"], message.body)
        self.assertTrue(invitation["login_url"].endswith("/login"))
        self.assertIn("/activate#token=", invitation["activation_url"])
        # the HTML alternative carries the same link
        self.assertIn(invitation["activation_url"], message.alternatives[0][0])

    def test_token_is_stored_only_as_a_hash_and_expires(self):
        res = self.create_student()
        raw = raw_token_of(res.data["invitation"])
        row = PasswordResetToken.objects.get()

        self.assertEqual(row.token_hash, hashlib.sha256(raw.encode()).hexdigest())
        self.assertNotEqual(row.token_hash, raw)
        self.assertEqual(row.purpose, PasswordResetToken.PURPOSE_ACTIVATION)
        self.assertEqual(row.issued_by, self.admin)
        self.assertIsNone(row.consumed_at)
        # default lifetime is 48 hours
        remaining = row.expires_at - timezone.now()
        self.assertGreater(remaining, timedelta(hours=47, minutes=55))
        self.assertLessEqual(remaining, timedelta(hours=48))
        self.assertEqual(res.data["invitation"]["expires_in_hours"], 48)
        # the plaintext token must not be in the database anywhere on that row
        self.assertNotIn(raw, [str(v) for v in row.__dict__.values()])

    @override_settings(ACTIVATION_TOKEN_TTL_HOURS=2)
    def test_lifetime_is_configurable(self):
        self.create_student()
        row = PasswordResetToken.objects.get()
        self.assertLessEqual(row.expires_at - timezone.now(), timedelta(hours=2))

    def test_token_is_long_and_unique_per_student(self):
        _, t1 = self.new_student(email="a1@school.test")
        _, t2 = self.new_student(email="a2@school.test")
        self.assertNotEqual(t1, t2)
        self.assertGreaterEqual(len(t1), 40)  # >= 256 bits of entropy, base64url

    def test_whatsapp_link_is_built_and_email_can_be_skipped(self):
        res = self.create_student(send_via=["whatsapp"], phone="+91 98765 43210")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        inv = res.data["invitation"]

        self.assertFalse(inv["email_sent"])
        self.assertEqual(len(mail.outbox), 0)
        self.assertTrue(inv["whatsapp_url"].startswith("https://wa.me/919876543210?text="))
        self.assertEqual(inv["whatsapp_to"], "+919876543210")  # shown to the admin to double-check
        # the message carries the (URL-encoded) activation link and the login page
        from urllib.parse import unquote

        text = unquote(inv["whatsapp_url"].split("?text=", 1)[1])
        self.assertIn(inv["activation_url"], text)
        self.assertIn(inv["login_url"], text)
        # the phone number is not stored anywhere on the user
        self.assertFalse(any("98765" in str(v) for v in User.objects.get(email="aarav@school.test").__dict__.values()))

    def test_email_and_whatsapp_together(self):
        res = self.create_student(send_via=["email", "whatsapp"], phone="+919876543210")
        inv = res.data["invitation"]
        self.assertTrue(inv["email_sent"])
        self.assertIsNotNone(inv["whatsapp_url"])
        self.assertEqual(len(mail.outbox), 1)

    def test_whatsapp_needs_a_valid_phone_number(self):
        for bad in ("", "abc", "12", "+0123456789", "98765 43210", "919876543210"):
            res = self.create_student(send_via=["whatsapp"], phone=bad)
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, bad)
            self.assertIn("phone", error_of(res)["detail"])
        self.assertFalse(User.objects.filter(email="aarav@school.test").exists())

    def test_sending_nothing_still_returns_the_link_to_copy(self):
        res = self.create_student(send_via=[])
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        inv = res.data["invitation"]
        self.assertFalse(inv["email_sent"])
        self.assertIsNone(inv["email_error"])
        self.assertIsNone(inv["whatsapp_url"])
        self.assertIsNone(inv["whatsapp_to"])
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(self.validate(raw_token_of(inv)).status_code, 200)

    def test_unknown_channel_is_rejected(self):
        res = self.create_student(send_via=["pigeon"])
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_is_kept_when_the_email_cannot_be_sent(self):
        with mock.patch(
            "django.core.mail.message.EmailMessage.send", side_effect=OSError("smtp down")
        ):
            res = self.create_student()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        inv = res.data["invitation"]
        self.assertFalse(inv["email_sent"])
        self.assertTrue(inv["email_error"])
        # the admin can still hand over the link
        self.assertEqual(self.validate(raw_token_of(inv)).status_code, 200)

    def test_duplicate_email_is_rejected(self):
        self.new_student()
        res = self.create_student()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", error_of(res)["detail"])

    def test_only_admins_can_create_students(self):
        teacher = User.objects.create_user(
            email="t@school.test", password="x-Teacher-123", role="teacher", institution=self.school
        )
        client = APIClient()
        client.force_authenticate(teacher)
        res = self.create_student(client=client)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_and_detail_expose_the_pending_flag_but_never_a_link(self):
        user, raw = self.new_student()
        listing = self.admin_client.get(USERS_URL, {"role": "student"})
        row = next(r for r in listing.data["results"] if r["id"] == str(user.id))
        self.assertTrue(row["must_set_password"])
        self.assertNotIn("invitation", row)
        self.assertNotIn(raw, str(listing.data))
        detail = self.admin_client.get(f"{USERS_URL}{user.id}/")
        self.assertNotIn(raw, str(detail.data))


class TeacherCreationIsUnchangedTests(ActivationBase):
    def test_teacher_still_gets_an_admin_chosen_password(self):
        res = self.admin_client.post(
            USERS_URL,
            {"email": "t@school.test", "password": "Teacher-Pass-123", "role": "teacher"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertNotIn("invitation", res.data)
        teacher = User.objects.get(email="t@school.test")
        self.assertFalse(teacher.must_set_password)
        self.assertEqual(len(mail.outbox), 0)
        login = self.public.post(
            reverse("auth-login"), {"email": "t@school.test", "password": "Teacher-Pass-123"}, format="json"
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_teacher_password_is_still_required_and_validated(self):
        base = {"email": "t@school.test", "role": "teacher"}
        missing = self.admin_client.post(USERS_URL, base, format="json")
        self.assertEqual(missing.status_code, 400)
        self.assertIn("password", error_of(missing)["detail"])

        short = self.admin_client.post(USERS_URL, {**base, "password": "abc"}, format="json")
        self.assertEqual(short.status_code, 400)
        self.assertIn("password", error_of(short)["detail"])

        common = self.admin_client.post(USERS_URL, {**base, "password": "password"}, format="json")
        self.assertEqual(common.status_code, 400)
        self.assertFalse(User.objects.filter(email="t@school.test").exists())


# =============================================================================
# Step 4: student opens the link -> the system validates the token
# =============================================================================
class ValidateTokenTests(ActivationBase):
    def test_valid_link_greets_the_student_and_is_not_used_up(self):
        user, raw = self.new_student()
        first = self.validate(raw)
        self.assertEqual(first.status_code, status.HTTP_200_OK, first.data)
        self.assertTrue(first.data["valid"])
        self.assertEqual(first.data["first_name"], "Aarav")
        self.assertEqual(first.data["email_hint"], "a****@school.test")
        self.assertNotIn(user.email, str(first.data))  # full address is not echoed
        # looking again (page refresh) still works: validate does not consume
        self.assertEqual(self.validate(raw).status_code, status.HTTP_200_OK)
        self.assertIsNone(PasswordResetToken.objects.get().consumed_at)

    def test_garbage_token_is_invalid(self):
        res = self.validate("not-a-real-token")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_of(res)["code"], "invalid_token")

    def test_missing_token_is_a_400(self):
        res = self.public.post(reverse("auth-activation-validate"), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_link_is_refused(self):
        _, raw = self.new_student()
        PasswordResetToken.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
        res = self.validate(raw)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_of(res)["code"], "token_expired")

    def test_a_reset_token_is_not_an_activation_token(self):
        user, _ = self.new_student()
        PasswordResetToken.objects.all().delete()
        PasswordResetToken.objects.create(
            user=user,
            purpose=PasswordResetToken.PURPOSE_RESET,
            token_hash=hashlib.sha256(b"reset-secret").hexdigest(),
            expires_at=timezone.now() + timedelta(hours=1),
        )
        res = self.validate("reset-secret")
        self.assertEqual(error_of(res)["code"], "invalid_token")

    def test_deactivated_account_is_refused_with_403(self):
        user, raw = self.new_student()
        user.is_active = False
        user.save(update_fields=["is_active"])
        res = self.validate(raw)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(error_of(res)["code"], "account_inactive")

    def test_errors_are_never_401(self):
        # a 401 would make the frontend try to refresh a session and loop
        _, raw = self.new_student()
        for token in ("nope", raw):
            res = self.validate(token) if token == "nope" else self.validate(raw)
            self.assertNotEqual(res.status_code, 401)
        self.complete(raw)
        self.assertNotEqual(self.validate(raw).status_code, 401)


# =============================================================================
# Step 5-8: mandatory password setup, saved securely, token invalidated
# =============================================================================
class CompleteActivationTests(ActivationBase):
    def test_happy_path_sets_password_signs_in_and_uses_the_link_up(self):
        user, raw = self.new_student()
        res = self.complete(raw)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["email"], "aarav@school.test")
        self.assertEqual(res.data["user"]["role"], "student")

        user.refresh_from_db()
        self.assertFalse(user.must_set_password)
        self.assertTrue(user.has_usable_password())
        self.assertTrue(user.check_password(GOOD_PASSWORD))
        # stored hashed, never in clear
        self.assertNotEqual(user.password, GOOD_PASSWORD)
        self.assertNotIn(GOOD_PASSWORD, user.password)
        self.assertTrue(check_password(GOOD_PASSWORD, user.password))
        self.assertIsNotNone(PasswordResetToken.objects.get().consumed_at)
        self.assertTrue(RefreshToken.objects.filter(user=user).exists())

    def test_the_session_it_returns_works_on_the_api(self):
        _, raw = self.new_student()
        res = self.complete(raw)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        me = client.get(reverse("auth-me"))
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["email"], "aarav@school.test")

    def test_student_can_log_in_with_the_new_password_afterwards(self):
        _, raw = self.new_student()
        self.complete(raw)
        login = self.public.post(
            reverse("auth-login"),
            {"email": "aarav@school.test", "password": GOOD_PASSWORD},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK, login.data)
        self.assertEqual(login.data["user"]["role"], "student")

    def test_link_works_only_once(self):
        _, raw = self.new_student()
        self.assertEqual(self.complete(raw).status_code, 200)

        again = self.complete(raw, password="Another-Pass-77x")
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_of(again)["code"], "already_activated")
        # ...and the second attempt did not change the password
        user = User.objects.get(email="aarav@school.test")
        self.assertTrue(user.check_password(GOOD_PASSWORD))
        self.assertEqual(self.validate(raw).status_code, 400)

    def test_mismatching_passwords_are_refused_and_the_link_survives(self):
        user, raw = self.new_student()
        res = self.complete(raw, password=GOOD_PASSWORD, confirm="Different-Pass-99")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", error_of(res)["detail"])
        user.refresh_from_db()
        self.assertTrue(user.must_set_password)
        self.assertFalse(user.has_usable_password())
        self.assertEqual(self.validate(raw).status_code, 200)  # retry is possible
        self.assertEqual(self.complete(raw).status_code, 200)

    def test_weak_password_is_refused_and_the_link_survives(self):
        user, raw = self.new_student()
        for weak in ("12345678", "password", "short1", "aarav@school.test"):
            res = self.complete(raw, password=weak)
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, weak)
            self.assertIn("new_password", error_of(res)["detail"], weak)
            self.assertEqual(error_of(res)["detail"]["new_password"][0] != "", True)
        user.refresh_from_db()
        self.assertTrue(user.must_set_password)
        self.assertIsNone(PasswordResetToken.objects.get().consumed_at)
        self.assertEqual(self.complete(raw).status_code, 200)

    def test_blank_password_is_refused(self):
        _, raw = self.new_student()
        res = self.public.post(
            reverse("auth-activation-complete"),
            {"token": raw, "new_password": "", "confirm_password": ""},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_link_cannot_set_a_password(self):
        user, raw = self.new_student()
        PasswordResetToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        res = self.complete(raw)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_of(res)["code"], "token_expired")
        user.refresh_from_db()
        self.assertTrue(user.must_set_password)
        self.assertFalse(user.has_usable_password())

    def test_invalid_token_cannot_set_a_password(self):
        res = self.complete("forged-token-value")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_of(res)["code"], "invalid_token")

    def test_a_new_link_replaces_the_old_one(self):
        user, old = self.new_student()
        res = self.admin_client.post(f"{USERS_URL}{user.id}/resend-invite/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        new = raw_token_of(res.data["invitation"])

        self.assertNotEqual(old, new)
        old_res = self.validate(old)
        self.assertEqual(old_res.status_code, 400)
        self.assertEqual(error_of(old_res)["code"], "token_used")
        self.assertEqual(self.complete(old).status_code, 400)
        self.assertEqual(self.complete(new).status_code, 200)

    def test_finishing_setup_kills_every_other_outstanding_link(self):
        user, first = self.new_student()
        # a second, still-live link minted behind the scenes
        PasswordResetToken.objects.create(
            user=user,
            purpose=PasswordResetToken.PURPOSE_ACTIVATION,
            token_hash=hashlib.sha256(b"sibling").hexdigest(),
            expires_at=timezone.now() + timedelta(hours=5),
        )
        self.assertEqual(self.complete(first).status_code, 200)
        self.assertFalse(
            PasswordResetToken.objects.filter(user=user, consumed_at__isnull=True).exists()
        )
        self.assertEqual(self.complete("sibling", password="Other-Pass-9988").status_code, 400)

    def test_fixing_the_students_email_kills_the_link_sent_to_the_old_address(self):
        user, raw = self.new_student(email="aarav@typo.test")
        res = self.admin_client.patch(
            f"{USERS_URL}{user.id}/", {"email": "aarav@school.test"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(self.validate(raw).status_code, 400)  # the old link is dead
        self.assertEqual(self.complete(raw).status_code, 400)
        # the admin sends a new one to the right address
        sent = self.admin_client.post(f"{USERS_URL}{user.id}/resend-invite/", {}, format="json")
        self.assertEqual(sent.status_code, 200)
        self.assertEqual(mail.outbox[-1].to, ["aarav@school.test"])

    def test_editing_other_fields_does_not_kill_the_link(self):
        user, raw = self.new_student()
        self.admin_client.patch(f"{USERS_URL}{user.id}/", {"first_name": "Aaravi"}, format="json")
        self.assertEqual(self.validate(raw).status_code, 200)


# =============================================================================
# Requirement: no dashboard / API access before password setup
# =============================================================================
class NoAccessBeforeSetupTests(ActivationBase):
    def test_password_login_is_refused_for_a_pending_student(self):
        self.new_student()
        res = self.public.post(
            reverse("auth-login"),
            {"email": "aarav@school.test", "password": "anything-at-all"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)  # generic: no leak
        self.assertNotIn("access", res.data)

    def test_login_backstop_even_if_a_password_exists(self):
        user, _ = self.new_student()
        user.set_password("Known-Pass-123x")
        user.save()
        res = self.public.post(
            reverse("auth-login"),
            {"email": "aarav@school.test", "password": "Known-Pass-123x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(error_of(res)["code"], "password_setup_required")
        self.assertNotIn("access", res.data)

    def test_pin_login_cannot_skip_setup(self):
        user, _ = self.new_student()
        creds = generate_student_pin(user)
        res = self.public.post(reverse("student-pin-login"), {"pin": creds.pin}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, res.data)
        self.assertEqual(error_of(res)["code"], "password_setup_required")
        self.assertNotIn("access", res.data)
        creds.refresh_from_db()
        self.assertIsNone(creds.last_login_at)  # a refused sign-in is not recorded as a login

    def test_pin_login_works_again_once_setup_is_done(self):
        user, raw = self.new_student()
        creds = generate_student_pin(user)
        self.complete(raw)
        res = self.public.post(reverse("student-pin-login"), {"pin": creds.pin}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)

    def test_email_otp_cannot_skip_setup(self):
        user, raw = self.new_student()
        with mock.patch("builtins.print"):
            generate_login_otp(user.email)
        code = LoginOTP.objects.filter(email=user.email).latest("created_at").code
        res = self.public.post(
            reverse("auth-verify-otp"), {"email": user.email, "code": code}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, res.data)
        self.assertEqual(error_of(res)["code"], "password_setup_required")
        self.assertNotIn("access", res.data)

    def test_a_token_held_by_a_pending_account_is_useless_on_the_api(self):
        user, raw = self.new_student()
        access = issue_access_token(user)  # even if one were obtained some other way
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        res = client.get(reverse("auth-me"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)  # 403, not 401: no refresh loop
        self.assertIn("activation link", str(res.data))
        self.assertEqual(client.get("/api/v1/student/me/").status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(client.get("/api/v1/student/my-classes/").status_code, 403)

        # ...and the very same token works as soon as setup is complete
        self.complete(raw)
        self.assertEqual(client.get(reverse("auth-me")).status_code, status.HTTP_200_OK)

    def test_existing_students_are_not_locked_out(self):
        """Students created before this feature (flag False) keep logging in as before."""
        legacy = User.objects.create_user(
            email="old@school.test",
            password="Legacy-Pass-123",
            role=User.ROLE_STUDENT,
            institution=self.school,
        )
        self.assertFalse(legacy.must_set_password)
        res = self.public.post(
            reverse("auth-login"), {"email": "old@school.test", "password": "Legacy-Pass-123"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        creds = generate_student_pin(legacy)
        pin = self.public.post(reverse("student-pin-login"), {"pin": creds.pin}, format="json")
        self.assertEqual(pin.status_code, status.HTTP_200_OK)

    def test_teachers_and_admins_are_unaffected(self):
        res = self.public.post(
            reverse("auth-login"),
            {"email": "admin@school.test", "password": "AdminPass-123!"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)


# =============================================================================
# "Allow the student to retry or request a new link"
# =============================================================================
class RequestNewLinkTests(ActivationBase):
    GENERIC = "If that e-mail belongs to an account that is waiting to be set up"

    def test_pending_student_gets_a_fresh_link_by_email(self):
        user, old = self.new_student()
        # the cooldown starts when the first link is issued; pretend that was a while ago
        PasswordResetToken.objects.update(issued_at=timezone.now() - timedelta(minutes=5))
        mail.outbox.clear()

        res = self.request_link("aarav@school.test")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn(self.GENERIC, res.data["detail"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["aarav@school.test"])

        # the link in the e-mail is a different token and it works; the old one is dead
        new = mail.outbox[0].body.split("#token=", 1)[1].split()[0]
        self.assertNotEqual(new, old)
        self.assertEqual(self.validate(old).status_code, 400)
        self.assertEqual(self.complete(new).status_code, 200)

    def test_works_for_an_expired_link_and_is_case_insensitive(self):
        self.new_student()
        PasswordResetToken.objects.update(
            issued_at=timezone.now() - timedelta(days=3),
            expires_at=timezone.now() - timedelta(days=1),
        )
        mail.outbox.clear()
        self.request_link("AARAV@School.Test")
        self.assertEqual(len(mail.outbox), 1)
        new = mail.outbox[0].body.split("#token=", 1)[1].split()[0]
        self.assertEqual(self.validate(new).status_code, 200)

    def test_unknown_email_gets_the_same_answer_and_no_mail(self):
        mail.outbox.clear()
        res = self.request_link("nobody@school.test")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn(self.GENERIC, res.data["detail"])
        self.assertEqual(len(mail.outbox), 0)

    def test_already_activated_student_and_teachers_get_no_mail(self):
        _, raw = self.new_student()
        self.complete(raw)
        mail.outbox.clear()
        for email in ("aarav@school.test", "admin@school.test"):
            res = self.request_link(email)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertIn(self.GENERIC, res.data["detail"])
        self.assertEqual(len(mail.outbox), 0)

    def test_answer_is_identical_for_known_and_unknown_addresses(self):
        self.new_student()
        PasswordResetToken.objects.update(issued_at=timezone.now() - timedelta(minutes=5))
        known = self.request_link("aarav@school.test")
        unknown = self.request_link("ghost@school.test")
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.data, unknown.data)

    def test_only_one_email_per_minute(self):
        self.new_student()
        PasswordResetToken.objects.update(issued_at=timezone.now() - timedelta(minutes=5))
        mail.outbox.clear()
        self.request_link("aarav@school.test")
        self.request_link("aarav@school.test")
        self.request_link("aarav@school.test")
        self.assertEqual(len(mail.outbox), 1)

    def test_a_failed_send_keeps_the_students_existing_link(self):
        _, raw = self.new_student()
        PasswordResetToken.objects.update(issued_at=timezone.now() - timedelta(minutes=5))
        with mock.patch(
            "django.core.mail.message.EmailMessage.send", side_effect=OSError("smtp down")
        ):
            res = self.request_link("aarav@school.test")
        self.assertEqual(res.status_code, status.HTTP_200_OK)  # same answer, nothing leaks
        self.assertEqual(PasswordResetToken.objects.count(), 1)
        self.assertEqual(self.validate(raw).status_code, 200)

    def test_bad_email_format_is_a_400(self):
        res = self.request_link("not-an-email")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Admin "Resend link"
# =============================================================================
class ResendInviteTests(ActivationBase):
    def url(self, user):
        return f"{USERS_URL}{user.id}/resend-invite/"

    def test_resend_by_email_and_whatsapp(self):
        user, _ = self.new_student()
        mail.outbox.clear()
        res = self.admin_client.post(
            self.url(user), {"send_via": ["email", "whatsapp"], "phone": "+91 98765 43210"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertTrue(res.data["invitation"]["email_sent"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertTrue(res.data["invitation"]["whatsapp_url"].startswith("https://wa.me/"))

    @override_settings(ACTIVATION_DEFAULT_COUNTRY_CODE="91")
    def test_default_country_code_is_applied_to_a_bare_10_digit_number(self):
        user, _ = self.new_student()
        res = self.admin_client.post(
            self.url(user), {"send_via": ["whatsapp"], "phone": "98765 43210"}, format="json"
        )
        self.assertTrue(res.data["invitation"]["whatsapp_url"].startswith("https://wa.me/919876543210?"))

    def test_cannot_resend_to_a_student_who_already_activated(self):
        user, raw = self.new_student()
        self.complete(raw)
        res = self.admin_client.post(self.url(user), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_of(res)["code"], "already_activated")

    def test_cannot_resend_to_a_teacher(self):
        teacher = User.objects.create_user(
            email="t@school.test", password="Teacher-Pass-123", role="teacher", institution=self.school
        )
        res = self.admin_client.post(self.url(teacher), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_resend_to_a_deactivated_student(self):
        user, _ = self.new_student()
        user.is_active = False
        user.save(update_fields=["is_active"])
        res = self.admin_client.post(self.url(user), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_of_another_school_cannot_resend(self):
        user, _ = self.new_student()
        other = Institution.objects.create(name="Riverdale", slug="riverdale")
        outsider = User.objects.create_user(
            email="admin2@other.test", password="AdminPass-123!", role="admin", institution=other
        )
        client = APIClient()
        client.force_authenticate(outsider)
        res = client.post(self.url(user), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_teachers_and_anonymous_cannot_resend(self):
        user, _ = self.new_student()
        teacher = User.objects.create_user(
            email="t@school.test", password="Teacher-Pass-123", role="teacher", institution=self.school
        )
        client = APIClient()
        client.force_authenticate(teacher)
        self.assertEqual(client.post(self.url(user), {}, format="json").status_code, 403)
        self.assertIn(self.public.post(self.url(user), {}, format="json").status_code, (401, 403))


# =============================================================================
# Helpers + throttling
# =============================================================================
class PhoneAndMaskTests(ActivationBase):
    def test_normalise_whatsapp_number(self):
        cases = {
            "+91 98765 43210": "919876543210",
            "0091 98765 43210": "919876543210",
            "919876543210": "919876543210",
            "+1 (415) 555-0100": "14155550100",
            "919876543210": None,  # no "+" and no default country code: could be anyone's number
            "98765 43210": None,  # same: refuse rather than guess the country
            "": None,
            "abc": None,
            "+0123456789": None,
            "1234567": None,  # too short
            "+1234567890123456": None,  # too long (16 digits)
            "+٩١٩٨٧٦٥٤٣٢١٠": None,  # non-ASCII digits
            None: None,
        }
        for raw, expected in cases.items():
            self.assertEqual(normalise_whatsapp_number(raw), expected, raw)

    @override_settings(ACTIVATION_DEFAULT_COUNTRY_CODE="91")
    def test_default_country_code_only_for_ten_digit_national_numbers(self):
        self.assertEqual(normalise_whatsapp_number("9876543210"), "919876543210")
        self.assertEqual(normalise_whatsapp_number("09876543210"), "919876543210")
        self.assertEqual(normalise_whatsapp_number("919876543210"), "919876543210")
        self.assertEqual(normalise_whatsapp_number("+44 7911 123456"), "447911123456")

    def test_mask_email(self):
        self.assertEqual(mask_email("aarav@school.test"), "a****@school.test")
        self.assertEqual(mask_email("a@school.test"), "a*@school.test")
        self.assertEqual(mask_email("averyveryverylongname@x.test"), "a******@x.test")
        self.assertEqual(mask_email("nonsense"), "")


class ThrottleTests(ActivationBase):
    def test_new_link_requests_are_limited_per_ip(self):
        with mock.patch.object(ActivationRequestThrottle, "get_rate", return_value="2/hour"):
            codes = [self.request_link(f"x{i}@school.test").status_code for i in range(3)]
        self.assertEqual(codes, [200, 200, 429])

    def test_fails_open_when_the_cache_is_down(self):
        with mock.patch(
            "rest_framework.throttling.SimpleRateThrottle.allow_request",
            side_effect=ConnectionError("redis down"),
        ):
            res = self.request_link("x@school.test")
            _, raw = self.new_student()
            res2 = self.validate(raw)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
