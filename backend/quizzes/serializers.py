from rest_framework import serializers

from classes.models import ClassCourse

from .models import Quiz, Question, Choice


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

    class Meta:
        model = Quiz
        fields = [
            "id", "title", "class_course", "class_id", "class_name",
            "teacher", "duration_minutes", "total_marks", "passing_score",
            "difficulty", "is_published", "published_at",
            "source_filename", "created_at", "updated_at",
            "questions", "question_count",
        ]

    def get_question_count(self, obj):
        return obj.questions.count()


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