from unittest.mock import patch

from django.test import TestCase

from accounts.models import User
from institutions.models import Institution

from ..models import ClassCourse, StudentEnrollment
from ..services import add_student_to_class


class JoiningCodeTests(TestCase):
    def setUp(self):
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.teacher = User.objects.create_user(
            email="teacher@example.com", password="pass12345",
            first_name="A", last_name="B", role=User.ROLE_TEACHER,
            institution=self.institution,
        )
        self.class_course = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher,
            name="Grade 10 Physics", subject="Physics",
        )

    def test_generated_code_is_six_chars_and_unambiguous_alphabet(self):
        enrollment, _ = add_student_to_class(
            self.class_course, "student@example.com", "Rahul", "Sharma"
        )
        self.assertEqual(len(enrollment.joining_code), 6)
        for char in enrollment.joining_code:
            self.assertNotIn(char, "0O1I")  # excluded per JOINING_CODE_ALPHABET

    def test_code_is_unique_across_enrollments(self):
        add_student_to_class(self.class_course, "s1@example.com", "S", "One")
        second_class = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher,
            name="Grade 10 Chemistry", subject="Chemistry",
        )
        add_student_to_class(second_class, "s2@example.com", "S", "Two")

        codes = list(StudentEnrollment.objects.values_list("joining_code", flat=True))
        self.assertEqual(len(codes), len(set(codes)))

    def test_re_adding_same_student_is_idempotent(self):
        enrollment1, created1 = add_student_to_class(
            self.class_course, "student@example.com", "Rahul", "Sharma"
        )
        enrollment2, created2 = add_student_to_class(
            self.class_course, "student@example.com", "Rahul", "Sharma"
        )
        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(enrollment1.id, enrollment2.id)
        self.assertEqual(enrollment1.joining_code, enrollment2.joining_code)

    def test_new_student_account_created_with_unusable_password(self):
        enrollment, created = add_student_to_class(
            self.class_course, "newstudent@example.com", "New", "Student"
        )
        self.assertTrue(created)
        self.assertFalse(enrollment.student.has_usable_password())
        self.assertEqual(enrollment.student.role, User.ROLE_STUDENT)
        self.assertEqual(enrollment.student.institution_id, self.institution.id)

    def test_existing_user_email_reused_not_duplicated(self):
        existing = User.objects.create_user(
            email="existing@example.com", password="pass12345",
            first_name="Ex", last_name="Isting", role=User.ROLE_STUDENT,
        )
        enrollment, _ = add_student_to_class(
            self.class_course, "existing@example.com", "Ignored", "Name"
        )
        self.assertEqual(enrollment.student_id, existing.id)
        self.assertEqual(User.objects.filter(email="existing@example.com").count(), 1)

    @patch("core.utils.secrets.choice")
    def test_collision_retry_loop_gives_up_after_50_attempts(self, mock_choice):
        # Force every generated code to collide with an existing one.
        mock_choice.side_effect = lambda alphabet: "A"
        StudentEnrollment.objects.create(
            student=User.objects.create_user(
                email="blocker@example.com", password="x", role=User.ROLE_STUDENT,
                first_name="B", last_name="L",
            ),
            class_course=self.class_course,
            joining_code="AAAAAA",
        )
        with self.assertRaises(RuntimeError):
            add_student_to_class(self.class_course, "another@example.com", "A", "N")
