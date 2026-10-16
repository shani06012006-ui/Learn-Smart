import uuid

from django.db import models

from core.models import TimeStampedModel


class Quiz(TimeStampedModel):
    DIFFICULTY_EASY = "easy"
    DIFFICULTY_MEDIUM = "medium"
    DIFFICULTY_HARD = "hard"
    DIFFICULTY_MIXED = "mixed"
    DIFFICULTY_CHOICES = [
        (DIFFICULTY_EASY, "Easy"),
        (DIFFICULTY_MEDIUM, "Medium"),
        (DIFFICULTY_HARD, "Hard"),
        (DIFFICULTY_MIXED, "Mixed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    class_course = models.ForeignKey(
        "classes.ClassCourse",
        on_delete=models.CASCADE,
        related_name="quizzes",
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "teacher"},
        related_name="quizzes_created",
    )
    institution = models.ForeignKey(
        "institutions.Institution",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
    )
    duration_minutes = models.PositiveIntegerField(default=30)
    total_marks = models.PositiveIntegerField(default=0)
    passing_score = models.PositiveIntegerField(default=60)
    difficulty = models.CharField(
        max_length=10, choices=DIFFICULTY_CHOICES, default=DIFFICULTY_MIXED
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    source_filename = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["teacher"]),
            models.Index(fields=["class_course"]),
            models.Index(fields=["is_published"]),
        ]

    def __str__(self):
        return self.title

    def recompute_total_marks(self):
        total = sum(q.points for q in self.questions.all())
        if total != self.total_marks:
            self.total_marks = total
            self.save(update_fields=["total_marks", "updated_at"])


class Question(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    explanation = models.TextField(blank=True)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "created_at"]
        indexes = [models.Index(fields=["quiz", "order"])]

    def __str__(self):
        return self.question_text[:60]


class Choice(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="choices"
    )
    choice_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "created_at"]
        indexes = [models.Index(fields=["question", "order"])]

    def __str__(self):
        return self.choice_text[:60]
    
class QuizAttempt(TimeStampedModel):
    """
    One student's attempt at one quiz.
    unique_together enforces "one attempt only" per student per quiz.
    """
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_SUBMITTED = "submitted"
    STATUS_CHOICES = [
        (STATUS_IN_PROGRESS, "In progress"),
        (STATUS_SUBMITTED, "Submitted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name="attempts"
    )
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        limit_choices_to={"role": "student"},
        related_name="quiz_attempts",
    )
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.PositiveIntegerField(default=0)
    max_score = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_PROGRESS
    )

    class Meta:
        ordering = ["-started_at"]
        unique_together = [("quiz", "student")]
        indexes = [
            models.Index(fields=["quiz", "student"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.student_id} → {self.quiz.title} ({self.status})"

    @property
    def percentage(self):
        if not self.max_score:
            return 0
        return round((self.score / self.max_score) * 100, 1)

    @property
    def passed(self):
        return self.percentage >= (self.quiz.passing_score or 0)


class AttemptAnswer(TimeStampedModel):
    """One answer row per question, per attempt."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="attempt_answers"
    )
    choice = models.ForeignKey(
        Choice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attempt_answers",
    )
    is_correct = models.BooleanField(default=False)
    points_awarded = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [("attempt", "question")]
        indexes = [models.Index(fields=["attempt", "question"])]

    def __str__(self):
        return f"{self.attempt_id} · {self.question_id}"    