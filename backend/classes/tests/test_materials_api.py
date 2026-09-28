import io
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from institutions.models import Institution

from ..models import ClassCourse, Material, StudentEnrollment


def _pdf(name="test.pdf", size_bytes=1024):
    """Build a minimal fake PDF as a SimpleUploadedFile."""
    return SimpleUploadedFile(
        name,
        b"%PDF-1.4\n" + (b"x" * size_bytes),
        content_type="application/pdf",
    )


class MaterialUploadTests(APITestCase):
    """Teacher-side upload + validation flows."""

    def setUp(self):
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.other_institution = Institution.objects.create(
            name="Other School", slug="other-school"
        )
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
        self.foreign_teacher = User.objects.create_user(
            email="foreign@example.com", password="pass12345",
            first_name="Foreign", last_name="Teacher", role=User.ROLE_TEACHER,
            institution=self.other_institution,
        )
        self.student = User.objects.create_user(
            email="student@example.com", password="pass12345",
            first_name="Rahul", last_name="Sharma", role=User.ROLE_STUDENT,
            institution=self.institution,
        )
        self.unenrolled_student = User.objects.create_user(
            email="stranger@example.com", password="pass12345",
            first_name="Stranger", last_name="Student", role=User.ROLE_STUDENT,
            institution=self.institution,
        )

        self.cls = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher,
            name="Physics 101", subject="Physics",
        )
        self.other_cls = ClassCourse.objects.create(
            institution=self.institution, teacher=self.other_teacher,
            name="Chemistry 101", subject="Chemistry",
        )
        self.foreign_cls = ClassCourse.objects.create(
            institution=self.other_institution, teacher=self.foreign_teacher,
            name="Foreign Class", subject="Math",
        )

        StudentEnrollment.objects.create(
            student=self.student, class_course=self.cls,
            joining_code="PHY001",
            status=StudentEnrollment.STATUS_ACTIVE,
        )

    # --------------------------------------------------------------- upload

    def test_teacher_can_upload_for_own_class(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            reverse("class-materials", kwargs={"class_id": self.cls.id}),
            {"title": "Notes", "description": "Chapter 1", "file": _pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["title"], "Notes")
        self.assertEqual(response.data["file_name"], "test.pdf")
        self.assertIn("file_url", response.data)

        material = Material.objects.get(id=response.data["id"])
        self.assertEqual(material.class_course_id, self.cls.id)
        self.assertEqual(material.uploaded_by_id, self.teacher.id)
        self.assertGreater(material.file_size, 0)
        self.assertEqual(material.mime_type, "application/pdf")

    def test_teacher_cannot_upload_for_other_teachers_class(self):
        self.client.force_authenticate(self.other_teacher)
        response = self.client.post(
            reverse("class-materials", kwargs={"class_id": self.cls.id}),
            {"title": "Notes", "file": _pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Material.objects.count(), 0)

    def test_student_cannot_upload(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            reverse("class-materials", kwargs={"class_id": self.cls.id}),
            {"title": "Notes", "file": _pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Material.objects.count(), 0)

    def test_upload_rejects_disallowed_extension(self):
        self.client.force_authenticate(self.teacher)
        bad = SimpleUploadedFile("virus.exe", b"MZ\x90\x00", content_type="application/octet-stream")
        response = self.client.post(
            reverse("class-materials", kwargs={"class_id": self.cls.id}),
            {"title": "Suspicious", "file": bad},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data["error"]["detail"])
        self.assertEqual(Material.objects.count(), 0)

    def test_upload_rejects_oversize_file(self):
        # Temporarily shrink the cap so we don't hold 50 MB in memory.
        with mock.patch("classes.serializers.MAX_MATERIAL_FILE_SIZE", 100):
            self.client.force_authenticate(self.teacher)
            response = self.client.post(
                reverse("class-materials", kwargs={"class_id": self.cls.id}),
                {"title": "Big", "file": _pdf(size_bytes=500)},
                format="multipart",
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data["error"]["detail"])
        self.assertEqual(Material.objects.count(), 0)

    # --------------------------------------------------------------- list

    def test_teacher_lists_own_class_materials(self):
        Material.objects.create(
            class_course=self.cls, uploaded_by=self.teacher,
            title="Uploaded", file=_pdf(), file_name="x.pdf",
            file_size=100, mime_type="application/pdf",
        )
        self.client.force_authenticate(self.teacher)
        response = self.client.get(
            reverse("class-materials", kwargs={"class_id": self.cls.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Uploaded")

    def test_other_teacher_cannot_list_foreign_class_materials(self):
        self.client.force_authenticate(self.other_teacher)
        response = self.client.get(
            reverse("class-materials", kwargs={"class_id": self.cls.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cross_institution_teacher_gets_403(self):
        self.client.force_authenticate(self.foreign_teacher)
        response = self.client.get(
            reverse("class-materials", kwargs={"class_id": self.cls.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --------------------------------------------------------------- update

    def test_teacher_can_update_title_and_description(self):
        material = Material.objects.create(
            class_course=self.cls, uploaded_by=self.teacher,
            title="Old", description="Old desc",
            file=_pdf(), file_name="x.pdf",
            file_size=100, mime_type="application/pdf",
        )
        self.client.force_authenticate(self.teacher)
        response = self.client.patch(
            reverse("material-detail", kwargs={"material_id": material.id}),
            {"title": "New", "description": "New desc"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        material.refresh_from_db()
        self.assertEqual(material.title, "New")
        self.assertEqual(material.description, "New desc")

    def test_other_teacher_cannot_update_foreign_material(self):
        material = Material.objects.create(
            class_course=self.cls, uploaded_by=self.teacher,
            title="Mine", file=_pdf(), file_name="x.pdf",
            file_size=100, mime_type="application/pdf",
        )
        self.client.force_authenticate(self.other_teacher)
        response = self.client.patch(
            reverse("material-detail", kwargs={"material_id": material.id}),
            {"title": "Hijacked"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        material.refresh_from_db()
        self.assertEqual(material.title, "Mine")

    # --------------------------------------------------------------- delete

    def test_teacher_soft_delete(self):
        material = Material.objects.create(
            class_course=self.cls, uploaded_by=self.teacher,
            title="To delete", file=_pdf(), file_name="x.pdf",
            file_size=100, mime_type="application/pdf",
        )
        self.client.force_authenticate(self.teacher)
        response = self.client.delete(
            reverse("material-detail", kwargs={"material_id": material.id})
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Hidden from default manager
        self.assertFalse(Material.objects.filter(id=material.id).exists())
        # Still present via all_objects
        self.assertTrue(
            Material.all_objects.filter(id=material.id, is_deleted=True).exists()
        )

    def test_other_teacher_cannot_delete_foreign_material(self):
        material = Material.objects.create(
            class_course=self.cls, uploaded_by=self.teacher,
            title="Mine", file=_pdf(), file_name="x.pdf",
            file_size=100, mime_type="application/pdf",
        )
        self.client.force_authenticate(self.other_teacher)
        response = self.client.delete(
            reverse("material-detail", kwargs={"material_id": material.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            Material.all_objects.filter(id=material.id, is_deleted=True).exists()
        )


class StudentMaterialAccessTests(APITestCase):
    """Student-side read-only access."""

    def setUp(self):
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.teacher = User.objects.create_user(
            email="teacher@example.com", password="pass12345",
            first_name="Anita", last_name="Iyer", role=User.ROLE_TEACHER,
            institution=self.institution,
        )
        self.student = User.objects.create_user(
            email="student@example.com", password="pass12345",
            first_name="Rahul", last_name="Sharma", role=User.ROLE_STUDENT,
            institution=self.institution,
        )
        self.unenrolled = User.objects.create_user(
            email="stranger@example.com", password="pass12345",
            first_name="Stranger", last_name="Student", role=User.ROLE_STUDENT,
            institution=self.institution,
        )

        self.cls = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher,
            name="Physics", subject="Physics",
        )
        StudentEnrollment.objects.create(
            student=self.student, class_course=self.cls,
            joining_code="PHY001", status=StudentEnrollment.STATUS_ACTIVE,
        )
        self.material = Material.objects.create(
            class_course=self.cls, uploaded_by=self.teacher,
            title="Chapter 1", file=_pdf(), file_name="ch1.pdf",
            file_size=100, mime_type="application/pdf",
        )

    def test_student_can_list_enrolled_class_materials(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(
            reverse("class-materials", kwargs={"class_id": self.cls.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_student_cannot_list_non_enrolled_class(self):
        self.client.force_authenticate(self.unenrolled)
        response = self.client.get(
            reverse("class-materials", kwargs={"class_id": self.cls.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_can_retrieve_enrolled_material(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(
            reverse("material-detail", kwargs={"material_id": self.material.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Chapter 1")

    def test_unenrolled_student_cannot_retrieve(self):
        self.client.force_authenticate(self.unenrolled)
        response = self.client.get(
            reverse("material-detail", kwargs={"material_id": self.material.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MaterialAuthTests(APITestCase):
    """Unauthenticated access must be rejected."""

    def setUp(self):
        self.institution = Institution.objects.create(name="Test School", slug="test-school")
        self.teacher = User.objects.create_user(
            email="teacher@example.com", password="pass12345",
            role=User.ROLE_TEACHER, institution=self.institution,
        )
        self.cls = ClassCourse.objects.create(
            institution=self.institution, teacher=self.teacher,
            name="Physics", subject="Physics",
        )

    def test_unauthenticated_upload_returns_401(self):
        response = self.client.post(
            reverse("class-materials", kwargs={"class_id": self.cls.id}),
            {"title": "x", "file": _pdf()},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_list_returns_401(self):
        response = self.client.get(
            reverse("class-materials", kwargs={"class_id": self.cls.id})
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
