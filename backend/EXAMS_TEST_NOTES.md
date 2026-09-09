# Exams Flow — Real Testing Notes

I ran the full exam lifecycle end-to-end with real HTTP requests: register
teacher + student → create class → join class → create exam → add
questions → publish → student starts attempt → answers questions →
submits → views results. Here's what I found.

## Fixed in this pass

### `QuestionSerializer` required a field the view already supplies
`apps/exams/serializers.py` — `QuestionSerializer` used `fields = '__all__'`
without marking `exam` as read-only. Since `QuestionListCreateView.perform_create()`
sets `exam` from the URL automatically, every question creation failed with
`{"exam": ["This field is required."]}`. Fixed by adding `'exam'` to
`read_only_fields`. **Verified**: created two real questions via API after
the fix, both returned `201`.

## Confirmed working (verified with real requests, not just code review)
- Full class flow (register → login → create class → join via code)
- Exam creation (with required `exam_type`, `start_time`, `end_time`)
- Adding questions to an exam
- Publishing an exam (`PATCH is_published: true`)
- Starting an attempt as a student
- Submitting answers via `selected_option` (the array index) — MCQ
  auto-grading correctly matched it against `correct_answer` and scored it
- Submitting the full exam and viewing results

## Two things you should decide before building the frontend exam UI

### 1. MCQ answers must use `selected_option` (an index), not `answer_text`
`SubmitAnswerView`'s auto-grading logic (`apps/exams/views.py` ~line 211)
only grades MCQ/true-false questions when `selected_option` (an integer
index into the question's `options` array) is sent. If the frontend
naturally sends the answer as text (e.g. `"4"` instead of index `1`), the
answer saves fine but **never gets graded** — it silently counts as
"unanswered" even though it was answered. This isn't broken, but it's an
easy trap: make sure whoever builds the exam-taking UI knows to send the
option's array index, not its text.

### 2. Retakes don't actually work — `unique_together` blocks them
`ExamAttempt` has `unique_together = ['student', 'exam']` in
`apps/exams/models.py`, meaning a student can create **exactly one attempt
per exam, ever**, at the database level. But the `Exam` model already has
`allow_retake` and `max_attempts` fields that imply retakes should be
supported. Right now, setting `allow_retake=True` doesn't help — a second
attempt throws a raw `IntegrityError` (500) instead of a clean "no attempts
left" response.

**This needs a decision, not just a fix:**
- If exams should genuinely be one-attempt-only: remove the misleading
  `allow_retake`/`max_attempts` fields (or the frontend that reads them),
  and give `StartExamView` a friendly error instead of a raw 500 when a
  second attempt is tried.
- If retakes should work: remove `unique_together = ['student', 'exam']`
  (needs a migration), and update `StartExamView` to count the student's
  existing attempts against `exam.max_attempts` before creating a new one.

I didn't pick one for you since it changes how the whole grading/analytics
side of the app should behave later (e.g. "best attempt" vs "latest
attempt" vs "average of attempts").

## Not yet tested
- Teacher viewing all student results for an exam (`ExamResultsView` for
  teacher role)
- AI-based grading for short/long answer questions (not built yet —
  `apps/ai` is still a stub)
- Class-level permission checks (e.g. can a student from a *different*
  class start this exam?)
