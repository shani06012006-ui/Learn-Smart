import hashlib
import uuid
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import RefreshToken, User
from classes.models import ClassCourse, StudentEnrollment
from core.models import AuditLog
from institutions.models import Institution


pytestmark = pytest.mark.django_db

# ----------------------------------------------------------------- fixtures

@pytest.fixture
def northwood(db):
    return Institution.objects.create(name="Northwood", slug="northwood")


@pytest.fixture
def riverdale(db):
    return Institution.objects.create(name="Riverdale", slug="riverdale")


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


# ----------------------------------------------------------------- helpers


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
    client.force_authenticate(user=user)
    return client


def _make_session(user, *, revoked=False, expired=False, label="Test Device"):
    """Helper: build a RefreshToken row with sensible defaults."""
    now = timezone.now()
    raw = f"{user.id}-{label}-{uuid.uuid4()}"
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return RefreshToken.objects.create(
        user=user,
        token_hash=token_hash,
        family_id=user.id,
        expires_at=now - timedelta(hours=1) if expired else now + timedelta(days=7),
        revoked_at=now if revoked else None,
        revoked_reason="admin_revoked" if revoked else "",
        device_label=label,
        ip_address="127.0.0.1",
        user_agent="pytest/1.0",
    )


# ----------------------------------------------------------------- users: isolation


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


# ----------------------------------------------------------------- users: create


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
            "role": "admin",
        },
        format="json",
    )
    assert resp.status_code == 400
    assert not User.objects.filter(email="sneakyadmin@test.local").exists()


def test_admin_cannot_create_user_in_other_institution(northwood, riverdale):
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
    assert created.institution_id == northwood.id, "institution_id from body was honoured — security bug"


# ----------------------------------------------------------------- users: deactivate


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


# ----------------------------------------------------------------- user classes / enrollments


def test_teacher_classes_returns_own_classes(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("teacher@test.local", User.ROLE_TEACHER, northwood)

    ClassCourse.objects.create(
        institution=northwood,
        teacher=teacher,
        name="Physics 101",
        subject="Physics",
    )
    ClassCourse.objects.create(
        institution=northwood,
        teacher=teacher,
        name="Physics 102",
        subject="Physics",
        is_archived=True,
    )

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/users/{teacher.id}/classes/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 2
    names = {row["name"] for row in body["results"]}
    assert names == {"Physics 101", "Physics 102"}


def test_classes_endpoint_400_for_non_teacher(northwood):
    """Calling /classes/ on a student returns 400."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student = make_user("student@test.local", User.ROLE_STUDENT, northwood)

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/users/{student.id}/classes/")
    assert resp.status_code == 400
    assert "not a teacher" in resp.json()["error"]["detail"]


def test_classes_endpoint_404_for_other_institution(northwood, riverdale):
    """Cross-institution access returns 404 (not 403)."""
    admin_a = make_user("admin.a@test.local", User.ROLE_ADMIN, northwood)
    teacher_b = make_user("teacher.b@test.local", User.ROLE_TEACHER, riverdale)

    client = auth_client(admin_a)
    resp = client.get(f"/api/v1/admin/users/{teacher_b.id}/classes/")
    assert resp.status_code == 404


def test_student_enrollments_returns_own_enrollments(northwood):
    """An institution admin can list a student's enrollments."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("teacher@test.local", User.ROLE_TEACHER, northwood)
    student = make_user("student@test.local", User.ROLE_STUDENT, northwood)

    course = ClassCourse.objects.create(
        institution=northwood,
        teacher=teacher,
        name="Physics 101",
        subject="Physics",
    )
    StudentEnrollment.objects.create(
        student=student,
        class_course=course,
        joining_code="ABC123",
        status=StudentEnrollment.STATUS_ACTIVE,
    )

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/users/{student.id}/enrollments/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    row = body["results"][0]
    assert row["status"] == "active"
    assert row["class_course"]["name"] == "Physics 101"
    assert row["class_course"]["teacher"]["email"] == "teacher@test.local"


def test_enrollments_endpoint_400_for_non_student(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("teacher@test.local", User.ROLE_TEACHER, northwood)

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/users/{teacher.id}/enrollments/")
    assert resp.status_code == 400
    assert "not a student" in resp.json()["error"]["detail"]


def test_enrollments_endpoint_404_for_other_institution(northwood, riverdale):
    admin_a = make_user("admin.a@test.local", User.ROLE_ADMIN, northwood)
    student_b = make_user("student.b@test.local", User.ROLE_STUDENT, riverdale)

    client = auth_client(admin_a)
    resp = client.get(f"/api/v1/admin/users/{student_b.id}/enrollments/")
    assert resp.status_code == 404


def test_classes_empty_for_teacher_with_no_classes(northwood):
    """Teacher with no classes returns empty results."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("teacher@test.local", User.ROLE_TEACHER, northwood)

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/users/{teacher.id}/classes/")
    assert resp.status_code == 200
    assert resp.json() == {"results": [], "count": 0}


def test_enrollments_empty_for_student_with_no_enrollments(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student = make_user("student@test.local", User.ROLE_STUDENT, northwood)

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/users/{student.id}/enrollments/")
    assert resp.status_code == 200
    assert resp.json() == {"results": [], "count": 0}


# ----------------------------------------------------------------- course management


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

    rd_course = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale,
        name="Riverdale Course", subject="Chemistry",
    )

    client = auth_client(admin_nw)
    resp = client.get(f"/api/v1/admin/courses/{rd_course.id}/")
    assert resp.status_code == 404


def test_admin_cannot_update_course_from_other_institution(northwood, riverdale, course_teacher_riverdale):
    admin_nw = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)

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

    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="To Delete", subject="Physics",
    )

    client = auth_client(admin)
    resp = client.delete(f"/api/v1/admin/courses/{course.id}/")
    assert resp.status_code == 204

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


# ----------------------------------------------------------------- course students


def test_course_students_returns_enrolled_students(northwood, course_teacher):
    """An institution admin can list students enrolled in a course."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student_a = make_user("a@test.local", User.ROLE_STUDENT, northwood)
    student_b = make_user("b@test.local", User.ROLE_STUDENT, northwood)

    course = ClassCourse.objects.create(
        institution=northwood,
        teacher=course_teacher,
        name="Physics 101",
        subject="Physics",
    )
    StudentEnrollment.objects.create(
        student=student_a,
        class_course=course,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )
    StudentEnrollment.objects.create(
        student=student_b,
        class_course=course,
        joining_code="BBB222",
        status=StudentEnrollment.STATUS_BLOCKED,
    )

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/courses/{course.id}/students/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 2
    emails = {row["student"]["email"] for row in body["results"]}
    assert emails == {"a@test.local", "b@test.local"}
    statuses = {row["student"]["email"]: row["status"] for row in body["results"]}
    assert statuses["a@test.local"] == "active"
    assert statuses["b@test.local"] == "blocked"


def test_course_students_empty_for_course_with_no_enrollments(northwood, course_teacher):
    """Course with no enrollments returns empty results."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course = ClassCourse.objects.create(
        institution=northwood,
        teacher=course_teacher,
        name="Physics 101",
        subject="Physics",
    )

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/courses/{course.id}/students/")
    assert resp.status_code == 200
    assert resp.json() == {"results": [], "count": 0}


def test_course_students_404_for_other_institution(northwood, riverdale, course_teacher_riverdale):
    """Cross-institution access returns 404 (not 403)."""
    admin_a = make_user("admin.a@test.local", User.ROLE_ADMIN, northwood)
    course_b = ClassCourse.objects.create(
        institution=riverdale,
        teacher=course_teacher_riverdale,
        name="Riverdale Physics",
        subject="Physics",
    )

    client = auth_client(admin_a)
    resp = client.get(f"/api/v1/admin/courses/{course_b.id}/students/")
    assert resp.status_code == 404


def test_course_students_requires_authentication(northwood, course_teacher):
    """Unauthenticated request is rejected."""
    course = ClassCourse.objects.create(
        institution=northwood,
        teacher=course_teacher,
        name="Physics 101",
        subject="Physics",
    )

    client = APIClient()
    resp = client.get(f"/api/v1/admin/courses/{course.id}/students/")
    assert resp.status_code in (401, 403)


# ----------------------------------------------------------------- audit log


def test_audit_list_scoped_to_institution(northwood, riverdale):
    """Institution admin sees only their institution's audit rows."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    other_admin = make_user("other@test.local", User.ROLE_ADMIN, riverdale)

    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="user.created", resource_type="user",
    )
    AuditLog.objects.create(
        actor=other_admin, actor_type="user", institution=riverdale,
        action="user.created", resource_type="user",
    )

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/audit/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["action"] == "user.created"


def test_audit_list_superuser_sees_all(northwood, riverdale):
    su = make_user("root@test.local", User.ROLE_ADMIN, None, is_superuser=True)
    admin_a = make_user("a@test.local", User.ROLE_ADMIN, northwood)
    admin_b = make_user("b@test.local", User.ROLE_ADMIN, riverdale)

    AuditLog.objects.create(
        actor=admin_a, actor_type="user", institution=northwood,
        action="user.created",
    )
    AuditLog.objects.create(
        actor=admin_b, actor_type="user", institution=riverdale,
        action="user.created",
    )

    client = auth_client(su)
    resp = client.get("/api/v1/admin/audit/")
    assert resp.status_code == 200
    assert resp.json()["count"] == 2


def test_audit_list_filter_by_action(northwood):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)

    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="user.created",
    )
    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="course.created",
    )

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/audit/?action=course.created")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["action"] == "course.created"


def test_audit_list_filter_by_search(northwood):
    """?q= matches against action / resource_type."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)

    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="user.created", resource_type="user",
    )
    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="course.created", resource_type="course",
    )

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/audit/?q=course")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["resource_type"] == "course"


def test_audit_actions_endpoint_returns_distinct(northwood):
    """GET /audit/actions/ returns distinct action codes for the caller."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)

    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="user.created",
    )
    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="user.created",
    )
    AuditLog.objects.create(
        actor=admin, actor_type="user", institution=northwood,
        action="course.created",
    )

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/audit/actions/")
    assert resp.status_code == 200
    actions = resp.json()["results"]
    assert sorted(actions) == ["course.created", "user.created"]


def test_audit_list_requires_authentication(northwood):
    """Unauthenticated request is rejected."""
    client = APIClient()
    resp = client.get("/api/v1/admin/audit/")
    assert resp.status_code in (401, 403)


# ----------------------------------------------------------------- sessions


def test_sessions_list_scoped_to_institution(northwood, riverdale):
    """Institution admin sees only sessions for users in their institution."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher_a = make_user("ta@test.local", User.ROLE_TEACHER, northwood)
    teacher_b = make_user("tb@test.local", User.ROLE_TEACHER, riverdale)

    _make_session(teacher_a)
    _make_session(teacher_b)

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/sessions/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["user"]["email"] == "ta@test.local"


def test_sessions_list_superuser_sees_all(northwood, riverdale):
    """Superuser sees sessions across every institution."""
    su = make_user("root@test.local", User.ROLE_ADMIN, None, is_superuser=True)
    teacher_a = make_user("ta@test.local", User.ROLE_TEACHER, northwood)
    teacher_b = make_user("tb@test.local", User.ROLE_TEACHER, riverdale)

    _make_session(teacher_a)
    _make_session(teacher_b)

    client = auth_client(su)
    resp = client.get("/api/v1/admin/sessions/")
    assert resp.status_code == 200
    assert resp.json()["count"] == 2


def test_sessions_filter_by_status(northwood):
    """?status=active|revoked|expired narrows the list."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("t@test.local", User.ROLE_TEACHER, northwood)

    _make_session(teacher, label="Active")
    _make_session(teacher, revoked=True, label="Revoked")
    _make_session(teacher, expired=True, label="Expired")

    client = auth_client(admin)

    active = client.get("/api/v1/admin/sessions/?status=active").json()
    assert active["count"] == 1
    assert active["results"][0]["status"] == "active"

    revoked = client.get("/api/v1/admin/sessions/?status=revoked").json()
    assert revoked["count"] == 1
    assert revoked["results"][0]["status"] == "revoked"

    expired = client.get("/api/v1/admin/sessions/?status=expired").json()
    assert expired["count"] == 1
    assert expired["results"][0]["status"] == "expired"


def test_sessions_never_expose_token_hash(northwood):
    """The serializer must not leak token_hash."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("t@test.local", User.ROLE_TEACHER, northwood)
    _make_session(teacher)

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/sessions/")
    assert resp.status_code == 200
    row = resp.json()["results"][0]
    assert "token_hash" not in row


def test_session_revoke_sets_revoked_at(northwood):
    """POST /revoke/ marks the session revoked and returns the updated row."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("t@test.local", User.ROLE_TEACHER, northwood)
    session = _make_session(teacher, label="ToRevoke")

    client = auth_client(admin)
    resp = client.post(f"/api/v1/admin/sessions/{session.id}/revoke/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "revoked"
    assert body["revoked_reason"] == "admin_revoked"

    session.refresh_from_db()
    assert session.revoked_at is not None
    assert session.revoked_reason == "admin_revoked"


def test_session_revoke_404_for_other_institution(northwood, riverdale):
    """Cross-institution revoke returns 404 (not 403)."""
    admin_a = make_user("admin.a@test.local", User.ROLE_ADMIN, northwood)
    teacher_b = make_user("tb@test.local", User.ROLE_TEACHER, riverdale)
    session_b = _make_session(teacher_b)

    client = auth_client(admin_a)
    resp = client.post(f"/api/v1/admin/sessions/{session_b.id}/revoke/")
    assert resp.status_code == 404


def test_session_revoke_idempotent(northwood):
    """Revoking an already-revoked session returns 200 with same row."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = make_user("t@test.local", User.ROLE_TEACHER, northwood)
    session = _make_session(teacher, revoked=True, label="AlreadyRevoked")

    client = auth_client(admin)
    resp = client.post(f"/api/v1/admin/sessions/{session.id}/revoke/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "revoked"


# ----------------------------------------------------------------- enrollments


def test_enrollments_list_scoped_to_institution(northwood, riverdale, course_teacher, course_teacher_riverdale):
    """Institution admin sees only enrollments for classes in their institution."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student_a = make_user("sa@test.local", User.ROLE_STUDENT, northwood)
    student_b = make_user("sb@test.local", User.ROLE_STUDENT, riverdale)

    course_a = ClassCourse.objects.create(
        institution=northwood,
        teacher=course_teacher,
        name="Physics A",
        subject="Physics",
    )
    course_b = ClassCourse.objects.create(
        institution=riverdale,
        teacher=course_teacher_riverdale,
        name="Physics B",
        subject="Physics",
    )

    StudentEnrollment.objects.create(
        student=student_a,
        class_course=course_a,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )
    StudentEnrollment.objects.create(
        student=student_b,
        class_course=course_b,
        joining_code="BBB222",
        status=StudentEnrollment.STATUS_ACTIVE,
    )

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/enrollments/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["student"]["email"] == "sa@test.local"
    assert body["results"][0]["class_course"]["name"] == "Physics A"


def test_enrollments_list_superuser_sees_all(northwood, riverdale, course_teacher, course_teacher_riverdale):
    su = make_user("root@test.local", User.ROLE_ADMIN, None, is_superuser=True)
    student_a = make_user("sa@test.local", User.ROLE_STUDENT, northwood)
    student_b = make_user("sb@test.local", User.ROLE_STUDENT, riverdale)

    course_a = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="A", subject="X"
    )
    course_b = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale, name="B", subject="X"
    )
    StudentEnrollment.objects.create(
        student=student_a, class_course=course_a,
        joining_code="AAA111", status=StudentEnrollment.STATUS_ACTIVE,
    )
    StudentEnrollment.objects.create(
        student=student_b, class_course=course_b,
        joining_code="BBB222", status=StudentEnrollment.STATUS_ACTIVE,
    )

    client = auth_client(su)
    resp = client.get("/api/v1/admin/enrollments/")
    assert resp.status_code == 200
    assert resp.json()["count"] == 2


def test_enrollments_filter_by_status(northwood, course_teacher):
    """?status= narrows the list."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student_a = make_user("sa@test.local", User.ROLE_STUDENT, northwood)
    student_b = make_user("sb@test.local", User.ROLE_STUDENT, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="P", subject="Physics"
    )
    StudentEnrollment.objects.create(
        student=student_a, class_course=course,
        joining_code="AAA111", status=StudentEnrollment.STATUS_ACTIVE,
    )
    StudentEnrollment.objects.create(
        student=student_b, class_course=course,
        joining_code="BBB222", status=StudentEnrollment.STATUS_BLOCKED,
    )

    client = auth_client(admin)

    active = client.get("/api/v1/admin/enrollments/?status=active").json()
    assert active["count"] == 1
    assert active["results"][0]["status"] == "active"

    blocked = client.get("/api/v1/admin/enrollments/?status=blocked").json()
    assert blocked["count"] == 1
    assert blocked["results"][0]["status"] == "blocked"


def test_enrollments_filter_by_class(northwood, course_teacher):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)

    course_a = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="A", subject="X"
    )
    course_b = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="B", subject="Y"
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course_a,
        joining_code="AAA111", status=StudentEnrollment.STATUS_ACTIVE,
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course_b,
        joining_code="BBB222", status=StudentEnrollment.STATUS_ACTIVE,
    )

    client = auth_client(admin)
    resp = client.get(f"/api/v1/admin/enrollments/?class_id={course_a.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["class_course"]["id"] == str(course_a.id)


def test_enrollments_search_by_student_or_class(northwood, course_teacher):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student = make_user("alice@test.local", User.ROLE_STUDENT, northwood)

    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="Physics 101", subject="Physics"
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course,
        joining_code="AAA111", status=StudentEnrollment.STATUS_ACTIVE,
    )

    client = auth_client(admin)

    by_email = client.get("/api/v1/admin/enrollments/?q=alice").json()
    assert by_email["count"] == 1

    by_class = client.get("/api/v1/admin/enrollments/?q=Physics").json()
    assert by_class["count"] == 1

    no_match = client.get("/api/v1/admin/enrollments/?q=xyz123").json()
    assert no_match["count"] == 0


# ----------------------------------------------------------------- attendance


def _make_teacher_attendance(teacher, *, date=None, status="present"):
    """Helper: build a TeacherAttendance row directly."""
    from accounts.models import TeacherAttendance
    from django.utils import timezone

    now = timezone.now()
    return TeacherAttendance.objects.create(
        teacher=teacher,
        institution=teacher.institution,
        date=date or timezone.localdate(),
        first_seen_at=now,
        last_seen_at=now,
        status=status,
        duration_seconds=0,
    )


def _make_student_attendance(student, course, *, date=None, status="present"):
    """Helper: build a StudentAttendance row directly."""
    from accounts.models import StudentAttendance
    from django.utils import timezone

    now = timezone.now()
    return StudentAttendance.objects.create(
        student=student,
        class_course=course,
        institution=course.institution or student.institution,
        date=date or timezone.localdate(),
        joined_at=now,
        status=status,
        duration_seconds=0,
        source=StudentAttendance.SOURCE_AUTO,
    )


def test_teacher_attendance_service_creates_row(northwood):
    """touch_teacher_attendance creates a row on first call."""
    from accounts.models import TeacherAttendance
    from accounts.services import touch_teacher_attendance

    teacher = make_user("t@test.local", User.ROLE_TEACHER, northwood)
    assert TeacherAttendance.objects.filter(teacher=teacher).count() == 0

    touch_teacher_attendance(teacher.id)

    assert TeacherAttendance.objects.filter(teacher=teacher).count() == 1
    row = TeacherAttendance.objects.get(teacher=teacher)
    assert row.status == TeacherAttendance.STATUS_PRESENT
    assert row.institution == northwood


def test_teacher_attendance_service_is_idempotent(northwood):
    """Second call updates the same row, doesn't create a new one."""
    from accounts.models import TeacherAttendance
    from accounts.services import touch_teacher_attendance

    teacher = make_user("t@test.local", User.ROLE_TEACHER, northwood)
    touch_teacher_attendance(teacher.id)
    touch_teacher_attendance(teacher.id)
    touch_teacher_attendance(teacher.id)

    assert TeacherAttendance.objects.filter(teacher=teacher).count() == 1


def test_teacher_attendance_ignores_non_teachers(northwood):
    """touch_teacher_attendance does nothing for a student."""
    from accounts.models import TeacherAttendance
    from accounts.services import touch_teacher_attendance

    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    touch_teacher_attendance(student.id)

    assert TeacherAttendance.objects.count() == 0


def test_student_attendance_service_creates_for_active_enrollments(
    northwood, course_teacher
):
    """touch_student_attendance creates a row per active enrollment."""
    from accounts.models import StudentAttendance
    from accounts.services import touch_student_attendance

    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )

    touch_student_attendance(student.id)

    assert StudentAttendance.objects.filter(student=student).count() == 1
    row = StudentAttendance.objects.get(student=student)
    assert row.class_course == course
    assert row.status == StudentAttendance.STATUS_PRESENT


def test_student_attendance_skips_inactive_enrollments(
    northwood, course_teacher
):
    """Enrollments that aren't ACTIVE do not produce attendance."""
    from accounts.models import StudentAttendance
    from accounts.services import touch_student_attendance

    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_BLOCKED,
    )

    touch_student_attendance(student.id)

    assert StudentAttendance.objects.count() == 0


def test_student_attendance_is_idempotent(northwood, course_teacher):
    """Multiple calls in one day keep a single row per class."""
    from accounts.models import StudentAttendance
    from accounts.services import touch_student_attendance

    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )

    touch_student_attendance(student.id)
    touch_student_attendance(student.id)
    touch_student_attendance(student.id)

    assert StudentAttendance.objects.filter(student=student).count() == 1


def test_attendance_teacher_and_student_are_separate(northwood, course_teacher):
    """Teacher and student attendance never cross-contaminate."""
    from accounts.models import StudentAttendance, TeacherAttendance
    from accounts.services import (
        touch_student_attendance,
        touch_teacher_attendance,
    )

    teacher = course_teacher
    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=teacher,
        name="Physics", subject="Physics",
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )

    touch_teacher_attendance(student.id)
    assert TeacherAttendance.objects.count() == 0
    assert StudentAttendance.objects.count() == 0

    touch_student_attendance(teacher.id)
    assert TeacherAttendance.objects.count() == 0
    assert StudentAttendance.objects.count() == 0


def test_teacher_attendance_list_scoped_to_institution(northwood, riverdale, course_teacher, course_teacher_riverdale):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)

    _make_teacher_attendance(course_teacher)
    _make_teacher_attendance(course_teacher_riverdale)

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/attendance/teachers/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["teacher"]["email"] == "teacher.nw@test.local"


def test_teacher_attendance_list_superuser_sees_all(northwood, riverdale, course_teacher, course_teacher_riverdale):
    su = make_user("root@test.local", User.ROLE_ADMIN, None, is_superuser=True)
    _make_teacher_attendance(course_teacher)
    _make_teacher_attendance(course_teacher_riverdale)

    client = auth_client(su)
    resp = client.get("/api/v1/admin/attendance/teachers/")
    assert resp.status_code == 200
    assert resp.json()["count"] == 2


def test_student_attendance_list_scoped_to_institution(northwood, riverdale, course_teacher, course_teacher_riverdale):
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    student_nw = make_user("snw@test.local", User.ROLE_STUDENT, northwood)
    student_rd = make_user("srd@test.local", User.ROLE_STUDENT, riverdale)

    course_nw = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="A", subject="X",
    )
    course_rd = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale, name="B", subject="X",
    )
    _make_student_attendance(student_nw, course_nw)
    _make_student_attendance(student_rd, course_rd)

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/attendance/students/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["student"]["email"] == "snw@test.local"


def test_attendance_requires_authentication(northwood):
    client = APIClient()
    resp = client.get("/api/v1/admin/attendance/teachers/")
    assert resp.status_code in (401, 403)

    resp = client.get("/api/v1/admin/attendance/students/")
    assert resp.status_code in (401, 403)


def test_attendance_filters_by_date(northwood, course_teacher):
    """?date= narrows to that day; default is today."""
    from datetime import timedelta

    from django.utils import timezone

    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    teacher = course_teacher

    today = timezone.localdate()
    yesterday = today - timedelta(days=1)

    _make_teacher_attendance(teacher, date=today)
    _make_teacher_attendance(teacher, date=yesterday)

    client = auth_client(admin)

    resp_today = client.get("/api/v1/admin/attendance/teachers/")
    assert resp_today.json()["count"] == 1

    resp_yest = client.get(
        f"/api/v1/admin/attendance/teachers/?date={yesterday.isoformat()}"
    )
    assert resp_yest.json()["count"] == 1


# ----------------------------------------------------------------- timetable


def _make_timetable_entry(course, *, day=0, start="09:00", end="10:00", room="", is_active=True):
    """Helper: build a TimetableEntry row directly."""
    from datetime import time

    from classes.models import TimetableEntry

    def _t(s):
        hh, mm = s.split(":")
        return time(int(hh), int(mm))

    return TimetableEntry.objects.create(
        institution=course.institution,
        class_course=course,
        teacher=course.teacher,
        day_of_week=day,
        start_time=_t(start),
        end_time=_t(end),
        room=room,
        is_active=is_active,
    )


def test_timetable_admin_can_create_entry(northwood, course_teacher):
    """Admin can create a valid timetable entry."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )

    client = auth_client(admin)
    resp = client.post(
        "/api/v1/admin/timetable/",
        {
            "class_course_id": str(course.id),
            "day_of_week": 0,
            "start_time": "09:00",
            "end_time": "10:00",
            "room": "R101",
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["day_of_week"] == 0
    assert body["room"] == "R101"
    assert body["is_active"] is True
    assert body["class_course"]["id"] == str(course.id)


def test_timetable_rejects_end_before_start(northwood, course_teacher):
    """end_time <= start_time is rejected."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )

    client = auth_client(admin)
    resp = client.post(
        "/api/v1/admin/timetable/",
        {
            "class_course_id": str(course.id),
            "day_of_week": 0,
            "start_time": "10:00",
            "end_time": "09:00",
        },
        format="json",
    )
    assert resp.status_code == 400


def test_timetable_teacher_conflict(northwood, course_teacher):
    """Same teacher cannot have two overlapping entries on the same day."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course_a = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics A", subject="Physics",
    )
    course_b = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics B", subject="Physics",
    )
    _make_timetable_entry(course_a, day=0, start="09:00", end="10:00")

    client = auth_client(admin)
    resp = client.post(
        "/api/v1/admin/timetable/",
        {
            "class_course_id": str(course_b.id),
            "day_of_week": 0,
            "start_time": "09:30",
            "end_time": "10:30",
        },
        format="json",
    )
    assert resp.status_code == 400
    assert "time slot" in resp.json()["error"]["detail"][0]


def test_timetable_class_conflict(northwood, course_teacher):
    """Same class_course cannot have two overlapping entries on the same day."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    _make_timetable_entry(course, day=1, start="09:00", end="10:00")

    client = auth_client(admin)
    resp = client.post(
        "/api/v1/admin/timetable/",
        {
            "class_course_id": str(course.id),
            "day_of_week": 1,
            "start_time": "09:30",
            "end_time": "10:30",
        },
        format="json",
    )
    assert resp.status_code == 400
    assert "time slot" in resp.json()["error"]["detail"][0]


def test_timetable_room_conflict(northwood, course_teacher):
    """Same non-blank room cannot be double-booked on the same day."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course_a = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics A", subject="Physics",
    )
    teacher_b = make_user("t.b@test.local", User.ROLE_TEACHER, northwood)
    course_b = ClassCourse.objects.create(
        institution=northwood, teacher=teacher_b,
        name="Physics B", subject="Physics",
    )
    _make_timetable_entry(course_a, day=2, start="09:00", end="10:00", room="R101")

    client = auth_client(admin)
    resp = client.post(
        "/api/v1/admin/timetable/",
        {
            "class_course_id": str(course_b.id),
            "day_of_week": 2,
            "start_time": "09:30",
            "end_time": "10:30",
            "room": "R101",
        },
        format="json",
    )
    assert resp.status_code == 400
    assert "R101" in resp.json()["error"]["detail"][0]


def test_timetable_adjacent_slots_are_allowed(northwood, course_teacher):
    """Back-to-back slots do not conflict: [09,10) and [10,11) are fine."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    _make_timetable_entry(course, day=3, start="09:00", end="10:00")

    client = auth_client(admin)
    resp = client.post(
        "/api/v1/admin/timetable/",
        {
            "class_course_id": str(course.id),
            "day_of_week": 3,
            "start_time": "10:00",
            "end_time": "11:00",
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content


def test_timetable_list_scoped_to_institution(
    northwood, riverdale, course_teacher, course_teacher_riverdale
):
    """Admin sees only own-institution entries."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course_nw = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="NW Physics", subject="Physics",
    )
    course_rd = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale,
        name="RD Physics", subject="Physics",
    )
    _make_timetable_entry(course_nw, day=0, start="09:00", end="10:00")
    _make_timetable_entry(course_rd, day=0, start="09:00", end="10:00")

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/timetable/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["class_course"]["name"] == "NW Physics"


def test_timetable_requires_authentication(northwood):
    """Unauthenticated admin request is rejected."""
    client = APIClient()
    resp = client.get("/api/v1/admin/timetable/")
    assert resp.status_code in (401, 403)


def test_timetable_admin_can_deactivate(northwood, course_teacher):
    """Soft delete flips is_active=False and keeps the row."""
    from classes.models import TimetableEntry

    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    entry = _make_timetable_entry(course, day=0, start="09:00", end="10:00")

    client = auth_client(admin)
    resp = client.post(f"/api/v1/admin/timetable/{entry.id}/deactivate/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_active"] is False

    assert TimetableEntry.objects.filter(pk=entry.id).exists()


def test_timetable_teacher_sees_own_entries(northwood, course_teacher):
    """Teacher /timetable/ returns only their own entries."""
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    _make_timetable_entry(course, day=0, start="09:00", end="10:00")

    client = auth_client(course_teacher)
    resp = client.get("/api/v1/timetable/")
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["class_course"]["name"] == "Physics"


def test_timetable_student_sees_enrolled_class_entries(
    northwood, course_teacher
):
    """Student /timetable/ returns entries for enrolled classes only."""
    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    course_a = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    course_b = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Chemistry", subject="Chemistry",
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course_a,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )
    _make_timetable_entry(course_a, day=0, start="09:00", end="10:00")
    _make_timetable_entry(course_b, day=0, start="11:00", end="12:00")

    client = auth_client(student)
    resp = client.get("/api/v1/timetable/")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["class_course"]["name"] == "Physics"


def test_timetable_admin_gets_403_on_role_view(northwood):
    """Admin should use /admin/timetable/, not the role-aware endpoint."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin)
    resp = client.get("/api/v1/timetable/")
    assert resp.status_code == 403


# ----------------------------------------------------------------- live classes


def _make_live_class(entry, *, date_offset=0, cancelled=False):
    """Helper: materialize one LiveClass for a TimetableEntry."""
    from datetime import timedelta

    from django.utils import timezone

    from classes.models import LiveClass
    from classes.services import _combine

    today = timezone.localdate()
    scheduled_date = today + timedelta(days=date_offset)
    return LiveClass.objects.create(
        timetable_entry=entry,
        class_course=entry.class_course,
        teacher=entry.teacher,
        institution=entry.institution,
        scheduled_date=scheduled_date,
        scheduled_start=_combine(scheduled_date, entry.start_time),
        scheduled_end=_combine(scheduled_date, entry.end_time),
        room=entry.room,
        stored_status=(
            LiveClass.STATUS_CANCELLED if cancelled else LiveClass.STATUS_UPCOMING
        ),
    )


def _make_timetable_entry_for(course, *, day=0, start="09:00", end="10:00"):
    """Helper: build a TimetableEntry directly."""
    from datetime import time

    from classes.models import TimetableEntry

    def _t(s):
        hh, mm = s.split(":")
        return time(int(hh), int(mm))

    return TimetableEntry.objects.create(
        institution=course.institution,
        class_course=course,
        teacher=course.teacher,
        day_of_week=day,
        start_time=_t(start),
        end_time=_t(end),
        room="",
        is_active=True,
    )


def test_materialize_creates_live_class_rows(northwood, course_teacher):
    """materialize_upcoming_sessions creates N rows for N weeks."""
    from classes.models import LiveClass
    from classes.services import materialize_upcoming_sessions

    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    entry = _make_timetable_entry_for(course)

    created = materialize_upcoming_sessions(entry, weeks=3)
    assert created == 3
    assert LiveClass.objects.filter(timetable_entry=entry).count() == 3


def test_materialize_is_idempotent(northwood, course_teacher):
    """Calling materialize twice does not duplicate rows."""
    from classes.models import LiveClass
    from classes.services import materialize_upcoming_sessions

    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    entry = _make_timetable_entry_for(course)

    materialize_upcoming_sessions(entry, weeks=2)
    second = materialize_upcoming_sessions(entry, weeks=2)
    assert second == 0
    assert LiveClass.objects.filter(timetable_entry=entry).count() == 2


def test_live_class_status_is_derived(northwood, course_teacher):
    """computed_status derives from the scheduled window."""
    from datetime import timedelta

    from django.utils import timezone

    from classes.models import LiveClass

    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    entry = _make_timetable_entry_for(course)
    now = timezone.now()

    past = LiveClass.objects.create(
        timetable_entry=entry,
        class_course=course,
        teacher=course_teacher,
        institution=northwood,
        scheduled_date=timezone.localdate() - timedelta(days=1),
        scheduled_start=now - timedelta(hours=2),
        scheduled_end=now - timedelta(hours=1),
        stored_status=LiveClass.STATUS_UPCOMING,
    )
    assert past.computed_status() == LiveClass.STATUS_COMPLETED

    future = LiveClass.objects.create(
        timetable_entry=entry,
        class_course=course,
        teacher=course_teacher,
        institution=northwood,
        scheduled_date=timezone.localdate() + timedelta(days=1),
        scheduled_start=now + timedelta(hours=1),
        scheduled_end=now + timedelta(hours=2),
        stored_status=LiveClass.STATUS_UPCOMING,
    )
    assert future.computed_status() == LiveClass.STATUS_UPCOMING

    live = LiveClass.objects.create(
        timetable_entry=entry,
        class_course=course,
        teacher=course_teacher,
        institution=northwood,
        scheduled_date=timezone.localdate(),
        scheduled_start=now - timedelta(minutes=10),
        scheduled_end=now + timedelta(minutes=50),
        stored_status=LiveClass.STATUS_UPCOMING,
    )
    assert live.computed_status() == LiveClass.STATUS_LIVE

    # Shift the cancelled occurrence forward by 2 days so it does not
    # collide with `live` on the unique (timetable_entry, scheduled_date)
    # constraint.
    cancelled = LiveClass.objects.create(
        timetable_entry=entry,
        class_course=course,
        teacher=course_teacher,
        institution=northwood,
        scheduled_date=timezone.localdate() + timedelta(days=2),
        scheduled_start=now + timedelta(days=2, minutes=-10),
        scheduled_end=now + timedelta(days=2, minutes=50),
        stored_status=LiveClass.STATUS_CANCELLED,
    )
    assert cancelled.computed_status() == LiveClass.STATUS_CANCELLED


def test_cancel_future_sessions_marks_upcoming(northwood, course_teacher):
    """cancel_future_sessions flips future rows to cancelled, keeps past."""
    from classes.models import LiveClass
    from classes.services import cancel_future_sessions

    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher,
        name="Physics", subject="Physics",
    )
    entry = _make_timetable_entry_for(course)

    past = _make_live_class(entry, date_offset=-7)
    future_1 = _make_live_class(entry, date_offset=7)
    future_2 = _make_live_class(entry, date_offset=14)

    updated = cancel_future_sessions(entry)
    assert updated == 2

    past.refresh_from_db()
    future_1.refresh_from_db()
    future_2.refresh_from_db()
    assert past.stored_status == LiveClass.STATUS_UPCOMING  # untouched
    assert future_1.stored_status == LiveClass.STATUS_CANCELLED
    assert future_2.stored_status == LiveClass.STATUS_CANCELLED


def test_admin_can_list_live_classes_scoped_to_institution(
    northwood, riverdale, course_teacher, course_teacher_riverdale
):
    """Admin sees only own-institution live classes."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)

    course_nw = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="NW", subject="X",
    )
    entry_nw = _make_timetable_entry_for(course_nw)
    _make_live_class(entry_nw)

    course_rd = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale, name="RD", subject="X",
    )
    entry_rd = _make_timetable_entry_for(course_rd)
    _make_live_class(entry_rd)

    client = auth_client(admin)
    resp = client.get("/api/v1/admin/live-classes/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["count"] == 1
    assert body["results"][0]["class_course"]["name"] == "NW"


def test_admin_can_cancel_live_class(northwood, course_teacher):
    """POST /cancel/ flips stored_status and audits."""
    from classes.models import LiveClass

    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="P", subject="X",
    )
    entry = _make_timetable_entry_for(course)
    live = _make_live_class(entry, date_offset=7)

    client = auth_client(admin)
    resp = client.post(f"/api/v1/admin/live-classes/{live.id}/cancel/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "cancelled"

    live.refresh_from_db()
    assert live.stored_status == LiveClass.STATUS_CANCELLED


def test_admin_cannot_retrieve_other_institution_live_class(
    northwood, riverdale, course_teacher_riverdale
):
    """Cross-institution access returns 404."""
    admin_nw = make_user("admin.nw@test.local", User.ROLE_ADMIN, northwood)
    course_rd = ClassCourse.objects.create(
        institution=riverdale, teacher=course_teacher_riverdale, name="R", subject="X",
    )
    entry_rd = _make_timetable_entry_for(course_rd)
    live = _make_live_class(entry_rd)

    client = auth_client(admin_nw)
    resp = client.get(f"/api/v1/admin/live-classes/{live.id}/")
    assert resp.status_code == 404


def test_teacher_sees_own_live_classes(northwood, course_teacher):
    """Teacher /live-classes/ returns only their own sessions."""
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="P", subject="X",
    )
    entry = _make_timetable_entry_for(course)
    _make_live_class(entry, date_offset=1)
    _make_live_class(entry, date_offset=2)

    client = auth_client(course_teacher)
    resp = client.get("/api/v1/live-classes/")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 2


def test_student_sees_live_classes_for_enrolled_classes_only(
    northwood, course_teacher
):
    """Student sees sessions for their enrolled classes only."""
    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    course_a = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="A", subject="X",
    )
    course_b = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="B", subject="Y",
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course_a,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )

    entry_a = _make_timetable_entry_for(course_a)
    entry_b = _make_timetable_entry_for(course_b, day=1)
    _make_live_class(entry_a, date_offset=1)
    _make_live_class(entry_b, date_offset=1)

    client = auth_client(student)
    resp = client.get("/api/v1/live-classes/")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["class_course"]["name"] == "A"


def test_live_classes_requires_authentication(northwood):
    """Unauthenticated request is rejected."""
    client = APIClient()
    resp = client.get("/api/v1/live-classes/")
    assert resp.status_code in (401, 403)
    resp = client.get("/api/v1/admin/live-classes/")
    assert resp.status_code in (401, 403)


def test_admin_live_classes_are_403_for_teacher(northwood, course_teacher):
    """Teacher cannot use the admin live-class endpoint."""
    client = auth_client(course_teacher)
    resp = client.get("/api/v1/admin/live-classes/")
    assert resp.status_code == 403


def test_role_aware_live_classes_403_for_admin(northwood):
    """Admin cannot use the role-aware live-class endpoint."""
    admin = make_user("admin@test.local", User.ROLE_ADMIN, northwood)
    client = auth_client(admin)
    resp = client.get("/api/v1/live-classes/")
    assert resp.status_code == 403


def test_touch_teacher_attendance_links_active_live_class(
    northwood, course_teacher
):
    """touch_teacher_attendance links a live LiveClass session."""
    from datetime import timedelta

    from django.utils import timezone

    from accounts.models import TeacherAttendance
    from accounts.services import touch_teacher_attendance
    from classes.models import LiveClass

    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="P", subject="X",
    )
    entry = _make_timetable_entry_for(course)

    now = timezone.now()
    today = timezone.localdate()
    live = LiveClass.objects.create(
        timetable_entry=entry,
        class_course=course,
        teacher=course_teacher,
        institution=northwood,
        scheduled_date=today,
        scheduled_start=now - timedelta(minutes=10),
        scheduled_end=now + timedelta(minutes=50),
        stored_status=LiveClass.STATUS_UPCOMING,
    )

    touch_teacher_attendance(course_teacher.id)

    att = TeacherAttendance.objects.get(teacher=course_teacher, date=today)
    assert att.live_class_id == live.id


def test_touch_student_attendance_links_active_live_class(
    northwood, course_teacher
):
    """touch_student_attendance links the live LiveClass session."""
    from datetime import timedelta

    from django.utils import timezone

    from accounts.models import StudentAttendance
    from accounts.services import touch_student_attendance
    from classes.models import LiveClass

    student = make_user("s@test.local", User.ROLE_STUDENT, northwood)
    course = ClassCourse.objects.create(
        institution=northwood, teacher=course_teacher, name="P", subject="X",
    )
    StudentEnrollment.objects.create(
        student=student, class_course=course,
        joining_code="AAA111",
        status=StudentEnrollment.STATUS_ACTIVE,
    )
    entry = _make_timetable_entry_for(course)

    now = timezone.now()
    today = timezone.localdate()
    live = LiveClass.objects.create(
        timetable_entry=entry,
        class_course=course,
        teacher=course_teacher,
        institution=northwood,
        scheduled_date=today,
        scheduled_start=now - timedelta(minutes=10),
        scheduled_end=now + timedelta(minutes=50),
        stored_status=LiveClass.STATUS_UPCOMING,
    )

    touch_student_attendance(student.id)

    att = StudentAttendance.objects.get(student=student, date=today)
    assert att.live_class_id == live.id


def test_touch_teacher_attendance_no_live_class_links_null(
    northwood, course_teacher
):
    """When no live class is running, live_class stays NULL."""
    from accounts.models import TeacherAttendance
    from accounts.services import touch_teacher_attendance
    from django.utils import timezone

    touch_teacher_attendance(course_teacher.id)
    att = TeacherAttendance.objects.get(
        teacher=course_teacher, date=timezone.localdate()
    )
    assert att.live_class_id is None