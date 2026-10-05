from django.core.management.base import BaseCommand

from institutions.models import Grade, Institution


class Command(BaseCommand):
    help = "Seed Grade 1..Grade 12 for every institution (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--max-level",
            type=int,
            default=12,
            help="Highest grade level to seed (default 12).",
        )
        parser.add_argument(
            "--label-style",
            choices=["class", "grade", "year"],
            default="class",
            help="How to label grades: 'Class 1', 'Grade 1', 'Year 1'.",
        )

    def handle(self, *args, **options):
        max_level = options["max_level"]
        style = options["label_style"]
        prefix = {"class": "Class", "grade": "Grade", "year": "Year"}[style]

        total_created = 0
        for institution in Institution.objects.all():
            for level in range(1, max_level + 1):
                _, created = Grade.objects.get_or_create(
                    institution=institution,
                    level=level,
                    defaults={"name": f"{prefix} {level}", "is_active": True},
                )
                if created:
                    total_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {total_created} new grades across "
            f"{Institution.objects.count()} institution(s)."
        ))
