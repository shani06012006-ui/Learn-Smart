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
  redeemJoiningCode,
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
  // POST /enrollments/join/ -- student redeems a joining code.
  // Mirrors the backend's JoinClassView + join_class_with_code service:
  //   404 invalid code
  //   400 code belongs to a different student
  //   400 blocked/removed
  //   200 { class_course: {...}, status: "active" } on success
  http.post(`${BASE}/enrollments/join/`, async ({ request }) => {
    await delay(400);
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "student") {
      return simpleError("Only students can join a class with a code.", 403);
    }

    const body = await request.json();
    const code = body?.joining_code;
    if (!code || code.length !== 6) {
      return validationError({ joining_code: ["Enter the 6-character code your teacher gave you."] });
    }

    const result = redeemJoiningCode(user.id, code);

    if (!result.ok) {
      if (result.reason === "not_found") {
        return simpleError("Invalid joining code.", 404);
      }
      if (result.reason === "not_owner") {
        return simpleError("This joining code does not belong to your account.", 400);
      }
      if (result.reason === "blocked") {
        return simpleError("You have been blocked from this class.", 400);
      }
      if (result.reason === "removed") {
        return simpleError("This enrollment is no longer active. Contact your teacher.", 400);
      }
      return simpleError("Could not join this class.", 400);
    }

    const cls = findClassById(result.enrollment.class_id);
    return HttpResponse.json({
      class_course: serializeClass(cls),
      status: result.enrollment.status,
    });
  }),

  // GET /classes/ -- teacher sees own classes, student sees active enrollments
  http.get(`${BASE}/classes/`, ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const list =
      user.role === "teacher"
        ? classesForTeacher(user.id)
        : classesForStudent(user.id);

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

    softDeleteClass(cls.id);
    return new HttpResponse(null, { status: 204 });
  }),

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

    const existing = findUserByEmail(body.email);
    if (existing && existing.role !== "student") {
      return validationError({ email: ["An account with this email already exists with a different role."] });
    }

    const { enrollment, created } = addStudentToClass(cls.id, body);
    return HttpResponse.json(serializeEnrollment(enrollment), {
      status: created ? 201 : 200,
    });
  }),

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
