"""
Seed two demo institutions with admins, teachers, and students.

Usage:
    python manage.py seed_demo

Idempotent â€” safe to run multiple times. Existing rows are updated, not
duplicated. Development/testing only; do not run against production.

Accounts created (all share the password defined in DEMO_PASSWORD):

    Institution "Northwood Academy" (slug: northwood)
      admin    admin@northwood.test
      teacher  teacher1@northwood.test
      student  student1@northwood.test

    Institution "Riverdale Institute" (slug: riverdale)
      admin    admin@riverdale.test
      teacher  teacher1@riverdale.test
      student  student1@riverdale.test

The two institutions share no data. Logging in as admin@northwood.test
should show only Northwood's users; admin@riverdale.test should show
only Riverdale's. That's the isolation invariant to verify.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from classes.models import ClassCourse, StudentEnrollment
from core.utils import generate_unique_code
from institutions.models import Institution


DEMO_PASSWORD = "DemoPass123!"


DEMO_DATA = [
    {
        "slug": "northwood",
        "name": "Northwood Academy",
        "admin_email": "admin@northwood.test",
        "admin_first": "Nora",
        "admin_last": "Northwood",
        "teacher_email": "teacher1@northwood.test",
        "teacher_first": "Tara",
        "teacher_last": "Northwood",
        "student_email": "student1@northwood.test",
        "student_first": "Sam",
        "student_last": "Northwood",
    },
    {
        "slug": "riverdale",
        "name": "Riverdale Institute",
        "admin_email": "admin@riverdale.test",
        "admin_first": "Rita",
        "admin_last": "Riverdale",
        "teacher_email": "teacher1@riverdale.test",
        "teacher_first": "Tom",
        "teacher_last": "Riverdale",
        "student_email": "student1@riverdale.test",
        "student_first": "Sara",
        "student_last": "Riverdale",
    },
]


class Command(BaseCommand):
    help = "Seed two demo institutions with admin, teacher, and student accounts."

    def _ensure_user(self, email, password, first, last, role, institution):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first,
                "last_name": last,
                "role": role,
                "institution": institution,
                "is_staff": role == User.ROLE_ADMIN,
            },
        )
        # Keep values in sync on subsequent runs.
        user.first_name = first
        user.last_name = last
        user.role = role
        user.institution = institution
        user.is_staff = role == User.ROLE_ADMIN
        user.set_password(password)
        user.save()
        return user

    @transaction.atomic
    def handle(self, *args, **options):
        for spec in DEMO_DATA:
            institution, _ = Institution.objects.get_or_create(
                slug=spec["slug"], defaults={"name": spec["name"]}
            )
            institution.name = spec["name"]
            institution.save()

            admin = self._ensure_user(
                spec["admin_email"], DEMO_PASSWORD,
                spec["admin_first"], spec["admin_last"],
                User.ROLE_ADMIN, institution,
            )
            teacher = self._ensure_user(
                spec["teacher_email"], DEMO_PASSWORD,
                spec["teacher_first"], spec["teacher_last"],
                User.ROLE_TEACHER, institution,
            )
            student = self._ensure_user(
                spec["student_email"], DEMO_PASSWORD,
                spec["student_first"], spec["student_last"],
                User.ROLE_STUDENT, institution,
            )

            # A demo class for the teacher, with the student actively enrolled.
            # Gives the admin stats endpoint something to count.
            course, _ = ClassCourse.objects.get_or_create(
                teacher=teacher,
                name=f"{institution.name} â€” Demo Class",
                defaults={
                    "subject": "Demo",
                    "institution": institution,
                },
            )
            course.institution = institution
            course.save()

            StudentEnrollment.objects.get_or_create(
                student=student,
                class_course=course,
                defaults={
                    "joining_code": generate_unique_code(StudentEnrollment, field_name="joining_code"),
                    "status": StudentEnrollment.STATUS_ACTIVE,
                },
            )

            self.stdout.write(self.style.SUCCESS(
                f"Seeded {institution.name}: admin={admin.email}, teacher={teacher.email}, student={student.email}"
            ))

        self.stdout.write(self.style.SUCCESS(
            f"\nAll demo accounts share the password: {DEMO_PASSWORD}"
        ))