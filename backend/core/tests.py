from django.test import TestCase

from accounts.models import User
from classes.models import ClassCourse
from institutions.models import Institution

from .utils import generate_unique_code


class SoftDeleteModelTests(TestCase):
    def setUp(self):
        institution = Institution.objects.create(name="Test School", slug="test-school")
        teacher = User.objects.create_user(
            email="t@example.com", password="x", first_name="T", last_name="E",
            role=User.ROLE_TEACHER, institution=institution,
        )
        self.cls = ClassCourse.objects.create(
            institution=institution, teacher=teacher, name="Physics", subject="Physics"
        )

    def test_soft_delete_hides_from_default_manager(self):
        self.cls.soft_delete()
        self.assertFalse(ClassCourse.objects.filter(id=self.cls.id).exists())
        self.assertTrue(ClassCourse.all_objects.filter(id=self.cls.id).exists())

    def test_direct_delete_is_disabled(self):
        with self.assertRaises(NotImplementedError):
            self.cls.delete()

    def test_restore_brings_it_back(self):
        self.cls.soft_delete()
        self.cls.restore()
        self.assertTrue(ClassCourse.objects.filter(id=self.cls.id).exists())

    def test_hard_delete_actually_removes_row(self):
        pk = self.cls.id
        self.cls.hard_delete()
        self.assertFalse(ClassCourse.all_objects.filter(id=pk).exists())


class GenerateUniqueCodeTests(TestCase):
    def test_respects_custom_length_and_alphabet(self):
        from classes.models import StudentEnrollment

        code = generate_unique_code(
            StudentEnrollment, field_name="joining_code", length=8, alphabet="AB"
        )
        self.assertEqual(len(code), 8)
        self.assertTrue(set(code) <= set("AB"))

    def test_default_length_and_alphabet_come_from_settings(self):
        from classes.models import StudentEnrollment

        code = generate_unique_code(StudentEnrollment, field_name="joining_code")
        self.assertEqual(len(code), 6)  # settings.JOINING_CODE_LENGTH
        self.assertFalse(set(code) & set("0O1I"))  # ambiguous chars excluded
