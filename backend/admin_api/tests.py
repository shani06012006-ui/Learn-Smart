"""
Admin API tests.

Run with:
    pytest admin_api/tests.py -v

What's covered:
- Cross-institution isolation (the core security guarantee)
- Superuser bypass (the escape hatch)
- User creation by admin, and role restriction (admins can't create admins)
- Deactivation guardrails (self-deactivation blocked)
- Admin stats endpoint scoping
- Non-admin rejection
"""
import pytest
from rest_framework.test import APIClient

from accounts.models import User
from institutions.models import Institution


pytestmark = pytest.mark.django_db


# ----------------------------------------------------------------- helpers

@pytest.fixture
def northwood(db):
    return Institution.objects.create(name="Northwood", slug="northwood")


@pytest.fixture
def riverdale(db):
    return Institution.objects.create(name="Riverdale", slug="riverdale")


def make_user(email, role, institution=None, password="TestPass123!", is_superuser=False):
    u = User.objects.create_user(
        email=email,
        password=password,
        first_name=role.title(),
        last_name="User",
        role=User.ROLE_ADMIN if is_superuser else role,
        institution=institution,
    )
    if is_superuser:
        u.is_superuser = True
        u.is_staff = True
        u.save()
    return u


def auth_client(user):
    client = APIClient()
    # Simulate a logged-in user by force-authenticating. DRF accepts this
    # because IsInstitutionAdmin only reads request.user.
    client.force_authenticate(user=user)
    return client


# ----------------------------------------------------------------- isolation

def test_admin_sees_only_own_institution_users(northwood, riverdale):
    admin_a = make_user("admin.a@test.local", User.ROLE_ADMIN, northwood)
    make_user("teacher.a@test.local", User.ROLE_TEACHER, northwood)
    make_user("teacher.b@test.local", User.ROLE_TEACHER, riverdale)

    client = auth_client(admin_a)
    resp = client.get("/api/v1/admin/users/")
    assert resp.status_code == 200
    emails = {row["email"] for row in resp.json()["results"]}

    assert "admin.a@test.local" in emails
    assert "teacher.a@test.local" in emails
    assert "teacher.b@test.local" not in emails, "cross-institution leak"


def test_superuser_sees_all_institutions(northwood, riverdale):
    su = make_user("root@test.local", User.ROLE_ADMIN, None, is_superuser=True)
    make_user("teacher.a@test.local", User.ROLE_TEACHER, northwood)
    make_user("teacher.b@test.local", User.ROLE_TEACHER, riverdale)

    client = auth_client(su)
    resp = client.get("/api/v1/admin/users/")
    assert resp.status_code == 200
    emails = {row["email"] for row in resp.json()["results"]}
    assert "teacher.a@test.local" in emails
    assert "teacher.b@test.local" in emails


def test_institution_admin_without_institution_gets_403(northwood):
    orphan_admin = make_user("orphan@test.local", User.ROLE_ADMIN, None)
    client = auth_client(orphan_admin)
    resp = client.get("/api/v1/admin/users/")
    assert resp.status_code == 403


# ----------------------------------------------------------------- create

def test_admin_can_create_teacher(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin)

    resp = client.post(
        "/api/v1/admin/users/",
        {
            "email": "newteacher@test.local",
            "password": "NewPass123!",
            "first_name": "New",
            "last_name": "Teacher",
            "role": "teacher",
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert User.objects.filter(email="newteacher@test.local", role="teacher", institution=northwood).exists()


def test_admin_cannot_create_another_admin(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin)

    resp = client.post(
        "/api/v1/admin/users/",
        {
            "email": "sneakyadmin@test.local",
            "password": "NewPass123!",
            "role": "admin",  # not in the allowed choices
        },
        format="json",
    )
    assert resp.status_code == 400
    assert not User.objects.filter(email="sneakyadmin@test.local").exists()


def test_admin_cannot_create_user_in_other_institution(northwood, riverdale):
    """
    Even if the client sends institution_id, the server ignores it for
    non-superusers and uses the caller's institution.
    """
    admin_a = make_user("admin.a@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin_a)

    resp = client.post(
        "/api/v1/admin/users/",
        {
            "email": "sneaky@test.local",
            "password": "NewPass123!",
            "role": "student",
            "institution_id": str(riverdale.id),
        },
        format="json",
    )
    assert resp.status_code == 201
    created = User.objects.get(email="sneaky@test.local")
    assert created.institution_id == northwood.id, "institution_id from body was honoured â€” security bug"


# ----------------------------------------------------------------- deactivate

def test_admin_can_deactivate_another_user(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("teacher@test.local", User.ROLE_TEACHER, northwood)
    client = auth_client(admin)

    resp = client.post(
        f"/api/v1/admin/users/{teacher.id}/toggle-active/",
        {"is_active": False},
        format="json",
    )
    assert resp.status_code == 200
    teacher.refresh_from_db()
    assert teacher.is_active is False


def test_admin_cannot_deactivate_themselves(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin)

    resp = client.post(
        f"/api/v1/admin/users/{admin.id}/toggle-active/",
        {"is_active": False},
        format="json",
    )
    assert resp.status_code == 400
    admin.refresh_from_db()
    assert admin.is_active is True


# ----------------------------------------------------------------- stats

def test_stats_scoped_to_institution(northwood, riverdale):
    admin_a = make_user("admin.a@test.local", User.ROLE_ADMIN, northwood)
    make_user("t1@northwood.test", User.ROLE_TEACHER, northwood)
    make_user("s1@northwood.test", User.ROLE_STUDENT, northwood)
    make_user("t1@riverdale.test", User.ROLE_TEACHER, riverdale)
    make_user("s1@riverdale.test", User.ROLE_STUDENT, riverdale)

    client = auth_client(admin_a)
    resp = client.get("/api/v1/admin/stats/")
    assert resp.status_code == 200
    data = resp.json()
    # Northwood has: 1 admin + 1 teacher + 1 student = 3
    assert data["users_total"] == 3
    assert data["users_teachers"] == 1
    assert data["users_students"] == 1
    assert data["is_superuser_view"] is False


# ----------------------------------------------------------------- role gate

def test_non_admin_rejected(northwood):
    teacher = make_user("teacher@test.local", User.ROLE_TEACHER, northwood)
    client = auth_client(teacher)
    resp = client.get("/api/v1/admin/users/")
    assert resp.status_code == 403

# ---------------------------------------------------------------------------
# Course management tests
# ---------------------------------------------------------------------------

@pytest.fixture
def course_teacher(db, northwood):
    """A teacher in the Northwood institution."""
    return make_user(
        "teacher.nw@test.local",
        User.ROLE_TEACHER,
        northwood,
        password="TestPass123!",
    )


@pytest.fixture
def course_teacher_riverdale(db, riverdale):
    """A teacher in the Riverdale institution."""
    return make_user(
        "teacher.rd@test.local",
        User.ROLE_TEACHER,
        riverdale,
        password="TestPass123!",
    )


def test_admin_can_create_course_in_own_institution(northwood, course_teacher):
    admin = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin)

    resp = client.post(
        "/api/v1/admin/courses/",
        {
            "name": "Grade 10 Physics",
            "subject": "Physics",
            "description": "Mechanics and motion",
            "teacher_id": str(course_teacher.id),
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["name"] == "Grade 10 Physics"
    assert body["subject"] == "Physics"
    assert body["teacher"]["id"] == str(course_teacher.id)
    assert body["institution"]["slug"] == "northwood"
    assert body["is_archived"] is False


def test_admin_cannot_create_course_with_other_institution_teacher(
    northwood, riverdale, course_teacher_riverdale
):
    admin_nw = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin_nw)

    resp = client.post(
        "/api/v1/admin/courses/",
        {
            "name": "Cross-tenant test",
            "subject": "Physics",
            "teacher_id": str(course_teacher_riverdale.id),
        },
        format="json",
    )
    assert resp.status_code == 400


def test_admin_cannot_create_course_with_invalid_teacher_id(northwood):
    admin = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin)

    resp = client.post(
        "/api/v1/admin/courses/",
        {
            "name": "Bad teacher",
            "subject": "Physics",
            "teacher_id": "00000000-0000-0000-0000-000000000000",
        },
        format="json",
    )
    assert resp.status_code == 400


def test_admin_cannot_create_course_with_student_as_teacher(northwood):
    admin = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)
    student = make_user("student.nw@test.local", User.ROLE_STUDENT, northwood)
    client = auth_client(admin)

    resp = client.post(
        "/api/v1/admin/courses/",
        {
            "name": "Student as teacher",
            "subject": "Physics",
            "teacher_id": str(student.id),
        },
        format="json",
    )
    assert resp.status_code == 400


def test_admin_lists_only_own_institution_courses(northwood, riverdale, course_teacher, course_teacher_riverdale):
    admin_nw = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)

    from classes.models import ClassCourse
    ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Northwood Course", subject="Physics",
    )
    ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale,
        name="Riverdale Course", subject="Chemistry",
    )

    client = auth_client(admin_nw)
    resp = client.get("/api/v1/admin/courses/")
    assert resp.status_code == 200
    names = {row["name"] for row in resp.json()["results"]}
    assert "Northwood Course" in names
    assert "Riverdale Course" not in names


def test_admin_cannot_retrieve_course_from_other_institution(northwood, riverdale, course_teacher_riverdale):
    admin_nw = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)

    from classes.models import ClassCourse
    rd_course = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale,
        name="Riverdale Course", subject="Chemistry",
    )

    client = auth_client(admin_nw)
    resp = client.get(f"/api/v1/admin/courses/{rd_course.id}/")
    assert resp.status_code == 404


def test_admin_cannot_update_course_from_other_institution(northwood, riverdale, course_teacher_riverdale):
    admin_nw = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)

    from classes.models import ClassCourse
    rd_course = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale,
        name="Riverdale Course", subject="Chemistry",
    )

    client = auth_client(admin_nw)
    resp = client.patch(
        f"/api/v1/admin/courses/{rd_course.id}/",
        {"name": "Hijacked"},
        format="json",
    )
    assert resp.status_code == 404


def test_admin_can_update_own_course(northwood, course_teacher):
    admin = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)

    from classes.models import ClassCourse
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Old Name", subject="Physics",
    )

    client = auth_client(admin)
    resp = client.patch(
        f"/api/v1/admin/courses/{course.id}/",
        {"name": "New Name", "description": "Updated description"},
        format="json",
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"
    assert resp.json()["description"] == "Updated description"


def test_admin_can_archive_own_course(northwood, course_teacher):
    admin = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)

    from classes.models import ClassCourse
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="To Archive", subject="Physics",
    )

    client = auth_client(admin)
    resp = client.patch(
        f"/api/v1/admin/courses/{course.id}/",
        {"is_archived": True},
        format="json",
    )
    assert resp.status_code == 200
    assert resp.json()["is_archived"] is True


def test_admin_can_soft_delete_own_course(northwood, course_teacher):
    admin = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)

    from classes.models import ClassCourse
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="To Delete", subject="Physics",
    )

    client = auth_client(admin)
    resp = client.delete(f"/api/v1/admin/courses/{course.id}/")
    assert resp.status_code == 204

    # Not in default list
    list_resp = client.get("/api/v1/admin/courses/")
    names = {row["name"] for row in list_resp.json()["results"]}
    assert "To Delete" not in names


def test_non_admin_cannot_access_course_endpoints(northwood, course_teacher):
    """A teacher must not be able to hit the admin course API."""
    client = auth_client(course_teacher)
    resp = client.get("/api/v1/admin/courses/")
    assert resp.status_code == 403


def test_superuser_can_create_course_in_any_institution(northwood, course_teacher):
    su = make_user("root@test.local", User.ROLE_ADMIN, None, is_superuser=True)
    client = auth_client(su)

    resp = client.post(
        "/api/v1/admin/courses/",
        {
            "name": "Superuser Course",
            "subject": "Physics",
            "teacher_id": str(course_teacher.id),
            "institution_id": str(northwood.id),
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert resp.json()["institution"]["slug"] == "northwood"