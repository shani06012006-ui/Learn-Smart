import { http, HttpResponse } from "msw";

import { findUserById, findUserByEmail } from "../data/users";
import {
  addClass,
  addStudentToClass,
  classesForStudent,
  classesForTeacher,
  enrollmentsForClass,
  findClassById,
  serializeClass,
  serializeEnrollment,
  softDeleteClass,
  updateEnrollmentStatus,
} from "../data/classes";
import { getBearerToken, userIdForAccessToken } from "../data/session";
import { delay, simpleError, unauthorized, validationError } from "../utils";

const BASE = "/api/v1";

function currentUser(request) {
  const token = getBearerToken(request);
  const userId = token ? userIdForAccessToken(token) : null;
  return userId ? findUserById(userId) : null;
}

export const classesHandlers = [
  // GET /classes/ -- teacher sees own classes, student sees active enrollments
  // POST /classes/ -- teacher-only, creates a class
  http.get(`${BASE}/classes/`, ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const list =
      user.role === "teacher"
        ? classesForTeacher(user.id)
        : classesForStudent(user.id);

    // Matches DRF's paginated list shape (results + count), same as the
    // real ListCreateAPIView with default pagination.
    return HttpResponse.json({
      count: list.length,
      next: null,
      previous: null,
      results: list.map((c) => serializeClass(c)),
    });
  }),

  http.post(`${BASE}/classes/`, async ({ request }) => {
    await delay(300);
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can create classes.", 403);
    }

    const body = await request.json();
    const errors = {};
    if (!body.name) errors.name = ["This field is required."];
    if (!body.subject) errors.subject = ["This field is required."];
    if (Object.keys(errors).length > 0) return validationError(errors);

    const cls = addClass({ teacherId: user.id, ...body });
    return HttpResponse.json(serializeClass(cls), { status: 201 });
  }),

  // GET/PATCH/DELETE /classes/{id}/
  http.get(`${BASE}/classes/:id`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);

    const isOwner = cls.teacher_id === user.id;
    const isEnrolledStudent =
      user.role === "student" &&
      enrollmentsForClass(cls.id).some((e) => e.student_id === user.id && e.status === "active");

    if (!isOwner && !isEnrolledStudent) {
      return simpleError("You do not have access to this class.", 403);
    }

    return HttpResponse.json(serializeClass(cls, { detail: true }));
  }),

  http.patch(`${BASE}/classes/:id`, async ({ request, params }) => {
    await delay(300);
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const body = await request.json();
    Object.assign(cls, body);
    return HttpResponse.json(serializeClass(cls, { detail: true }));
  }),

  http.delete(`${BASE}/classes/:id`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    softDeleteClass(cls.id); // soft-delete, matching the real backend exactly
    return new HttpResponse(null, { status: 204 });
  }),

  // GET/POST /classes/{id}/students/
  http.get(`${BASE}/classes/:id/students`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const roster = enrollmentsForClass(cls.id).map(serializeEnrollment);
    return HttpResponse.json(roster);
  }),

  http.post(`${BASE}/classes/:id/students`, async ({ request, params }) => {
    await delay(400);
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") return simpleError("Only teachers can add students.", 403);

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const body = await request.json();
    const errors = {};
    if (!body.email) errors.email = ["This field is required."];
    if (!body.first_name) errors.first_name = ["This field is required."];
    if (!body.last_name) errors.last_name = ["This field is required."];
    if (Object.keys(errors).length > 0) return validationError(errors);

    // Guard against adding an existing TEACHER/admin account as a "student" --
    // the real backend's get_or_create would otherwise silently attach an
    // unrelated account's enrollment record to this class.
    const existing = findUserByEmail(body.email);
    if (existing && existing.role !== "student") {
      return validationError({ email: ["An account with this email already exists with a different role."] });
    }

    const { enrollment, created } = addStudentToClass(cls.id, body);
    return HttpResponse.json(serializeEnrollment(enrollment), {
      status: created ? 201 : 200,
    });
  }),

  // PATCH /classes/{id}/students/{enrollmentId}/ -- block/remove/reactivate
  http.patch(`${BASE}/classes/:id/students/:enrollmentId`, async ({ request, params }) => {
    await delay(250);
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const body = await request.json();
    const allowed = ["active", "blocked", "removed"];
    if (!allowed.includes(body.status)) {
      return validationError({ status: [`Must be one of: ${allowed.join(", ")}`] });
    }

    const enrollment = updateEnrollmentStatus(cls.id, params.enrollmentId, body.status);
    if (!enrollment) return simpleError("Not found.", 404);

    return HttpResponse.json(serializeEnrollment(enrollment));
  }),
];
