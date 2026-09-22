"""
Create (or update) an institution admin account.

Usage:
    python manage.py create_institution_admin \
        --email admin@school-a.local \
        --password StrongPass123 \
        --first-name "Anita" \
        --last-name "Iyer" \
        --institution-slug school-a

If the email already exists and has role='admin', updates the institution
and password. Otherwise creates a new admin.

Idempotent — safe to run twice.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import User
from institutions.models import Institution


class Command(BaseCommand):
    help = "Create or update an institution admin account."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--institution-slug", required=True)
        parser.add_argument("--first-name", default="")
        parser.add_argument("--last-name", default="")

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        password = options["password"]
        slug = options["institution_slug"].strip()

        try:
            institution = Institution.objects.get(slug=slug)
        except Institution.DoesNotExist:
            raise CommandError(f"Institution with slug '{slug}' does not exist.")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": options["first_name"],
                "last_name": options["last_name"],
                "role": User.ROLE_ADMIN,
                "institution": institution,
                "is_staff": True,
            },
        )

        if not created and user.role != User.ROLE_ADMIN:
            raise CommandError(
                f"User {email} exists but has role '{user.role}', not 'admin'. "
                "Refusing to overwrite. Create a different email or fix manually."
            )

        # Set password and institution on both create and update paths.
        user.set_password(password)
        user.institution = institution
        user.role = User.ROLE_ADMIN
        user.is_staff = True
        user.first_name = options["first_name"] or user.first_name
        user.last_name = options["last_name"] or user.last_name
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} admin {email} in institution {institution.slug} ({institution.name})."
            )
        )