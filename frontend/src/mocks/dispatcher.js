// Local dispatcher -- replaces MSW + fetchBaseQuery for mock mode.
//
// Every function here is keyed by (method, urlPattern). The dispatcher
// matches an incoming request against these, calls the handler, and
// returns a fetchBaseQuery-shaped result:
//
//   success: { data: <response body> }
//   failure: { error: { status: <number>, data: <error body> } }
//
// Error body shapes match the real backend's custom exception handler:
//   validation:  { error: { detail: { field: [msg] }, status_code: 400 } }
//   simple:      { detail: "human readable message" }

import { findUserById, findUserByEmail, addUser, updateUser, serializeUser } from "./data/users";
import {
  issueTokenPair,
  rotateAccessToken,
  revokeRefreshToken,
  userIdForAccessToken,
} from "./data/session";
import {
  addClass,
  addStudentToClass,
  classesForStudent,
  classesForTeacher,
  enrollmentsForClass,
  findClassById,
  redeemJoiningCode,
  serializeClass,
  serializeEnrollment,
  softDeleteClass,
  updateEnrollmentStatus,
} from "./data/classes";
import {
  addAnnouncement,
  addMaterial,
  announcementsForClass,
  findAnnouncementById,
  findMaterialById,
  materialsForClass,
  serializeAnnouncement,
  serializeMaterial,
  softDeleteAnnouncement,
  softDeleteMaterial,
} from "./data/materials";
import {
  buildRecommendations,
  dashboardAnalytics,
} from "./data/analytics";
import {
  emptyPerformance,
  performanceForStudent,
} from "./data/performance";
import {
  addQuestion,
  addQuiz,
  createSubmission,
  findQuizById,
  findSubmissionById,
  findSubmissionForStudent,
  questionsForQuiz,
  quizzesForClass,
  resetSubmissions,
  serializeQuestion,
  serializeQuiz,
  serializeSubmission,
  softDeleteQuestion,
  softDeleteQuiz,
  submissionsForStudent,
  updateQuestion,
  updateQuiz,
} from "./data/exams";
import {
  appendMessage,
  canAccessThread,
  findThreadById,
  markThreadRead,
  messagesForThread,
  serializeMessage,
  serializeThread,
  threadsForUser,
} from "./data/chat";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const validationError = (fieldErrors) => ({
  status: 400,
  data: { error: { detail: fieldErrors, status_code: 400 } },
});

const simpleError = (message, status) => ({
  status,
  data: { detail: message },
});

const unauthorized = (message = "Authentication credentials were not provided.") =>
  simpleError(message, 401);

function currentUserFromArgs(args) {
  const headers = args?.headers || {};
  const auth =
    typeof headers.get === "function" ? headers.get("Authorization") : headers.Authorization;
  if (!auth) return null;
  const match = String(auth).match(/^Bearer (.+)$/);
  if (!match) return null;
  const userId = userIdForAccessToken(match[1]);
  return userId ? findUserById(userId) : null;
}

const ROUTES = [
  // -------- auth ---------------------------------------------------------
  { method: "POST", pattern: "/auth/register/", handler: async (args) => {
    await delay(300);
    const body = args.body || {};
    const errors = {};
    if (!body.email) errors.email = ["This field is required."];
    else if (findUserByEmail(body.email)) errors.email = ["user with this email already exists."];
    if (!body.first_name) errors.first_name = ["This field is required."];
    if (!body.last_name) errors.last_name = ["This field is required."];
    if (!body.password) errors.password = ["This field is required."];
    if (body.password && body.password.length < 8) errors.password = ["This password is too short. It must contain at least 8 characters."];
    if (body.password !== body.password_confirm) errors.password_confirm = ["Passwords do not match."];
    if (body.role && body.role !== "teacher" && body.role !== "admin") errors.role = ["Self-registration is only available for teacher or admin accounts."];
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const user = addUser({
      id: `usr-${Math.random().toString(36).slice(2, 10)}`,
      email: body.email, password: body.password,
      first_name: body.first_name, last_name: body.last_name,
      full_name: `${body.first_name} ${body.last_name}`,
      role: body.role || "teacher", institution: null,
      phone: "", avatar: null, is_blocked: false, is_online: false,
      date_joined: new Date().toISOString(),
    });
    return { data: serializeUser(user) };
  }},

  { method: "POST", pattern: "/auth/login/", handler: async (args) => {
    await delay(400);
    const { email, password } = args.body || {};
    const user = email ? findUserByEmail(email) : null;
    if (!user || user.password !== password) return { error: unauthorized("No active account found with the given credentials.") };
    if (user.is_blocked) return { error: simpleError("This account has been blocked. Contact your institution admin.", 400) };
    const tokens = issueTokenPair(user.id);
    return { data: { ...tokens, user: serializeUser(user) } };
  }},

  { method: "POST", pattern: "/auth/token/refresh/", handler: async (args) => {
    await delay(200);
    const { refresh } = args.body || {};
    const rotated = refresh ? rotateAccessToken(refresh) : null;
    if (!rotated) return { error: simpleError("Token is invalid or expired", 401) };
    return { data: rotated };
  }},

  { method: "POST", pattern: "/auth/logout/", handler: (args) => {
    const { refresh } = args.body || {};
    if (refresh) revokeRefreshToken(refresh);
    return { data: null };
  }},

  { method: "GET", pattern: "/auth/me/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    return { data: serializeUser(user) };
  }},

  { method: "PATCH", pattern: "/auth/me/", handler: async (args) => {
    await delay(300);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const body = args.body || {};
    // eslint-disable-next-line no-unused-vars
    const { role, id, email, ...editable } = body;
    const updated = updateUser(user.id, editable);
    return { data: serializeUser(updated) };
  }},

  // -------- classes ------------------------------------------------------
  { method: "GET", pattern: "/classes/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const list = user.role === "teacher" ? classesForTeacher(user.id) : classesForStudent(user.id);
    return { data: { count: list.length, next: null, previous: null, results: list.map((c) => serializeClass(c)) } };
  }},

  { method: "POST", pattern: "/classes/", handler: async (args) => {
    await delay(300);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can create classes.", 403) };
    const body = args.body || {};
    const errors = {};
    if (!body.name) errors.name = ["This field is required."];
    if (!body.subject) errors.subject = ["This field is required."];
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const cls = addClass({ teacherId: user.id, ...body });
    return { data: serializeClass(cls) };
  }},

  { method: "GET", pattern: "/classes/:id", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    const isOwner = cls.teacher_id === user.id;
    const isEnrolledStudent = user.role === "student" && enrollmentsForClass(cls.id).some((e) => e.student_id === user.id && e.status === "active");
    if (!isOwner && !isEnrolledStudent) return { error: simpleError("You do not have access to this class.", 403) };
    return { data: serializeClass(cls, { detail: true }) };
  }},

  { method: "PATCH", pattern: "/classes/:id", handler: async (args) => {
    await delay(300);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    Object.assign(cls, args.body || {});
    return { data: serializeClass(cls, { detail: true }) };
  }},

  { method: "DELETE", pattern: "/classes/:id", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    softDeleteClass(cls.id);
    return { data: null };
  }},

  { method: "GET", pattern: "/classes/:id/students", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    return { data: enrollmentsForClass(cls.id).map(serializeEnrollment) };
  }},

  { method: "POST", pattern: "/classes/:id/students", handler: async (args) => {
    await delay(400);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can add students.", 403) };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const body = args.body || {};
    const errors = {};
    if (!body.email) errors.email = ["This field is required."];
    if (!body.first_name) errors.first_name = ["This field is required."];
    if (!body.last_name) errors.last_name = ["This field is required."];
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const existing = findUserByEmail(body.email);
    if (existing && existing.role !== "student") return { error: validationError({ email: ["An account with this email already exists with a different role."] }) };
    const { enrollment } = addStudentToClass(cls.id, body);
    return { data: serializeEnrollment(enrollment) };
  }},

  { method: "PATCH", pattern: "/classes/:id/students/:enrollmentId", handler: async (args) => {
    await delay(250);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const status = args.body?.status;
    const allowed = ["active", "blocked", "removed"];
    if (!allowed.includes(status)) return { error: validationError({ status: [`Must be one of: ${allowed.join(", ")}`] }) };
    const enrollment = updateEnrollmentStatus(cls.id, args.params.enrollmentId, status);
    if (!enrollment) return { error: simpleError("Not found.", 404) };
    return { data: serializeEnrollment(enrollment) };
  }},

  { method: "POST", pattern: "/enrollments/join/", handler: async (args) => {
    await delay(400);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "student") return { error: simpleError("Only students can join a class with a code.", 403) };
    const code = args.body?.joining_code;
    if (!code || code.length !== 6) return { error: validationError({ joining_code: ["Enter the 6-character code your teacher gave you."] }) };
    const result = redeemJoiningCode(user.id, code);
    if (!result.ok) {
      if (result.reason === "not_found") return { error: simpleError("Invalid joining code.", 404) };
      if (result.reason === "not_owner") return { error: simpleError("This joining code does not belong to your account.", 400) };
      if (result.reason === "blocked") return { error: simpleError("You have been blocked from this class.", 400) };
      if (result.reason === "removed") return { error: simpleError("This enrollment is no longer active. Contact your teacher.", 400) };
      return { error: simpleError("Could not join this class.", 400) };
    }
    const cls = findClassById(result.enrollment.class_id);
    return { data: { class_course: serializeClass(cls), status: result.enrollment.status } };
  }},

  // -------- materials ----------------------------------------------------
  { method: "GET", pattern: "/classes/:id/materials/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    const hasAccess = cls.teacher_id === user.id || (user.role === "student" && enrollmentsForClass(cls.id).some((e) => e.student_id === user.id && e.status === "active"));
    if (!hasAccess) return { error: simpleError("You do not have access to this class.", 403) };
    return { data: materialsForClass(cls.id).map(serializeMaterial) };
  }},

  { method: "POST", pattern: "/classes/:id/materials/", handler: async (args) => {
    await delay(600);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can upload materials.", 403) };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const body = args.body || {};
    const errors = {};
    if (!body.title || !String(body.title).trim()) errors.title = ["This field is required."];
    if (!body.file || !body.file.name) errors.file = ["A file is required."];
    else if (body.file.size > 10 * 1024 * 1024) errors.file = ["File is larger than 10 MB."];
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const material = addMaterial({
      classId: cls.id, title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : "",
      originalFilename: body.file.name, mimeType: body.file.type || "application/octet-stream",
      sizeBytes: body.file.size, uploadedById: user.id,
    });
    return { data: serializeMaterial(material) };
  }},

  { method: "DELETE", pattern: "/materials/:id/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can delete materials.", 403) };
    const material = findMaterialById(args.params.id);
    if (!material) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(material.class_id);
    if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    softDeleteMaterial(material.id);
    return { data: null };
  }},

  // -------- announcements ------------------------------------------------
  { method: "GET", pattern: "/classes/:id/announcements/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    const hasAccess = cls.teacher_id === user.id || (user.role === "student" && enrollmentsForClass(cls.id).some((e) => e.student_id === user.id && e.status === "active"));
    if (!hasAccess) return { error: simpleError("You do not have access to this class.", 403) };
    return { data: announcementsForClass(cls.id).map(serializeAnnouncement) };
  }},

  { method: "POST", pattern: "/classes/:id/announcements/", handler: async (args) => {
    await delay(400);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can post announcements.", 403) };
    const cls = findClassById(args.params.id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const body = args.body || {};
    const errors = {};
    if (!body.title || !String(body.title).trim()) errors.title = ["This field is required."];
    if (!body.body || !String(body.body).trim()) errors.body = ["This field is required."];
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const ann = addAnnouncement({
      classId: cls.id, title: String(body.title).trim(), body: String(body.body).trim(),
      isPinned: !!body.is_pinned, postedById: user.id,
    });
    return { data: serializeAnnouncement(ann) };
  }},

  { method: "DELETE", pattern: "/announcements/:id/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can delete announcements.", 403) };
    const ann = findAnnouncementById(args.params.id);
    if (!ann) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(ann.class_id);
    if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    softDeleteAnnouncement(ann.id);
    return { data: null };
  }},

  // -------- teacher analytics -------------------------------------------
  { method: "GET", pattern: "/teacher/dashboard/analytics/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can access the analytics dashboard.", 403) };
    const recommendations = buildRecommendations(dashboardAnalytics);
    return { data: { ...dashboardAnalytics, recommendations } };
  }},

  // -------- student performance -----------------------------------------
  { method: "GET", pattern: "/student/performance/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "student") return { error: simpleError("Only students can access their performance page.", 403) };
    const data = performanceForStudent(user.id) || emptyPerformance();
    return { data };
  }},

  // -------- exams: lists -------------------------------------------------
  { method: "GET", pattern: "/quizzes/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "student") return { error: simpleError("This endpoint is for students.", 403) };
    const enrolledClassIds = classesForStudent(user.id).map((c) => c.id);
    const list = enrolledClassIds.flatMap((cid) => quizzesForClass(cid, { onlyPublished: true }));
    return { data: list.map((q) => serializeQuiz(q, { studentId: user.id })) };
  }},

  { method: "GET", pattern: "/classes/:classId/quizzes/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const cls = findClassById(args.params.classId);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (user.role === "teacher") {
      if (cls.teacher_id !== user.id) return { error: simpleError("You do not have access to this class.", 403) };
      return { data: quizzesForClass(cls.id).map((q) => serializeQuiz(q)) };
    }
    if (user.role === "student") {
      const enrolled = classesForStudent(user.id).some((c) => c.id === cls.id);
      if (!enrolled) return { error: simpleError("You do not have access to this class.", 403) };
      return { data: quizzesForClass(cls.id, { onlyPublished: true }).map((q) => serializeQuiz(q, { studentId: user.id })) };
    }
    return { error: simpleError("Not allowed.", 403) };
  }},

  { method: "POST", pattern: "/classes/:classId/quizzes/", handler: async (args) => {
    await delay(300);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can create quizzes.", 403) };
    const cls = findClassById(args.params.classId);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const body = args.body || {};
    const errors = {};
    if (!body.title || !String(body.title).trim()) errors.title = ["This field is required."];
    if (body.duration_minutes == null || Number(body.duration_minutes) <= 0) errors.duration_minutes = ["Must be a positive number of minutes."];
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const quiz = addQuiz({
      classId: cls.id, title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : "",
      durationMinutes: Number(body.duration_minutes), createdById: user.id,
    });
    return { data: serializeQuiz(quiz) };
  }},

  // -------- exams: single quiz ------------------------------------------
  { method: "GET", pattern: "/quizzes/:id/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const quiz = findQuizById(args.params.id);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(quiz.class_id);
    if (!cls) return { error: simpleError("Not found.", 404) };
    if (user.role === "teacher") {
      if (cls.teacher_id !== user.id) return { error: simpleError("You do not have access to this quiz.", 403) };
      const base = serializeQuiz(quiz, { includeQuestions: false });
      base.questions = questionsForQuiz(quiz.id).map(serializeQuestion);
      return { data: base };
    }
    if (user.role === "student") {
      const enrolled = classesForStudent(user.id).some((c) => c.id === cls.id);
      if (!enrolled) return { error: simpleError("You do not have access to this quiz.", 403) };
      if (!quiz.is_published) return { error: simpleError("Not found.", 404) };
      const base = serializeQuiz(quiz, { includeQuestions: false, studentId: user.id });
      base.questions = questionsForQuiz(quiz.id).map((q) => ({
        id: q.id, quiz_id: q.quiz_id, order: q.order, text: q.text, marks: q.marks,
        choices: serializeQuestion(q).choices.map((c) => ({ id: c.id, text: c.text })),
      }));
      return { data: base };
    }
    return { error: simpleError("Not allowed.", 403) };
  }},

  { method: "PATCH", pattern: "/quizzes/:id/", handler: async (args) => {
    await delay(200);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can edit quizzes.", 403) };
    const quiz = findQuizById(args.params.id);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const body = args.body || {};
    const patch = {};
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.description !== undefined) patch.description = String(body.description).trim();
    if (body.duration_minutes !== undefined) patch.duration_minutes = Number(body.duration_minutes);
    if (body.is_published !== undefined) patch.is_published = !!body.is_published;
    const updated = updateQuiz(quiz.id, patch);
    return { data: serializeQuiz(updated) };
  }},

  { method: "DELETE", pattern: "/quizzes/:id/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can delete quizzes.", 403) };
    const quiz = findQuizById(args.params.id);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    softDeleteQuiz(quiz.id);
    return { data: null };
  }},

  // -------- exams: questions --------------------------------------------
  { method: "POST", pattern: "/quizzes/:id/questions/", handler: async (args) => {
    await delay(200);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can add questions.", 403) };
    const quiz = findQuizById(args.params.id);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const body = args.body || {};
    const errors = {};
    if (!body.text || !String(body.text).trim()) errors.text = ["This field is required."];
    if (!Array.isArray(body.choices) || body.choices.length < 2) errors.choices = ["Provide at least two choices."];
    else {
      const correctCount = body.choices.filter((c) => c.is_correct).length;
      if (correctCount !== 1) errors.choices = ["Exactly one choice must be marked correct."];
      if (body.choices.some((c) => !c.text || !String(c.text).trim())) errors.choices = ["Every choice needs text."];
    }
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const { question } = addQuestion({
      quizId: quiz.id, text: String(body.text).trim(),
      marks: Number(body.marks) || 1, choicesData: body.choices,
    });
    return { data: serializeQuestion(question) };
  }},

  { method: "PATCH", pattern: "/questions/:id/", handler: async (args) => {
    await delay(200);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can edit questions.", 403) };
    const body = args.body || {};
    if (!body.quiz_id) return { error: simpleError("quiz_id is required in the body.", 400) };
    const quiz = findQuizById(body.quiz_id);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    const errors = {};
    if (body.text !== undefined && !String(body.text).trim()) errors.text = ["This field is required."];
    if (Array.isArray(body.choices)) {
      if (body.choices.length < 2) errors.choices = ["Provide at least two choices."];
      else {
        const correctCount = body.choices.filter((c) => c.is_correct).length;
        if (correctCount !== 1) errors.choices = ["Exactly one choice must be marked correct."];
      }
    }
    if (Object.keys(errors).length > 0) return { error: validationError(errors) };
    const updated = updateQuestion(args.params.id, {
      text: body.text !== undefined ? String(body.text).trim() : undefined,
      marks: body.marks !== undefined ? Number(body.marks) : undefined,
      choicesData: body.choices,
    });
    if (!updated) return { error: simpleError("Not found.", 404) };
    return { data: serializeQuestion(updated) };
  }},

  { method: "DELETE", pattern: "/questions/:id/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "teacher") return { error: simpleError("Only teachers can delete questions.", 403) };
    const quizId = args.body?.quiz_id;
    if (!quizId) return { error: simpleError("quiz_id is required in the body.", 400) };
    const quiz = findQuizById(quizId);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You are not the teacher assigned to this class.", 403) };
    softDeleteQuestion(args.params.id);
    return { data: null };
  }},

  // -------- exams: submissions ------------------------------------------
  { method: "GET", pattern: "/submissions/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role === "student") {
      const quizFilter = args.params.__query?.quiz;
      const list = submissionsForStudent(user.id).filter((s) => !quizFilter || s.quiz_id === quizFilter);
      return { data: list.map(serializeSubmission) };
    }
    if (user.role === "teacher") return { data: [] };
    return { error: simpleError("Not allowed.", 403) };
  }},

  { method: "POST", pattern: "/quizzes/:id/submit/", handler: async (args) => {
    await delay(500);
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (user.role !== "student") return { error: simpleError("Only students can submit quizzes.", 403) };
    const quiz = findQuizById(args.params.id);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    if (!quiz.is_published) return { error: simpleError("This quiz is not open.", 400) };
    const cls = findClassById(quiz.class_id);
    const enrolled = cls && classesForStudent(user.id).some((c) => c.id === cls.id);
    if (!enrolled) return { error: simpleError("You do not have access to this quiz.", 403) };
    const existing = findSubmissionForStudent(quiz.id, user.id);
    if (existing) return { error: simpleError("You have already submitted this quiz.", 400) };
    const answers = args.body?.answers || {};
    const submission = createSubmission({ quizId: quiz.id, studentId: user.id, answersByQuestionId: answers });
    return { data: serializeSubmission(submission) };
  }},

  { method: "GET", pattern: "/submissions/:id/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const submission = findSubmissionById(args.params.id);
    if (!submission) return { error: simpleError("Not found.", 404) };
    const quiz = findQuizById(submission.quiz_id);
    if (!quiz) return { error: simpleError("Not found.", 404) };
    const cls = findClassById(quiz.class_id);
    if (user.role === "student") {
      if (submission.student_id !== user.id) return { error: simpleError("You do not have access to this submission.", 403) };
    } else if (user.role === "teacher") {
      if (!cls || cls.teacher_id !== user.id) return { error: simpleError("You do not have access to this submission.", 403) };
    } else {
      return { error: simpleError("Not allowed.", 403) };
    }
    return { data: {
      ...serializeSubmission(submission),
      quiz: { id: quiz.id, title: quiz.title, class_id: quiz.class_id },
      questions: questionsForQuiz(quiz.id).map(serializeQuestion),
    }};
  }},

  { method: "POST", pattern: "/__reset-submissions/", handler: () => {
    resetSubmissions();
    return { data: null };
  }},

  // -------- chat ---------------------------------------------------------
  { method: "GET", pattern: "/chat/threads/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const list = threadsForUser(user.id).map((t) => serializeThread(t, user.id));
    list.sort((a, b) => {
      const aTime = a.last_message ? new Date(a.last_message.created_at) : 0;
      const bTime = b.last_message ? new Date(b.last_message.created_at) : 0;
      return bTime - aTime;
    });
    return { data: list };
  }},

  { method: "GET", pattern: "/chat/threads/:id/messages/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (!canAccessThread(args.params.id, user.id)) return { error: simpleError("You do not have access to this thread.", 403) };
    return { data: messagesForThread(args.params.id).map(serializeMessage) };
  }},

  { method: "POST", pattern: "/chat/threads/:id/messages/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (!canAccessThread(args.params.id, user.id)) return { error: simpleError("You do not have access to this thread.", 403) };
    const thread = findThreadById(args.params.id);
    if (!thread) return { error: simpleError("Not found.", 404) };
    const body = args.body?.body;
    if (!body || !String(body).trim()) return { error: validationError({ body: ["Message cannot be empty."] }) };
    const message = appendMessage({ threadId: thread.id, senderId: user.id, body: String(body).trim() });
    return { data: serializeMessage(message) };
  }},

  { method: "POST", pattern: "/chat/threads/:id/read/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    if (!canAccessThread(args.params.id, user.id)) return { error: simpleError("You do not have access to this thread.", 403) };
    const marked = markThreadRead(args.params.id, user.id);
    return { data: { marked } };
  }},

  { method: "POST", pattern: "/__mock-incoming-message/", handler: (args) => {
    const user = currentUserFromArgs(args);
    if (!user) return { error: unauthorized() };
    const thread = findThreadById(args.body?.thread_id);
    if (!thread) return { error: simpleError("Not found.", 404) };
    let senderId = null;
    if (thread.kind === "group") {
      const cls = findClassById(thread.class_id);
      senderId = cls?.teacher_id;
    } else {
      senderId = thread.participant_ids.find((id) => id !== user.id);
    }
    if (!senderId) return { error: simpleError("No valid sender for this thread.", 400) };
    const message = appendMessage({
      threadId: thread.id, senderId,
      body: String(args.body?.body || "").trim() || "(empty)",
    });
    return { data: serializeMessage(message) };
  }},
];

function compilePattern(pattern) {
  const paramNames = [];
  let regexStr = pattern.replace(/\/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
    paramNames.push(name);
    return "/([^/]+)";
  });
  regexStr = regexStr.replace(/\//g, "\\/");
  // MSW is trailing-slash tolerant; the dispatcher must be too.
  return { regex: new RegExp(`^${regexStr}/?$`), paramNames };
}

const COMPILED = ROUTES.map((route) => ({ ...route, ...compilePattern(route.pattern) }));

function parseQuery(url) {
  const idx = url.indexOf("?");
  if (idx === -1) return { path: url, query: {} };
  const path = url.slice(0, idx);
  const search = new URLSearchParams(url.slice(idx + 1));
  const query = Object.fromEntries(search.entries());
  return { path, query };
}

export function matchRoute(method, rawUrl) {
  const { path, query } = parseQuery(rawUrl);
  for (const route of COMPILED) {
    if (route.method !== method) continue;
    const m = path.match(route.regex);
    if (!m) continue;
    const params = {};
    route.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(m[i + 1]);
    });
    params.__query = query;
    return { route, params };
  }
  return null;
}

export async function localDispatcher(args, api, extraOptions) {
  // Defensive: if a caller ever passes a raw string, normalize it here too.
  const normalized = typeof args === "string" ? { url: args, method: "GET" } : args;
  const method = (normalized.method || "GET").toUpperCase();
  const url = normalized.url;

  if (!url || typeof url !== "string") {
    return {
      error: {
        status: 400,
        data: { detail: `Mock dispatcher received no URL: ${JSON.stringify(normalized)}` },
      },
    };
  }

  const match = matchRoute(method, url);
  if (!match) {
    return {
      error: {
        status: 404,
        data: { detail: `No mock route for ${method} ${url}` },
      },
    };
  }

  const token = localStorage.getItem("autolearn.access");
  const headersInput = normalized.headers || {};
  const hasAuth =
    typeof headersInput.get === "function"
      ? !!headersInput.get("Authorization")
      : !!headersInput.Authorization;

  const effectiveArgs = {
    ...normalized,
    body: normalized.body,
    headers: hasAuth
      ? headersInput
      : { ...headersInput, Authorization: token ? `Bearer ${token}` : undefined },
    params: match.params,
  };

  try {
    const result = await match.route.handler(effectiveArgs);
    if (result.error) return { error: result.error };
    return { data: result.data };
  } catch (e) {
    return {
      error: {
        status: 500,
        data: { detail: `Mock dispatcher error: ${e.message}` },
      },
    };
  }
}

