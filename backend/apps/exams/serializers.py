# backend/apps/exams/serializers.py

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.classes.serializers import ClassSerializer

from .models import Exam, ExamAttempt, Question, StudentAnswer


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions"""
    
    class Meta:
        model = Question
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class ExamSerializer(serializers.ModelSerializer):
    """Serializer for exams"""
    created_by = UserSerializer(read_only=True)
    class_obj = ClassSerializer(read_only=True)
    total_questions = serializers.IntegerField(read_only=True)
    total_attempts = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Exam
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ExamDetailSerializer(ExamSerializer):
    """Detailed exam serializer with questions"""
    questions = QuestionSerializer(many=True, read_only=True)


class ExamAttemptSerializer(serializers.ModelSerializer):
    """Serializer for exam attempts"""
    student = UserSerializer(read_only=True)
    exam = ExamSerializer(read_only=True)
    
    class Meta:
        model = ExamAttempt
        fields = '__all__'
        read_only_fields = ('id', 'start_time', 'created_at', 'updated_at')


class StudentAnswerSerializer(serializers.ModelSerializer):
    """Serializer for student answers"""
    question = QuestionSerializer(read_only=True)
    
    class Meta:
        model = StudentAnswer
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class SubmitAnswerSerializer(serializers.Serializer):
    """Serializer for submitting an answer"""
    question_id = serializers.UUIDField()
    answer_text = serializers.CharField(required=False, allow_blank=True)
    selected_option = serializers.IntegerField(required=False, allow_null=True)
    time_taken = serializers.IntegerField(default=0)


class GradeAnswerSerializer(serializers.Serializer):
    """Serializer for AI grading"""
    question_id = serializers.UUIDField()
    marks_obtained = serializers.FloatField()
    feedback = serializers.CharField(required=False, allow_blank=True)