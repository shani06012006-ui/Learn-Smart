# backend/apps/exams/views.py

import uuid
from datetime import datetime
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser

from .models import Exam, Question, ExamAttempt, StudentAnswer
from .serializers import (
    ExamSerializer, ExamDetailSerializer, QuestionSerializer,
    ExamAttemptSerializer, StudentAnswerSerializer,
    SubmitAnswerSerializer, GradeAnswerSerializer
)
from apps.classes.models import Class

class IsTeacherOrReadOnly(permissions.BasePermission):
    """Custom permission: teachers can edit, students can only view"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_teacher
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'created_by'):
            return request.user == obj.created_by
        return False

class ExamListCreateView(generics.ListCreateAPIView):
    """List all exams for a class or create new exam"""
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        user = self.request.user
        
        queryset = Exam.objects.filter(class_obj_id=class_id)
        
        # Students can only see published exams
        if user.is_student:
            queryset = queryset.filter(is_published=True)
        
        return queryset
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        if not self.request.user.is_teacher:
            raise permissions.PermissionDenied("Only teachers can create exams")
        serializer.save(class_obj=class_obj)

class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete an exam"""
    queryset = Exam.objects.all()
    serializer_class = ExamDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    lookup_field = 'id'

class QuestionListCreateView(generics.ListCreateAPIView):
    """List all questions for an exam or add new question"""
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        exam_id = self.kwargs['exam_id']
        return Question.objects.filter(exam_id=exam_id)
    
    def perform_create(self, serializer):
        exam = get_object_or_404(Exam, id=self.kwargs['exam_id'])
        # Only the teacher who created the exam can add questions
        if self.request.user != exam.created_by:
            raise permissions.PermissionDenied("Only the exam creator can add questions")
        serializer.save(exam=exam)

class StartExamView(APIView):
    """Start an exam attempt for a student"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id)
        
        # Only students can start exams
        if not request.user.is_student:
            return Response(
                {'error': 'Only students can start exams'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if exam is published
        if not exam.is_published:
            return Response(
                {'error': 'Exam is not published yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if exam is within time window
        now = timezone.now()
        if now < exam.start_time:
            return Response(
                {'error': 'Exam has not started yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if now > exam.end_time:
            return Response(
                {'error': 'Exam has ended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if student has already attempted
        existing_attempt = ExamAttempt.objects.filter(
            student=request.user,
            exam=exam,
            status__in=['in_progress', 'completed']
        ).first()
        
        if existing_attempt:
            if existing_attempt.status == 'completed':
                if not exam.allow_retake:
                    return Response(
                        {'error': 'You have already completed this exam'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Return existing in-progress attempt
                return Response({
                    'attempt_id': str(existing_attempt.id),
                    'message': 'Resuming existing attempt'
                })
        
        # Create new attempt
        attempt = ExamAttempt.objects.create(
            student=request.user,
            exam=exam,
            status='in_progress'
        )
        
        # Create empty answer records for all questions
        questions = exam.questions.all()
        for question in questions:
            StudentAnswer.objects.create(
                attempt=attempt,
                question=question
            )
        
        return Response({
            'attempt_id': str(attempt.id),
            'message': 'Exam started successfully'
        }, status=status.HTTP_201_CREATED)

class SubmitAnswerView(APIView):
    """Submit an answer for a question"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser]
    
    def post(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id)
        
        # Verify the student owns this attempt
        if request.user != attempt.student:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if exam is still active
        now = timezone.now()
        if now > attempt.exam.end_time:
            attempt.status = 'expired'
            attempt.save()
            return Response(
                {'error': 'Exam time has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SubmitAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        question_id = serializer.validated_data['question_id']
        answer_text = serializer.validated_data.get('answer_text', '')
        selected_option = serializer.validated_data.get('selected_option')
        time_taken = serializer.validated_data.get('time_taken', 0)
        
        # Get the student answer
        student_answer = get_object_or_404(
            StudentAnswer,
            attempt=attempt,
            question_id=question_id
        )
        
        # Update the answer
        student_answer.answer_text = answer_text
        student_answer.selected_option = selected_option
        student_answer.time_taken_seconds = time_taken
        
        # Auto-grade MCQ and True/False questions
        question = student_answer.question
        if question.question_type in ['mcq', 'true_false']:
            if selected_option is not None:
                # Check if correct (options are 0-indexed)
                correct_option = question.correct_answer
                if isinstance(correct_option, str) and correct_option.isdigit():
                    correct_option = int(correct_option)
                student_answer.is_correct = (selected_option == correct_option)
                student_answer.marks_obtained = question.marks if student_answer.is_correct else 0
        
        student_answer.save()
        
        return Response({
            'message': 'Answer submitted successfully',
            'is_correct': student_answer.is_correct,
            'marks_obtained': student_answer.marks_obtained
        })

class SubmitExamView(APIView):
    """Submit the entire exam"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id)
        
        # Verify the student owns this attempt
        if request.user != attempt.student:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if attempt.status == 'completed':
            return Response(
                {'error': 'Exam already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate results
        answers = attempt.answers.all()
        total_correct = answers.filter(is_correct=True).count()
        total_wrong = answers.filter(is_correct=False).count()
        total_unanswered = answers.filter(
            is_correct__isnull=True
        ).count()
        total_marks = sum(a.marks_obtained for a in answers)
        
        # Update attempt
        attempt.total_correct = total_correct
        attempt.total_wrong = total_wrong
        attempt.total_unanswered = total_unanswered
        attempt.total_marks_obtained = total_marks
        attempt.status = 'completed'
        attempt.end_time = timezone.now()
        attempt.save()
        
        return Response({
            'message': 'Exam submitted successfully',
            'results': {
                'total_marks': total_marks,
                'total_correct': total_correct,
                'total_wrong': total_wrong,
                'total_unanswered': total_unanswered,
                'percentage': (total_marks / attempt.exam.total_marks * 100) if attempt.exam.total_marks > 0 else 0
            }
        })

class ExamResultsView(generics.RetrieveAPIView):
    """Get exam results for a student"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExamAttemptSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        if user.is_teacher:
            # Teachers can see all attempts for their exams
            return ExamAttempt.objects.filter(
                exam__created_by=user
            )
        else:
            # Students can only see their own attempts
            return ExamAttempt.objects.filter(
                student=user
            )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Add answers to the response
        answers = StudentAnswer.objects.filter(attempt=instance)
        data['answers'] = StudentAnswerSerializer(answers, many=True).data
        
        return Response(data)