from rest_framework import serializers

from classes.models import ClassCourse

from .models import Quiz, Question, Choice, QuizAttempt, AttemptAnswer


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "choice_text", "is_correct", "order"]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "question_text", "explanation", "points", "order", "choices"]
        read_only_fields = ["id"]

    def validate_choices(self, choices):
        if len(choices) != 4:
            raise serializers.ValidationError("Each question must have exactly 4 choices.")
        if sum(1 for c in choices if c.get("is_correct")) != 1:
            raise serializers.ValidationError("Exactly one choice must be marked correct.")
        return choices


class QuizReadSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class_name = serializers.CharField(source="class_course.name", read_only=True)
    class_id = serializers.UUIDField(source="class_course.id", read_only=True)
    question_count = serializers.SerializerMethodField()
    my_attempt = serializers.SerializerMethodField()        

    class Meta:
        model = Quiz
        fields = [
            "id", "title", "class_course", "class_id", "class_name",
            "teacher", "duration_minutes", "total_marks", "passing_score",
            "difficulty", "is_published", "published_at",
            "source_filename", "created_at", "updated_at",
            "questions", "question_count", "my_attempt",
        ]

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_my_attempt(self, obj):                              # NEW
        request = self.context.get("request")
        if not request or getattr(request.user, "role", None) != "student":
            return None
        from .models import QuizAttempt
        att = QuizAttempt.objects.filter(quiz=obj, student=request.user).first()
        if not att:
            return None
        return {
            "id": str(att.id),
            "status": att.status,
            "score": att.score,
            "max_score": att.max_score,
            "percentage": att.percentage,
            "passed": att.passed,
            "submitted_at": att.submitted_at,
        }


class QuizWriteSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)

    class Meta:
        model = Quiz
        fields = [
            "id", "title", "class_course", "duration_minutes",
            "passing_score", "difficulty", "is_published",
            "source_filename", "questions",
        ]
        read_only_fields = ["id", "is_published"]

    def validate_class_course(self, cls):
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) == "teacher":
            if cls.teacher_id != request.user.id:
                raise serializers.ValidationError(
                    "You can only create quizzes for your own classes."
                )
        return cls

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        request = self.context["request"]
        cls = validated_data["class_course"]
        quiz = Quiz.objects.create(
            teacher=request.user,
            institution=getattr(request.user, "institution", None) or cls.institution,
            **validated_data,
        )
        self._sync_questions(quiz, questions_data)
        quiz.recompute_total_marks()
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if questions_data is not None:
            instance.questions.all().delete()
            self._sync_questions(instance, questions_data)
        instance.recompute_total_marks()
        return instance

    @staticmethod
    def _sync_questions(quiz, questions_data):
        for q_idx, q_data in enumerate(questions_data):
            choices_data = q_data.pop("choices", [])
            q_data.setdefault("order", q_idx)
            question = Question.objects.create(quiz=quiz, **q_data)
            for c_idx, c_data in enumerate(choices_data):
                c_data.setdefault("order", c_idx)
                Choice.objects.create(question=question, **c_data)


class GenerateFromPdfSerializer(serializers.Serializer):
    class_course = serializers.PrimaryKeyRelatedField(queryset=ClassCourse.objects.all())
    title = serializers.CharField(max_length=255)
    duration_minutes = serializers.IntegerField(min_value=5, max_value=180, default=30)
    passing_score = serializers.IntegerField(min_value=0, max_value=100, default=60)
    question_count = serializers.IntegerField(min_value=3, max_value=30, default=10)
    difficulty = serializers.ChoiceField(
        choices=Quiz.DIFFICULTY_CHOICES, default=Quiz.DIFFICULTY_MIXED
    )
    pdf = serializers.FileField()
    

# ---------------------------------------------------------------
# Student-side serializers
# ---------------------------------------------------------------

class StudentChoiceSerializer(serializers.ModelSerializer):
    """Choice without is_correct — safe to send during the quiz."""
    class Meta:
        model = Choice
        fields = ["id", "choice_text", "order"]


class StudentQuestionSerializer(serializers.ModelSerializer):
    choices = StudentChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "question_text", "points", "order", "choices"]


class StudentQuizTakeSerializer(serializers.ModelSerializer):
    """Full quiz for taking — correct answers stripped."""
    questions = StudentQuestionSerializer(many=True, read_only=True)
    class_name = serializers.CharField(source="class_course.name", read_only=True)

    class Meta:
        model = Quiz
        fields = [
            "id", "title", "class_name",
            "duration_minutes", "total_marks", "passing_score",
            "difficulty", "published_at", "questions",
        ]


class AttemptAnswerSerializer(serializers.ModelSerializer):
    """Post-submission review row — includes correct answer + explanation."""
    question_id = serializers.UUIDField(source="question.id", read_only=True)
    question_text = serializers.CharField(source="question.question_text", read_only=True)
    explanation = serializers.CharField(source="question.explanation", read_only=True)
    points = serializers.IntegerField(source="question.points", read_only=True)
    chosen_choice_id = serializers.UUIDField(source="choice.id", read_only=True)
    chosen_choice_text = serializers.CharField(source="choice.choice_text", read_only=True)
    correct_choice_id = serializers.SerializerMethodField()
    correct_choice_text = serializers.SerializerMethodField()

    class Meta:
        model = AttemptAnswer
        fields = [
            "id", "question_id", "question_text", "explanation", "points",
            "chosen_choice_id", "chosen_choice_text",
            "correct_choice_id", "correct_choice_text",
            "is_correct", "points_awarded",
        ]

    def get_correct_choice_id(self, obj):
        c = obj.question.choices.filter(is_correct=True).first()
        return str(c.id) if c else None

    def get_correct_choice_text(self, obj):
        c = obj.question.choices.filter(is_correct=True).first()
        return c.choice_text if c else None


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Attempt summary + full answer review (for result page)."""
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    class_name = serializers.CharField(source="quiz.class_course.name", read_only=True)
    percentage = serializers.SerializerMethodField()
    passed = serializers.SerializerMethodField()
    answers = AttemptAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            "id", "quiz", "quiz_title", "class_name",
            "started_at", "submitted_at",
            "score", "max_score", "percentage", "passed",
            "status", "answers",
        ]

    def get_percentage(self, obj):
        return obj.percentage

    def get_passed(self, obj):
        return obj.passed    