from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from institutions.models import Institution

from ..models import ClassCourse


class ClassCourseAPITests(APITestCase):
    def setUp(self):
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.teacher = User.objects.create_user(
            email="teacher@example.com", password="pass12345",
            first_name="Anita", last_name="Iyer", role=User.ROLE_TEACHER,
            institution=self.institution,
        )
        self.other_teacher = User.objects.create_user(
            email="other@example.com", password="pass12345",
            first_name="Other", last_name="Teacher", role=User.ROLE_TEACHER,
            institution=self.institution,
        )
        self.student = User.objects.create_user(
            email="student@example.com", password="pass12345",
            first_name="Rahul", last_name="Sharma", role=User.ROLE_STUDENT,
            institution=self.institution,
        )

    def test_teacher_can_create_class(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            reverse("class-list-create"),
            {"name": "Grade 10 Physics", "subject": "Physics", "description": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["teacher"]["email"], "teacher@example.com")

        cls = ClassCourse.objects.get(id=response.data["id"])
        self.assertEqual(cls.institution_id, self.institution.id)

    def test_student_cannot_create_class(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            reverse("class-list-create"),
            {"name": "Grade 10 Physics", "subject": "Physics"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_only_sees_own_classes_in_list(self):
        ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher, name="Mine", subject="Physics"
        )
        ClassCourse.objects.create(
            institution=self.institution, teacher=self.other_teacher, name="Not mine", subject="Chemistry"
        )
        self.client.force_authenticate(self.teacher)
        response = self.client.get(reverse("class-list-create"))
        names = [c["name"] for c in response.data["results"]]
        self.assertIn("Mine", names)
        self.assertNotIn("Not mine", names)

    def test_other_teacher_cannot_update_class_they_dont_own(self):
        cls = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher, name="Mine", subject="Physics"
        )
        self.client.force_authenticate(self.other_teacher)
        response = self.client.patch(
            reverse("class-detail", kwargs={"id": cls.id}), {"name": "Hijacked"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_soft_deletes_not_hard_deletes(self):
        cls = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher, name="Mine", subject="Physics"
        )
        self.client.force_authenticate(self.teacher)
        response = self.client.delete(reverse("class-detail", kwargs={"id": cls.id}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(ClassCourse.objects.filter(id=cls.id).exists())  # hidden from default manager
        self.assertTrue(ClassCourse.all_objects.filter(id=cls.id, is_deleted=True).exists())  # still in DB

    def test_unauthenticated_request_rejected(self):
        response = self.client.get(reverse("class-list-create"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
