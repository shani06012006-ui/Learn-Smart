// In-memory store for Quiz + Question + Choice + StudentSubmission mock
// data. Shapes mirror the future backend/exams/models.py models. Handlers
// read/write this module; components never see it directly.

// ---------- quizzes -------------------------------------------------------

let quizzes = [
  {
    id: "quiz-phy10-1",
    class_id: "cls-phy10-anita",
    title: "Motion Basics",
    description: "Covers distance, displacement, speed, velocity, and acceleration.",
    duration_minutes: 30,
    is_published: true,
    created_by_id: "usr-teacher-anita",
    created_at: "2026-08-28T09:00:00+05:30",
    is_deleted: false,
  },
  {
    id: "quiz-phy10-2",
    class_id: "cls-phy10-anita",
    title: "Newton's Laws — Quiz 4",
    description: "The quiz covers Chapter 4 (Newton's three laws, free-body diagrams, and friction).",
    duration_minutes: 45,
    is_published: true,
    created_by_id: "usr-teacher-anita",
    created_at: "2026-09-05T09:00:00+05:30",
    is_deleted: false,
  },
  {
    id: "quiz-chem10-1",
    class_id: "cls-chem10-anita",
    title: "Periodic Trends Quiz",
    description: "Atomic radius, ionization energy, and electronegativity.",
    duration_minutes: 25,
    is_published: false, // draft -- students don't see it
    created_by_id: "usr-teacher-anita",
    created_at: "2026-09-02T09:00:00+05:30",
    is_deleted: false,
  },
];

// ---------- questions + choices ------------------------------------------
// Each question belongs to a quiz. `order` controls display order.
// `marks` is the score awarded for a correct answer (defaults to 1).

let questions = [
  // quiz-phy10-1 -- Motion Basics
  {
    id: "q-motion-1",
    quiz_id: "quiz-phy10-1",
    order: 1,
    text: "What is the SI unit of acceleration?",
    marks: 1,
    is_deleted: false,
  },
  {
    id: "q-motion-2",
    quiz_id: "quiz-phy10-1",
    order: 2,
    text: "A car travels 100 m in 5 s. What is its average speed?",
    marks: 1,
    is_deleted: false,
  },
  {
    id: "q-motion-3",
    quiz_id: "quiz-phy10-1",
    order: 3,
    text: "Which of the following is a vector quantity?",
    marks: 1,
    is_deleted: false,
  },

  // quiz-phy10-2 -- Newton's Laws
  {
    id: "q-newton-1",
    quiz_id: "quiz-phy10-2",
    order: 1,
    text: "Newton's First Law is also known as the law of:",
    marks: 1,
    is_deleted: false,
  },
  {
    id: "q-newton-2",
    quiz_id: "quiz-phy10-2",
    order: 2,
    text: "The SI unit of force is:",
    marks: 1,
    is_deleted: false,
  },
  {
    id: "q-newton-3",
    quiz_id: "quiz-phy10-2",
    order: 3,
    text: "For every action there is an equal and opposite reaction. This is Newton's:",
    marks: 1,
    is_deleted: false,
  },
  {
    id: "q-newton-4",
    quiz_id: "quiz-phy10-2",
    order: 4,
    text: "Which of these is a contact force?",
    marks: 1,
    is_deleted: false,
  },
];

let choices = [
  // q-motion-1
  { id: "c-m1-a", question_id: "q-motion-1", text: "m/s", is_correct: false },
  { id: "c-m1-b", question_id: "q-motion-1", text: "m/s²", is_correct: true },
  { id: "c-m1-c", question_id: "q-motion-1", text: "m", is_correct: false },
  { id: "c-m1-d", question_id: "q-motion-1", text: "kg·m/s", is_correct: false },

  // q-motion-2
  { id: "c-m2-a", question_id: "q-motion-2", text: "10 m/s", is_correct: false },
  { id: "c-m2-b", question_id: "q-motion-2", text: "20 m/s", is_correct: true },
  { id: "c-m2-c", question_id: "q-motion-2", text: "50 m/s", is_correct: false },
  { id: "c-m2-d", question_id: "q-motion-2", text: "500 m/s", is_correct: false },

  // q-motion-3
  { id: "c-m3-a", question_id: "q-motion-3", text: "Mass", is_correct: false },
  { id: "c-m3-b", question_id: "q-motion-3", text: "Temperature", is_correct: false },
  { id: "c-m3-c", question_id: "q-motion-3", text: "Velocity", is_correct: true },
  { id: "c-m3-d", question_id: "q-motion-3", text: "Time", is_correct: false },

  // q-newton-1
  { id: "c-n1-a", question_id: "q-newton-1", text: "Inertia", is_correct: true },
  { id: "c-n1-b", question_id: "q-newton-1", text: "Acceleration", is_correct: false },
  { id: "c-n1-c", question_id: "q-newton-1", text: "Action-reaction", is_correct: false },
  { id: "c-n1-d", question_id: "q-newton-1", text: "Gravitation", is_correct: false },

  // q-newton-2
  { id: "c-n2-a", question_id: "q-newton-2", text: "Joule", is_correct: false },
  { id: "c-n2-b", question_id: "q-newton-2", text: "Watt", is_correct: false },
  { id: "c-n2-c", question_id: "q-newton-2", text: "Newton", is_correct: true },
  { id: "c-n2-d", question_id: "q-newton-2", text: "Pascal", is_correct: false },

  // q-newton-3
  { id: "c-n3-a", question_id: "q-newton-3", text: "First Law", is_correct: false },
  { id: "c-n3-b", question_id: "q-newton-3", text: "Second Law", is_correct: false },
  { id: "c-n3-c", question_id: "q-newton-3", text: "Third Law", is_correct: true },
  { id: "c-n3-d", question_id: "q-newton-3", text: "Law of Gravitation", is_correct: false },

  // q-newton-4
  { id: "c-n4-a", question_id: "q-newton-4", text: "Gravity", is_correct: false },
  { id: "c-n4-b", question_id: "q-newton-4", text: "Friction", is_correct: true },
  { id: "c-n4-c", question_id: "q-newton-4", text: "Magnetic force", is_correct: false },
  { id: "c-n4-d", question_id: "q-newton-4", text: "Electrostatic force", is_correct: false },
];

// ---------- submissions ---------------------------------------------------
// A submission holds one answer per question. `answer_ids` for MCQs is the
// single choice id the student selected (kept as an array so the shape
// generalizes to multi-select later without a schema change).

let submissions = [
  {
    id: "sub-rahul-phy10-2",
    quiz_id: "quiz-phy10-2",
    student_id: "usr-student-rahul",
    submitted_at: "2026-09-12T11:30:00+05:30",
    score: 2,
    total_marks: 4,
    answers: [
      { question_id: "q-newton-1", answer_ids: ["c-n1-a"], is_correct: true },
      { question_id: "q-newton-2", answer_ids: ["c-n2-a"], is_correct: false },
      { question_id: "q-newton-3", answer_ids: ["c-n3-c"], is_correct: true },
      { question_id: "q-newton-4", answer_ids: ["c-n4-a"], is_correct: false },
    ],
  },
];

// ---------- reads ---------------------------------------------------------

export function quizzesForClass(classId, { onlyPublished = false } = {}) {
  return quizzes.filter(
    (q) => q.class_id === classId && !q.is_deleted && (!onlyPublished || q.is_published)
  );
}

export function findQuizById(id) {
  return quizzes.find((q) => q.id === id && !q.is_deleted);
}

export function questionsForQuiz(quizId) {
  return questions
    .filter((q) => q.quiz_id === quizId && !q.is_deleted)
    .sort((a, b) => a.order - b.order);
}

export function choicesForQuestion(questionId) {
  return choices.filter((c) => c.question_id === questionId);
}

export function findSubmissionById(id) {
  return submissions.find((s) => s.id === id);
}

export function findSubmissionForStudent(quizId, studentId) {
  return submissions.find((s) => s.quiz_id === quizId && s.student_id === studentId);
}

// ---------- writes --------------------------------------------------------

export function addQuiz({ classId, title, description, durationMinutes, createdById }) {
  const quiz = {
    id: `quiz-${Math.random().toString(36).slice(2, 10)}`,
    class_id: classId,
    title,
    description: description || "",
    duration_minutes: durationMinutes,
    is_published: false,
    created_by_id: createdById,
    created_at: new Date().toISOString(),
    is_deleted: false,
  };
  quizzes.push(quiz);
  return quiz;
}

export function updateQuiz(id, patch) {
  const quiz = quizzes.find((q) => q.id === id);
  if (!quiz) return null;
  Object.assign(quiz, patch);
  return quiz;
}

export function softDeleteQuiz(id) {
  const quiz = quizzes.find((q) => q.id === id);
  if (!quiz) return false;
  quiz.is_deleted = true;
  return true;
}

export function addQuestion({ quizId, text, marks, choicesData }) {
  const existing = questionsForQuiz(quizId);
  const nextOrder = existing.length > 0 ? existing[existing.length - 1].order + 1 : 1;

  const question = {
    id: `q-${Math.random().toString(36).slice(2, 10)}`,
    quiz_id: quizId,
    order: nextOrder,
    text,
    marks,
    is_deleted: false,
  };
  questions.push(question);

  const newChoices = choicesData.map((c, idx) => ({
    id: `c-${Math.random().toString(36).slice(2, 8)}-${idx}`,
    question_id: question.id,
    text: c.text,
    is_correct: !!c.is_correct,
  }));
  choices.push(...newChoices);

  return { question, choices: newChoices };
}

export function updateQuestion(id, { text, marks, choicesData }) {
  const question = questions.find((q) => q.id === id);
  if (!question) return null;

  if (text !== undefined) question.text = text;
  if (marks !== undefined) question.marks = marks;

  if (Array.isArray(choicesData)) {
    // Replace all choices for this question -- simpler than diffing, and
    // matches the API contract (the frontend always sends the full choice
    // list on update).
    choices = choices.filter((c) => c.question_id !== id);
    const fresh = choicesData.map((c, idx) => ({
      id: c.id || `c-${Math.random().toString(36).slice(2, 8)}-${idx}`,
      question_id: id,
      text: c.text,
      is_correct: !!c.is_correct,
    }));
    choices.push(...fresh);
  }

  return question;
}

export function softDeleteQuestion(id) {
  const question = questions.find((q) => q.id === id);
  if (!question) return false;
  question.is_deleted = true;
  return true;
}

// Student submits answers. `answersByQuestionId` is { [questionId]: [choiceId] }.
// Auto-grades MCQs: a question is correct iff the selected choice set equals
// the correct choice set for that question.
export function createSubmission({ quizId, studentId, answersByQuestionId }) {
  const quizQuestions = questionsForQuiz(quizId);

  let score = 0;
  let totalMarks = 0;

  const answers = quizQuestions.map((q) => {
    const correctChoiceIds = choicesForQuestion(q.id)
      .filter((c) => c.is_correct)
      .map((c) => c.id);
    const selected = answersByQuestionId[q.id] || [];
    const isCorrect =
      selected.length === correctChoiceIds.length &&
      selected.every((id) => correctChoiceIds.includes(id));

    totalMarks += q.marks;
    if (isCorrect) score += q.marks;

    return { question_id: q.id, answer_ids: selected, is_correct: isCorrect };
  });

  const submission = {
    id: `sub-${Math.random().toString(36).slice(2, 10)}`,
    quiz_id: quizId,
    student_id: studentId,
    submitted_at: new Date().toISOString(),
    score,
    total_marks: totalMarks,
    answers,
  };
  submissions.push(submission);
  return submission;
}

// ---------- serializers ---------------------------------------------------

export function serializeQuiz(quiz, { includeQuestions = false } = {}) {
  const base = {
    id: quiz.id,
    class_id: quiz.class_id,
    title: quiz.title,
    description: quiz.description,
    duration_minutes: quiz.duration_minutes,
    is_published: quiz.is_published,
    created_at: quiz.created_at,
    question_count: questionsForQuiz(quiz.id).length,
    total_marks: questionsForQuiz(quiz.id).reduce((sum, q) => sum + q.marks, 0),
  };
  if (includeQuestions) base.questions = questionsForQuiz(quiz.id).map(serializeQuestion);
  return base;
}

export function serializeQuestion(question) {
  return {
    id: question.id,
    quiz_id: question.quiz_id,
    order: question.order,
    text: question.text,
    marks: question.marks,
    choices: choicesForQuestion(question.id).map(serializeChoice),
  };
}

export function serializeChoice(choice) {
  return {
    id: choice.id,
    text: choice.text,
    // NOTE: is_correct IS included in the payload for teacher views. For
    // the student take-quiz flow, examsHandlers.js strips it via a
    // dedicated serializer (see student-facing GET /quizzes/:id/ below).
    is_correct: choice.is_correct,
  };
}

export function serializeSubmission(submission) {
  return {
    id: submission.id,
    quiz_id: submission.quiz_id,
    student_id: submission.student_id,
    submitted_at: submission.submitted_at,
    score: submission.score,
    total_marks: submission.total_marks,
    answers: submission.answers,
  };
}
