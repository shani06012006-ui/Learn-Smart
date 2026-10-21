import re
from datetime import timedelta
from unittest import mock

from django.contrib.auth.hashers import check_password
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import PendingRegistration, User
from accounts.registration import MAX_ATTEMPTS, RegistrationThrottle

LOCMEM = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
PASSWORD = "Sunflower-Maths-42"


def error_of(response):
    return response.data["error"]


@override_settings(CACHES=LOCMEM)
class RegistrationTestBase(APITestCase):
    def setUp(self):
        cache.clear()
        self.register_url = reverse("auth-register")
        self.verify_url = reverse("auth-register-verify")
        self.resend_url = reverse("auth-register-resend")

    # -- helpers ---------------------------------------------------------
    def payload(self, **over):
        data = {
            "first_name": "Meera",
            "last_name": "Rao",
            "email": "meera@school.test",
            "role": "teacher",
            "password": PASSWORD,
            "password_confirm": PASSWORD,
        }
        data.update(over)
        return data

    def register(self, **over):
        return self.client.post(self.register_url, self.payload(**over), format="json")

    def last_code(self):
        return re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)

    def start(self, **over):
        """Register and return (email, token, code)."""
        res = self.register(**over)
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED, res.data)
        return res.data["email"], res.data["registration_token"], self.last_code()

    def verify(self, email, code, token):
        return self.client.post(
            self.verify_url,
            {"email": email, "code": code, "registration_token": token},
            format="json",
        )

    def resend(self, email, token):
        return self.client.post(
            self.resend_url, {"email": email, "registration_token": token}, format="json"
        )

    def age_last_send(self, email, seconds=120):
        PendingRegistration.objects.filter(email=email).update(
            last_sent_at=timezone.now() - timedelta(seconds=seconds)
        )


class RegisterTests(RegistrationTestBase):
    def test_sends_a_code_and_creates_no_account_yet(self):
        res = self.register()
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(res.data["email"], "meera@school.test")
        self.assertTrue(res.data["registration_token"])
        self.assertEqual(res.data["resend_after"], 60)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["meera@school.test"])
        self.assertRegex(mail.outbox[0].body, r"\b\d{6}\b")

        # The important bit: no real account until the e-mail is verified.
        self.assertFalse(User.objects.filter(email="meera@school.test").exists())

    def test_secrets_are_never_stored_in_plain_text(self):
        _email, token, code = self.start()
        pending = PendingRegistration.objects.get()
        self.assertNotEqual(pending.password_hash, PASSWORD)
        self.assertTrue(check_password(PASSWORD, pending.password_hash))
        self.assertNotIn(code, pending.code_hash)
        self.assertNotIn(token, pending.token_hash)

    def test_email_contains_no_user_supplied_text(self):
        self.register(first_name="<b>EvilName</b>", last_name="http://phish.example")
        body = mail.outbox[0].body
        html = mail.outbox[0].alternatives[0][0]
        for text in (body, html, mail.outbox[0].subject):
            self.assertNotIn("EvilName", text)
            self.assertNotIn("phish.example", text)

    def test_email_is_lowercased(self):
        res = self.register(email="Meera@School.TEST")
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(PendingRegistration.objects.filter(email="meera@school.test").exists())

    # -- validation ------------------------------------------------------
    def test_password_mismatch_is_a_field_error(self):
        res = self.register(password_confirm="Different-Password-9")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", error_of(res)["detail"])
        self.assertEqual(len(mail.outbox), 0)

    def test_weak_password_is_rejected(self):
        res = self.register(password="12345678", password_confirm="12345678")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", error_of(res)["detail"])

    def test_password_too_similar_to_email_is_rejected(self):
        res = self.register(password="meera@school.test", password_confirm="meera@school.test")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", error_of(res)["detail"])

    def test_missing_and_invalid_fields(self):
        res = self.client.post(self.register_url, {"email": "not-an-email"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        detail = error_of(res)["detail"]
        for field in ("first_name", "last_name", "email", "password", "password_confirm"):
            self.assertIn(field, detail)

    def test_existing_email_is_rejected_ignoring_case(self):
        User.objects.create_user(email="Meera@School.test", password="x", role=User.ROLE_TEACHER)
        res = self.register(email="meera@school.test")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", error_of(res)["detail"])
        self.assertEqual(len(mail.outbox), 0)

    def test_only_teacher_accounts_can_be_created(self):
        for role in ("admin", "student", "superuser"):
            res = self.register(role=role, email=f"{role}@school.test")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, role)
            self.assertIn("role", error_of(res)["detail"])
        self.assertEqual(PendingRegistration.objects.count(), 0)

    def test_role_may_be_omitted_or_blank(self):
        data = self.payload()
        del data["role"]
        self.assertEqual(
            self.client.post(self.register_url, data, format="json").status_code,
            status.HTTP_202_ACCEPTED,
        )
        self.assertEqual(self.register(role="", email="b@school.test").status_code, status.HTTP_202_ACCEPTED)

    # -- e-mail failure --------------------------------------------------
    def test_email_failure_is_a_503_and_leaves_nothing_behind(self):
        with mock.patch("accounts.registration.EmailMultiAlternatives.send", side_effect=OSError("smtp down")):
            res = self.register()
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(error_of(res)["code"], "email_failed")
        self.assertEqual(PendingRegistration.objects.count(), 0)

    # -- cooldown --------------------------------------------------------
    def test_registering_again_inside_the_cooldown_changes_nothing(self):
        self.start()
        res = self.register(password="Another-Pass-77", password_confirm="Another-Pass-77")
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(error_of(res)["code"], "code_recently_sent")
        self.assertGreater(error_of(res)["retry_after"], 0)
        # nobody can overwrite a sign-up in progress, and no second e-mail goes out
        self.assertEqual(len(mail.outbox), 1)
        self.assertTrue(check_password(PASSWORD, PendingRegistration.objects.get().password_hash))

    def test_registering_again_after_the_cooldown_starts_over(self):
        email, old_token, old_code = self.start()
        self.age_last_send(email)
        res = self.register(password="Another-Pass-77", password_confirm="Another-Pass-77")
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(len(mail.outbox), 2)
        # the first attempt's token no longer works
        self.assertEqual(self.verify(email, self.last_code(), old_token).status_code, 400)


class VerifyTests(RegistrationTestBase):
    def test_correct_code_creates_a_teacher_and_signs_in(self):
        email, token, code = self.start()
        res = self.verify(email, code, token)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertTrue(res.data["access"])
        self.assertTrue(res.data["refresh"])
        self.assertEqual(res.data["user"]["email"], "meera@school.test")
        self.assertEqual(res.data["user"]["role"], "teacher")

        user = User.objects.get(email="meera@school.test")
        self.assertEqual((user.first_name, user.last_name), ("Meera", "Rao"))
        self.assertEqual(user.role, User.ROLE_TEACHER)
        self.assertIsNone(user.institution)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(PendingRegistration.objects.count(), 0)

    def test_the_new_account_really_works(self):
        email, token, code = self.start()
        res = self.verify(email, code, token)

        # 1) the returned access token is accepted by a protected endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        self.assertEqual(self.client.get(reverse("class-list-create")).status_code, status.HTTP_200_OK)
        # ...and the new teacher can create a class without belonging to a school
        created = self.client.post(
            reverse("class-list-create"), {"name": "Maths 5", "subject": "Maths", "description": ""}, format="json"
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)

        # 2) the password they chose logs in through the normal login endpoint
        self.client.credentials()
        login = self.client.post(
            reverse("auth-login"), {"email": "meera@school.test", "password": PASSWORD}, format="json"
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_verify_accepts_the_email_in_any_case(self):
        email, token, code = self.start(email="Mixed@School.test")
        self.assertEqual(self.verify("MIXED@school.TEST", code, token).status_code, status.HTTP_201_CREATED)

    def test_wrong_codes_count_down_then_burn_the_signup(self):
        email, token, code = self.start()
        wrong = "000000" if code != "000000" else "111111"

        for expected_left in range(MAX_ATTEMPTS - 1, 0, -1):
            res = self.verify(email, wrong, token)
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(error_of(res)["code"], "wrong_code")
            self.assertEqual(error_of(res)["attempts_left"], expected_left)
            self.assertIn("code", error_of(res)["detail"])

        final = self.verify(email, wrong, token)
        self.assertEqual(error_of(final)["code"], "too_many_attempts")
        self.assertEqual(PendingRegistration.objects.count(), 0)

        # even the right code is useless now
        again = self.verify(email, code, token)
        self.assertEqual(error_of(again)["code"], "no_pending_registration")
        self.assertFalse(User.objects.filter(email=email).exists())

    def test_a_few_typos_do_not_stop_the_right_code(self):
        email, token, code = self.start()
        wrong = "000000" if code != "000000" else "111111"
        self.verify(email, wrong, token)
        self.verify(email, wrong, token)
        self.assertEqual(self.verify(email, code, token).status_code, status.HTTP_201_CREATED)

    def test_the_code_alone_is_not_enough_without_the_browsers_token(self):
        email, token, code = self.start()
        res = self.verify(email, code, "not-the-token")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(error_of(res)["code"], "no_pending_registration")
        self.assertFalse(User.objects.filter(email=email).exists())

    def test_strangers_cannot_burn_someone_elses_attempts(self):
        email, token, code = self.start()
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(MAX_ATTEMPTS * 2):
            self.verify(email, wrong, "attacker-guess")
        pending = PendingRegistration.objects.get()
        self.assertEqual(pending.attempts, 0)
        # and the genuine owner can still finish
        self.assertEqual(self.verify(email, code, token).status_code, status.HTTP_201_CREATED)

    def test_victim_cannot_be_tricked_into_completing_an_attackers_signup(self):
        """Attacker re-submits the victim's e-mail with the attacker's password."""
        # the attacker's submission (the victim's mailbox receives the code)
        victim = "victim@school.test"
        _e, attacker_token, _c = self.start(email=victim, password="Attacker-Pass-11", password_confirm="Attacker-Pass-11")
        emailed_code = self.last_code()
        # the victim innocently types the emailed code - but their browser has no token
        res = self.verify(victim, emailed_code, "victims-browser-has-no-token")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email=victim).exists())
        # the attacker holds the token but never sees the code
        guess = "000000" if emailed_code != "000000" else "111111"
        self.assertEqual(self.verify(victim, guess, attacker_token).status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_code(self):
        email, token, code = self.start()
        PendingRegistration.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        res = self.verify(email, code, token)
        self.assertEqual(error_of(res)["code"], "code_expired")
        self.assertEqual(PendingRegistration.objects.count(), 0)
        self.assertFalse(User.objects.filter(email=email).exists())

    def test_malformed_code_is_a_field_error(self):
        email, token, _code = self.start()
        res = self.verify(email, "12ab", token)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", error_of(res)["detail"])
        self.assertEqual(PendingRegistration.objects.get().attempts, 0)

    def test_cannot_verify_twice(self):
        email, token, code = self.start()
        self.assertEqual(self.verify(email, code, token).status_code, status.HTTP_201_CREATED)
        again = self.verify(email, code, token)
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(email=email).count(), 1)

    def test_account_created_elsewhere_in_the_meantime_wins(self):
        email, token, code = self.start()
        User.objects.create_user(email=email, password="x", role=User.ROLE_TEACHER)
        res = self.verify(email, code, token)
        self.assertEqual(error_of(res)["code"], "email_taken")
        self.assertEqual(User.objects.filter(email=email).count(), 1)
        self.assertEqual(PendingRegistration.objects.count(), 0)


class ResendTests(RegistrationTestBase):
    def test_too_soon(self):
        email, token, _code = self.start()
        res = self.resend(email, token)
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(error_of(res)["code"], "resend_too_soon")
        self.assertEqual(len(mail.outbox), 1)

    def test_new_code_replaces_the_old_one_and_resets_attempts(self):
        email, token, old_code = self.start()
        wrong = "000000" if old_code != "000000" else "111111"
        for _ in range(3):
            self.verify(email, wrong, token)
        self.assertEqual(PendingRegistration.objects.get().attempts, 3)

        self.age_last_send(email)
        res = self.resend(email, token)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(PendingRegistration.objects.get().attempts, 0)

        new_code = self.last_code()
        if new_code != old_code:
            self.assertEqual(self.verify(email, old_code, token).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.verify(email, new_code, token).status_code, status.HTTP_201_CREATED)

    def test_needs_the_right_token(self):
        email, _token, _code = self.start()
        self.age_last_send(email)
        res = self.resend(email, "wrong-token")
        self.assertEqual(error_of(res)["code"], "no_pending_registration")
        self.assertEqual(len(mail.outbox), 1)

    def test_unknown_signup(self):
        res = self.resend("nobody@school.test", "whatever")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)

    def test_email_failure_on_resend_is_a_503(self):
        email, token, _code = self.start()
        self.age_last_send(email)
        with mock.patch("accounts.registration.EmailMultiAlternatives.send", side_effect=OSError("down")):
            res = self.resend(email, token)
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class SecurityInteractionTests(RegistrationTestBase):
    def test_an_unverified_signup_cannot_be_hijacked_through_google(self):
        """Google login matches by e-mail, so a parked sign-up must not count as an account."""
        self.start(email="owner@gmail.com")
        claims = {"email": "owner@gmail.com", "email_verified": True, "given_name": "Real", "family_name": "Owner"}
        with mock.patch("accounts.views.verify_google_credential", return_value=claims):
            res = self.client.post(reverse("auth-google"), {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(error_of(res)["code"], "no_account")
        self.assertFalse(User.objects.filter(email="owner@gmail.com").exists())

    def test_a_signed_up_teacher_can_then_use_google(self):
        email, token, code = self.start(email="owner@gmail.com")
        self.verify(email, code, token)
        claims = {"email": "owner@gmail.com", "email_verified": True}
        with mock.patch("accounts.views.verify_google_credential", return_value=claims):
            res = self.client.post(reverse("auth-google"), {"credential": "tok"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class ThrottleTests(RegistrationTestBase):
    def test_per_ip_limit(self):
        with mock.patch.object(RegistrationThrottle, "get_rate", return_value="2/hour"):
            statuses = [self.client.post(self.register_url, {}, format="json").status_code for _ in range(3)]
        self.assertEqual(statuses, [400, 400, 429])

    def test_fails_open_when_the_cache_is_down(self):
        with mock.patch(
            "rest_framework.throttling.SimpleRateThrottle.allow_request",
            side_effect=ConnectionError("redis down"),
        ):
            res = self.register()
        self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
