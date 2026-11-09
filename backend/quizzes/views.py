# backend/quizzes/views.py
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .ai_service import AIServiceError, extract_pdf_text, generate_quiz_from_text
from .models import AttemptAnswer, Choice, Question, Quiz, QuizAttempt
from .serializers import (
    GenerateFromPdfSerializer,
    QuizReadSerializer,
    QuizWriteSerializer, 
    StudentQuizTakeSerializer, 
    QuizAttemptSerializer
)
from notifications.service import notify 


class QuizViewSet(viewsets.ModelViewSet):
    """
    Teacher-scoped CRUD for quizzes.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        qs = Quiz.objects.select_related("class_course", "teacher").prefetch_related(
            "questions__choices"
        )

        role = getattr(user, "role", None)
        if role == "teacher":
            qs = qs.filter(teacher=user)
        elif role == "admin" or user.is_superuser:
            inst = getattr(user, "institution", None)
            if inst is not None:
                qs = qs.filter(institution=inst)
        else:
            return Quiz.objects.none()

        class_id = self.request.query_params.get("class_course")
        if class_id:
            qs = qs.filter(class_course_id=class_id)

        grade_id = self.request.query_params.get("grade")
        if grade_id:
            qs = qs.filter(class_course__grade_id=grade_id)

        status_param = self.request.query_params.get("status")
        if status_param == "published":
            qs = qs.filter(is_published=True)
        elif status_param == "draft":
            qs = qs.filter(is_published=False)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(title__icontains=q)

        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return QuizReadSerializer
        return QuizWriteSerializer

    def perform_create(self, serializer):
        if getattr(self.request.user, "role", None) != "teacher":
            raise PermissionDenied("Only teachers can create quizzes.")
        serializer.save()

    def create(self, request, *args, **kwargs):
        write = self.get_serializer(data=request.data)
        write.is_valid(raise_exception=True)
        write.save()
        read = QuizReadSerializer(write.instance, context={"request": request})
        return Response(read.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        write = QuizWriteSerializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        write.is_valid(raise_exception=True)
        write.save()
        return Response(QuizReadSerializer(instance, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        quiz = self.get_object()
        if quiz.questions.count() == 0:
            raise ValidationError({"detail": "Add at least one question before publishing."})
        if not quiz.is_published:
            quiz.is_published = True
            quiz.published_at = timezone.now()
            quiz.save(update_fields=["is_published", "published_at", "updated_at"])
        return Response(QuizReadSerializer(quiz, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk=None):
        quiz = self.get_object()
        if quiz.is_published:
            quiz.is_published = False
            quiz.published_at = None
            quiz.save(update_fields=["is_published", "published_at", "updated_at"])
        return Response(QuizReadSerializer(quiz, context={"request": request}).data)


class GenerateFromPdfView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if getattr(request.user, "role", None) != "teacher":
            raise PermissionDenied("Only teachers can generate quizzes.")

        ser = GenerateFromPdfSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        cls = data["class_course"]
        if cls.teacher_id != request.user.id:
            raise PermissionDenied("You can only generate quizzes for your own classes.")

        pdf = data["pdf"]
        if not pdf.name.lower().endswith(".pdf"):
            raise ValidationError({"pdf": "Only .pdf files are accepted."})

        try:
            text = extract_pdf_text(pdf.read())
        except AIServiceError as exc:
            raise ValidationError({"pdf": str(exc)})

        if len(text) < 50:
            raise ValidationError({
                "pdf": "PDF has too little extractable text. Use a text-based PDF, not a scanned image."
            })

        try:
            questions = generate_quiz_from_text(
                text=text,
                question_count=data["question_count"],
                difficulty=data["difficulty"],
                title=data["title"],
            )
        except AIServiceError as exc:
            # Real, specific error message instead of fake questions
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        formatted_questions = [
            {
                "question_text": q["question"],
                "explanation": q["explanation"],
                "points": 1,
                "choices": [
                    {"choice_text": c["text"], "is_correct": c["is_correct"]}
                    for c in q["choices"]
                ],
            }
            for q in questions
        ]

        return Response(
            {
                "title": data["title"],
                "class_course": str(cls.id),
                "duration_minutes": data["duration_minutes"],
                "passing_score": data["passing_score"],
                "difficulty": data["difficulty"],
                "source_filename": pdf.name,
                "questions": formatted_questions,
            },
            status=status.HTTP_200_OK,
        )


# ===============================================================
# Student quiz-taking endpoints (Unchanged)
# ===============================================================

def _is_student(user):
    return getattr(user, "role", None) == "student"


def _student_can_access_quiz(student, quiz):
    return quiz.class_course.enrollments.filter(
        student=student, status="active"
    ).exists()


class StudentQuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, "role", None) != "student":
            return Response(
                {"detail": "Student access only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            Quiz.objects.filter(
                is_published=True,
                class_course__enrollments__student=user,
                class_course__enrollments__status="active",
            )
            .distinct()
            .select_related("class_course", "teacher")
            .order_by("-published_at", "-created_at")
        )

        return Response(
            QuizReadSerializer(qs, many=True, context={"request": request}).data
        )


class StudentStartQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        if not _is_student(request.user):
            return Response({"detail": "Student access only."}, status=403)

        try:
            quiz = Quiz.objects.select_related("class_course").get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=404)

        if not quiz.is_published:
            return Response({"detail": "Quiz is not available yet."}, status=400)

        if not _student_can_access_quiz(request.user, quiz):
            return Response(
                {"detail": "You are not enrolled in this quiz's class."},
                status=403,
            )

        attempt, created = QuizAttempt.objects.get_or_create(
            quiz=quiz, student=request.user
        )

        if attempt.status == QuizAttempt.STATUS_SUBMITTED:
            return Response(
                {"detail": "You have already submitted this quiz.",
                 "attempt_id": str(attempt.id)},
                status=400,
            )

        elapsed = timezone.now() - attempt.started_at
        if elapsed > timedelta(minutes=quiz.duration_minutes):
            attempt.status = QuizAttempt.STATUS_SUBMITTED
            attempt.submitted_at = timezone.now()
            attempt.save(update_fields=["status", "submitted_at", "updated_at"])
            return Response(
                {"detail": "Time is up. Your attempt has been auto-submitted.",
                 "attempt_id": str(attempt.id)},
                status=400,
            )

        seconds_left = max(
            0,
            int(
                (timedelta(minutes=quiz.duration_minutes) - elapsed)
                .total_seconds()
            ),
        )

        return Response({
            "attempt_id": str(attempt.id),
            "started_at": attempt.started_at,
            "seconds_left": seconds_left,
            "quiz": StudentQuizTakeSerializer(quiz, context={"request": request}).data,
        })


class StudentSubmitQuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        if not _is_student(request.user):
            return Response({"detail": "Student access only."}, status=403)

        try:
            quiz = Quiz.objects.select_related("class_course").get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=404)

        try:
            attempt = QuizAttempt.objects.get(quiz=quiz, student=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({"detail": "Attempt not started."}, status=400)

        if attempt.status == QuizAttempt.STATUS_SUBMITTED:
            return Response(
                {"detail": "Already submitted.",
                 "attempt_id": str(attempt.id)},
                status=400,
            )

        answers = request.data.get("answers") or []
        if not isinstance(answers, list):
            return Response({"detail": "answers must be a list."}, status=400)

        questions = list(quiz.questions.prefetch_related("choices"))
        question_by_id = {str(q.id): q for q in questions}
        choice_by_id = {}
        for q in questions:
            for c in q.choices.all():
                choice_by_id[str(c.id)] = c

        total_possible = sum(q.points for q in questions)

        with transaction.atomic():
            attempt.answers.all().delete()
            running_score = 0
            for row in answers:
                qid = str(row.get("question_id", ""))
                cid = row.get("choice_id")
                cid = str(cid) if cid else None
                q = question_by_id.get(qid)
                if not q:
                    continue

                c = choice_by_id.get(cid) if cid else None
                is_correct = bool(c and c.question_id == q.id and c.is_correct)
                points = q.points if is_correct else 0
                running_score += points

                AttemptAnswer.objects.create(
                    attempt=attempt,
                    question=q,
                    choice=c,
                    is_correct=is_correct,
                    points_awarded=points,
                )

            attempt.score = running_score
            attempt.max_score = total_possible
            attempt.status = QuizAttempt.STATUS_SUBMITTED
            attempt.submitted_at = timezone.now()
            attempt.save(
                update_fields=["score", "max_score", "status",
                               "submitted_at", "updated_at"]
            )

        if quiz.teacher_id:
            student_name = request.user.get_full_name() or request.user.email
            notify(
                user_id=quiz.teacher_id,
                title="New Quiz Submission",
                message=f"{student_name} submitted '{quiz.title}'",
                notification_type="quiz_submit",
            )

        return Response(
            QuizAttemptSerializer(attempt, context={"request": request}).data
        )


class StudentQuizAttemptResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        if not _is_student(request.user):
            return Response({"detail": "Student access only."}, status=403)
        try:
            attempt = QuizAttempt.objects.select_related(
                "quiz", "quiz__class_course"
            ).prefetch_related(
                "answers__question__choices", "answers__choice"
            ).get(id=attempt_id, student=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({"detail": "Attempt not found."}, status=404)
        return Response(
            QuizAttemptSerializer(attempt, context={"request": request}).data
        )


class TeacherQuizSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        user = request.user
        try:
            quiz = Quiz.objects.select_related("teacher").get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz not found."}, status=404)

        if not (user.is_superuser
                or getattr(user, "role", None) == "admin"
                or (getattr(user, "role", None) == "teacher"
                    and quiz.teacher_id == user.id)):
            return Response({"detail": "Not your quiz."}, status=403)

        attempts = (
            QuizAttempt.objects.filter(quiz=quiz)
            .select_related("student")
            .order_by("-submitted_at", "-started_at")
        )

        data = []
        for a in attempts:
            data.append({
                "id": str(a.id),
                "student_id": str(a.student_id),
                "student_name": a.student.get_full_name() or a.student.email,
                "student_email": a.student.email,
                "status": a.status,
                "score": a.score,
                "max_score": a.max_score,
                "percentage": a.percentage,
                "passed": a.passed,
                "started_at": a.started_at,
                "submitted_at": a.submitted_at,
            })

        return Response({
            "quiz_id": str(quiz.id),
            "quiz_title": quiz.title,
            "count": len(data),
            "results": data,
        })