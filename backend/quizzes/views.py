from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai_service import extract_pdf_text, generate_quiz_from_text
from .models import Quiz
from .serializers import (
    GenerateFromPdfSerializer,
    QuizReadSerializer,
    QuizWriteSerializer,
)


class QuizViewSet(viewsets.ModelViewSet):
    """
    Teacher-scoped CRUD for quizzes.

    GET    /api/v1/quizzes/                 list (own quizzes)
    POST   /api/v1/quizzes/                 create (with nested questions/choices)
    GET    /api/v1/quizzes/<id>/            detail
    PUT    /api/v1/quizzes/<id>/            full update
    PATCH  /api/v1/quizzes/<id>/            partial update
    DELETE /api/v1/quizzes/<id>/            delete
    POST   /api/v1/quizzes/<id>/publish/    flip is_published=True
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
    """
    POST /api/v1/quizzes/generate-from-pdf/
    multipart/form-data:
      - pdf: file
      - class_course: uuid
      - title: string
      - duration_minutes: int
      - passing_score: int
      - question_count: int
      - difficulty: easy|medium|hard|mixed
    Returns {"title": ..., "questions": [...]} — NOT saved to DB.
    Teacher reviews + edits, then POSTs to /api/v1/quizzes/ to save.
    """
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
            raw = pdf.read()
            text = extract_pdf_text(raw)
        except Exception as exc:
            raise ValidationError({"pdf": f"Could not read PDF: {exc}"})

        if not text or len(text) < 50:
            raise ValidationError({
                "pdf": "PDF has too little extractable text. Use a text-based PDF (not scanned images)."
            })

        questions = generate_quiz_from_text(
            text=text,
            question_count=data["question_count"],
            difficulty=data["difficulty"],
            title=data["title"],
        )

        return Response({
            "title": data["title"],
            "class_course": str(cls.id),
            "duration_minutes": data["duration_minutes"],
            "passing_score": data["passing_score"],
            "difficulty": data["difficulty"],
            "source_filename": pdf.name,
            "questions": [
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
            ],
        }, status=status.HTTP_200_OK)


class StudentQuizListView(APIView):
    """
    GET /api/v1/student/quizzes/
    Returns published quizzes for the requesting student's active enrollments.
    """
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
