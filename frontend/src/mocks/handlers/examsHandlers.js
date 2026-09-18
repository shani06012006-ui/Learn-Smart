import { http, HttpResponse } from "msw";

import { findUserById } from "../data/users";
import { classesForStudent, findClassById } from "../data/classes";
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
} from "../data/exams";
import { getBearerToken, userIdForAccessToken } from "../data/session";
import { simpleError, unauthorized, validationError } from "../utils";

const BASE = "/api/v1";

function currentUser(request) {
  const token = getBearerToken(request);
  const userId = token ? userIdForAccessToken(token) : null;
  return userId ? findUserById(userId) : null;
}

function serializeQuizForTeacher(quiz, { includeQuestions = false } = {}) {
  const base = serializeQuiz(quiz, { includeQuestions: false });
  if (includeQuestions) {
    base.questions = questionsForQuiz(quiz.id).map(serializeQuestion);
  }
  return base;
}

function serializeQuizForStudent(quiz, studentId) {
  const base = serializeQuiz(quiz, {
    includeQuestions: false,
    studentId,
  });
  base.questions = questionsForQuiz(quiz.id).map((q) => ({
    id: q.id,
    quiz_id: q.quiz_id,
    order: q.order,
    text: q.text,
    marks: q.marks,
    choices: serializeQuestion(q).choices.map((c) => ({ id: c.id, text: c.text })),
  }));
  return base;
}

export const examsHandlers = [
  // DEV-ONLY: clear all submissions so a tester can start clean without
  // restarting the MSW worker. Returns 204 on success.
  http.post(`${BASE}/__reset-submissions/`, () => {
    resetSubmissions();
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- student-facing: submissions list ---------------------------

  // GET /submissions/ -- the caller's own submissions (students) or every
  // submission on their quizzes (teachers). Supports ?quiz=<id> to filter.
  http.get(`${BASE}/submissions/`, ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    if (user.role === "student") {
      const url = new URL(request.url);
      const quizIdFilter = url.searchParams.get("quiz");
      const list = submissionsForStudent(user.id).filter(
        (s) => !quizIdFilter || s.quiz_id === quizIdFilter
      );
      return HttpResponse.json(list.map(serializeSubmission));
    }

    if (user.role === "teacher") {
      // Return an empty list -- the teacher-side submission list isn't
      // built yet. A real backend would return all submissions for the
      // teacher's quizzes; we'll wire that when we add the teacher view.
      return HttpResponse.json([]);
    }

    return simpleError("Not allowed.", 403);
  }),

  // ---------- student-facing: top-level quiz list ------------------------

  // GET /quizzes/ -- published quizzes across the student's active
  // enrollments, with already_submitted flags computed per-student.
  http.get(`${BASE}/quizzes/`, ({ request }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "student") {
      return simpleError(
        "This endpoint is for students. Teachers should use the class-scoped quiz list.",
        403
      );
    }

    const enrolledClassIds = classesForStudent(user.id).map((c) => c.id);
    const list = enrolledClassIds.flatMap((cid) =>
      quizzesForClass(cid, { onlyPublished: true })
    );

    return HttpResponse.json(list.map((q) => serializeQuiz(q, { studentId: user.id })));
  }),

  // ---------- teacher-facing: class-scoped quiz list ---------------------

  http.get(`${BASE}/classes/:classId/quizzes/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.classId);
    if (!cls) return simpleError("Not found.", 404);

    if (user.role === "teacher") {
      if (cls.teacher_id !== user.id) {
        return simpleError("You do not have access to this class.", 403);
      }
      return HttpResponse.json(quizzesForClass(cls.id).map((q) => serializeQuiz(q)));
    }

    if (user.role === "student") {
      const enrolled = classesForStudent(user.id).some((c) => c.id === cls.id);
      if (!enrolled) {
        return simpleError("You do not have access to this class.", 403);
      }
      return HttpResponse.json(
        quizzesForClass(cls.id, { onlyPublished: true }).map((q) =>
          serializeQuiz(q, { studentId: user.id })
        )
      );
    }

    return simpleError("Not allowed.", 403);
  }),

  // POST /classes/:classId/quizzes/ -- teacher creates a quiz (draft)
  http.post(`${BASE}/classes/:classId/quizzes/`, async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can create quizzes.", 403);
    }

    const cls = findClassById(params.classId);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const body = await request.json();
    const errors = {};
    if (!body.title || !String(body.title).trim()) {
      errors.title = ["This field is required."];
    }
    if (body.duration_minutes == null || Number(body.duration_minutes) <= 0) {
      errors.duration_minutes = ["Must be a positive number of minutes."];
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const quiz = addQuiz({
      classId: cls.id,
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : "",
      durationMinutes: Number(body.duration_minutes),
      createdById: user.id,
    });

    return HttpResponse.json(serializeQuizForTeacher(quiz), { status: 201 });
  }),

  // ---------- single quiz ------------------------------------------------

  http.get(`${BASE}/quizzes/:id/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const quiz = findQuizById(params.id);
    if (!quiz) return simpleError("Not found.", 404);

    const cls = findClassById(quiz.class_id);
    if (!cls) return simpleError("Not found.", 404);

    if (user.role === "teacher") {
      if (cls.teacher_id !== user.id) {
        return simpleError("You do not have access to this quiz.", 403);
      }
      return HttpResponse.json(serializeQuizForTeacher(quiz, { includeQuestions: true }));
    }

    if (user.role === "student") {
      const enrolled = classesForStudent(user.id).some((c) => c.id === cls.id);
      if (!enrolled) {
        return simpleError("You do not have access to this quiz.", 403);
      }
      if (!quiz.is_published) {
        return simpleError("Not found.", 404);
      }
      return HttpResponse.json(serializeQuizForStudent(quiz, user.id));
    }

    return simpleError("Not allowed.", 403);
  }),

  http.patch(`${BASE}/quizzes/:id/`, async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can edit quizzes.", 403);
    }

    const quiz = findQuizById(params.id);
    if (!quiz) return simpleError("Not found.", 404);

    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const body = await request.json();
    const patch = {};
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.description !== undefined) patch.description = String(body.description).trim();
    if (body.duration_minutes !== undefined) patch.duration_minutes = Number(body.duration_minutes);
    if (body.is_published !== undefined) patch.is_published = !!body.is_published;

    const updated = updateQuiz(quiz.id, patch);
    return HttpResponse.json(serializeQuizForTeacher(updated));
  }),

  http.delete(`${BASE}/quizzes/:id/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can delete quizzes.", 403);
    }

    const quiz = findQuizById(params.id);
    if (!quiz) return simpleError("Not found.", 404);

    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    softDeleteQuiz(quiz.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- questions --------------------------------------------------

  http.post(`${BASE}/quizzes/:id/questions/`, async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can add questions.", 403);
    }

    const quiz = findQuizById(params.id);
    if (!quiz) return simpleError("Not found.", 404);

    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const body = await request.json();
    const errors = {};
    if (!body.text || !String(body.text).trim()) {
      errors.text = ["This field is required."];
    }
    if (!Array.isArray(body.choices) || body.choices.length < 2) {
      errors.choices = ["Provide at least two choices."];
    } else {
      const correctCount = body.choices.filter((c) => c.is_correct).length;
      if (correctCount !== 1) {
        errors.choices = ["Exactly one choice must be marked correct."];
      }
      if (body.choices.some((c) => !c.text || !String(c.text).trim())) {
        errors.choices = ["Every choice needs text."];
      }
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const { question } = addQuestion({
      quizId: quiz.id,
      text: String(body.text).trim(),
      marks: Number(body.marks) || 1,
      choicesData: body.choices,
    });

    return HttpResponse.json(serializeQuestion(question), { status: 201 });
  }),

  http.patch(`${BASE}/questions/:id/`, async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can edit questions.", 403);
    }

    const body = await request.json();
    const quizId = body.quiz_id;
    if (!quizId) return simpleError("quiz_id is required in the body.", 400);

    const quiz = findQuizById(quizId);
    if (!quiz) return simpleError("Not found.", 404);

    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const errors = {};
    if (body.text !== undefined && !String(body.text).trim()) {
      errors.text = ["This field is required."];
    }
    if (Array.isArray(body.choices)) {
      if (body.choices.length < 2) {
        errors.choices = ["Provide at least two choices."];
      } else {
        const correctCount = body.choices.filter((c) => c.is_correct).length;
        if (correctCount !== 1) {
          errors.choices = ["Exactly one choice must be marked correct."];
        }
      }
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const updated = updateQuestion(params.id, {
      text: body.text !== undefined ? String(body.text).trim() : undefined,
      marks: body.marks !== undefined ? Number(body.marks) : undefined,
      choicesData: body.choices,
    });
    if (!updated) return simpleError("Not found.", 404);

    return HttpResponse.json(serializeQuestion(updated));
  }),

  http.delete(`${BASE}/questions/:id/`, async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can delete questions.", 403);
    }

    const body = await request.json().catch(() => ({}));
    const quizId = body.quiz_id;
    if (!quizId) return simpleError("quiz_id is required in the body.", 400);

    const quiz = findQuizById(quizId);
    if (!quiz) return simpleError("Not found.", 404);

    const cls = findClassById(quiz.class_id);
    if (!cls || cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    softDeleteQuestion(params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- submissions ------------------------------------------------

  // POST /quizzes/:id/submit/ -- student submits. Duplicate check is
  // scoped to (quiz, student) via findSubmissionForStudent.
  http.post(`${BASE}/quizzes/:id/submit/`, async ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "student") {
      return simpleError("Only students can submit quizzes.", 403);
    }

    const quiz = findQuizById(params.id);
    if (!quiz) return simpleError("Not found.", 404);
    if (!quiz.is_published) return simpleError("This quiz is not open.", 400);

    const cls = findClassById(quiz.class_id);
    const enrolled = cls && classesForStudent(user.id).some((c) => c.id === cls.id);
    if (!enrolled) return simpleError("You do not have access to this quiz.", 403);

    const existing = findSubmissionForStudent(quiz.id, user.id);
    if (existing) {
      return simpleError("You have already submitted this quiz.", 400);
    }

    const body = await request.json();
    const answers = body.answers || {};
    const submission = createSubmission({
      quizId: quiz.id,
      studentId: user.id,
      answersByQuestionId: answers,
    });

    return HttpResponse.json(serializeSubmission(submission), { status: 201 });
  }),

  // GET /submissions/:id/ -- student reviews their own; teacher reviews any
  http.get(`${BASE}/submissions/:id/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const submission = findSubmissionById(params.id);
    if (!submission) return simpleError("Not found.", 404);

    const quiz = findQuizById(submission.quiz_id);
    if (!quiz) return simpleError("Not found.", 404);
    const cls = findClassById(quiz.class_id);

    if (user.role === "student") {
      if (submission.student_id !== user.id) {
        return simpleError("You do not have access to this submission.", 403);
      }
    } else if (user.role === "teacher") {
      if (!cls || cls.teacher_id !== user.id) {
        return simpleError("You do not have access to this submission.", 403);
      }
    } else {
      return simpleError("Not allowed.", 403);
    }

    return HttpResponse.json({
      ...serializeSubmission(submission),
      quiz: {
        id: quiz.id,
        title: quiz.title,
        class_id: quiz.class_id,
      },
      questions: questionsForQuiz(quiz.id).map(serializeQuestion),
    });
  }),
];
