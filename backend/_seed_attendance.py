import os, django, random
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from accounts.models import User, StudentAttendance
from classes.models import ClassCourse
from datetime import date, timedelta

teacher = User.objects.filter(email="shamna@gmail.com").first()
if not teacher:
    print("Shamna not found.")
    raise SystemExit

classes = ClassCourse.objects.filter(teacher=teacher)
print("Classes taught by Shamna:", classes.count())

if not classes.exists():
    print("No classes - cannot seed.")
    raise SystemExit

cls = classes.first()
print("Seeding for:", cls.name)

students = User.objects.filter(
    enrollments__class_course=cls,
    enrollments__status="active",
    role="student",
).distinct()
print("Enrolled students:", students.count())

if not students.exists():
    print("No students enrolled - cannot seed.")
    raise SystemExit

today = date.today()
created = 0
for days_back in range(120):
    d = today - timedelta(days=days_back)
    if d.weekday() >= 5:
        continue
    for s in students:
        status = random.choices(
            ["present", "absent", "late", "excused"],
            weights=[85, 8, 5, 2],
        )[0]
        _, was_created = StudentAttendance.objects.get_or_create(
            student=s,
            class_course=cls,
            date=d,
            defaults={"status": status},
        )
        if was_created:
            created += 1

print("Created", created, "attendance rows")
