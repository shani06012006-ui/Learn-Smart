from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from institutions.models import Institution

from ..models import ClassCourse, StudentEnrollment
from ..services import add_student_to_class


class ClassStudentsAPITests(APITestCase):
    def setUp(self):
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.teacher = User.objects.create_user(
            email="teacher@example.com", password="pass12345",
            first_name="Anita", last_name="Iyer", role=User.ROLE_TEACHER,
            institution=self.institution,
        )
        self.class_course = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher,
            name="Grade 10 Physics", subject="Physics",
        )

    def test_teacher_can_add_student_and_receives_joining_code(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            reverse("class-students", kwargs={"class_id": self.class_course.id}),
            {"email": "rahul@example.com", "first_name": "Rahul", "last_name": "Sharma"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["joining_code"]), 6)
        self.assertEqual(response.data["status"], "pending")

    def test_student_cannot_add_students(self):
        student = User.objects.create_user(
            email="s@example.com", password="pass12345",
            first_name="S", last_name="One", role=User.ROLE_STUDENT,
        )
        self.client.force_authenticate(student)
        response = self.client.post(
            reverse("class-students", kwargs={"class_id": self.class_course.id}),
            {"email": "new@example.com", "first_name": "N", "last_name": "New"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_can_list_roster(self):
        add_student_to_class(self.class_course, "a@example.com", "A", "One")
        add_student_to_class(self.class_course, "b@example.com", "B", "Two")

        self.client.force_authenticate(self.teacher)
        response = self.client.get(
            reverse("class-students", kwargs={"class_id": self.class_course.id})
        )
        self.assertEqual(len(response.data), 2)

    def test_teacher_can_block_a_student(self):
        enrollment, _ = add_student_to_class(self.class_course, "a@example.com", "A", "One")

        self.client.force_authenticate(self.teacher)
        response = self.client.patch(
            reverse("class-student-detail", kwargs={
                "class_id": self.class_course.id, "enrollment_id": enrollment.id
            }),
            {"status": "blocked"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, StudentEnrollment.STATUS_BLOCKED)

    def test_non_owning_teacher_cannot_manage_roster(self):
        other_teacher = User.objects.create_user(
            email="other@example.com", password="pass12345",
            first_name="O", last_name="T", role=User.ROLE_TEACHER,
        )
        self.client.force_authenticate(other_teacher)
        response = self.client.get(
            reverse("class-students", kwargs={"class_id": self.class_course.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class JoinClassAPITests(APITestCase):
    def setUp(self):
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.teacher = User.objects.create_user(
            email="teacher@example.com", password="pass12345",
            first_name="Anita", last_name="Iyer", role=User.ROLE_TEACHER,
            institution=self.institution,
        )
        self.class_course = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher,
            name="Grade 10 Physics", subject="Physics",
        )
        self.enrollment, _ = add_student_to_class(
            self.class_course, "rahul@example.com", "Rahul", "Sharma"
        )

    def test_student_can_join_with_valid_code(self):
        self.client.force_authenticate(self.enrollment.student)
        response = self.client.post(
            reverse("enrollment-join"), {"joining_code": self.enrollment.joining_code}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "active")
        self.assertEqual(response.data["class_course"]["name"], "Grade 10 Physics")

        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, StudentEnrollment.STATUS_ACTIVE)
        self.assertIsNotNone(self.enrollment.joined_at)

    def test_invalid_code_returns_404(self):
        self.client.force_authenticate(self.enrollment.student)
        response = self.client.post(reverse("enrollment-join"), {"joining_code": "ZZZZZZ"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_code_cannot_be_redeemed_by_a_different_student(self):
        impostor = User.objects.create_user(
            email="impostor@example.com", password="pass12345",
            first_name="I", last_name="M", role=User.ROLE_STUDENT,
        )
        self.client.force_authenticate(impostor)
        response = self.client.post(
            reverse("enrollment-join"), {"joining_code": self.enrollment.joining_code}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_blocked_student_cannot_rejoin(self):
        self.enrollment.status = StudentEnrollment.STATUS_BLOCKED
        self.enrollment.save(update_fields=["status"])

        self.client.force_authenticate(self.enrollment.student)
        response = self.client.post(
            reverse("enrollment-join"), {"joining_code": self.enrollment.joining_code}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_use_join_endpoint(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            reverse("enrollment-join"), {"joining_code": self.enrollment.joining_code}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
