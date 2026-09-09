# backend/apps/ai/views.py

import PyPDF2
from PIL import Image
import pytesseract

from django.shortcuts import get_object_or_404
from django.db.models import Avg
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser

from apps.exams.models import ExamAttempt, Question
from apps.classes.models import Class

from .services import AIService

User = get_user_model()
ai_service = AIService()


class GenerateQuestionsView(APIView):
    """Generate questions using AI from text, PDF, or image"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can generate questions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        text = request.data.get('text', '')
        file = request.FILES.get('file')
        
        if file:
            if file.name.endswith('.pdf'):
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text()
            elif file.name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                image = Image.open(file)
                text += pytesseract.image_to_string(image)
            else:
                try:
                    text += file.read().decode('utf-8')
                except Exception:
                    pass
        
        if not text:
            return Response(
                {'error': 'No text provided to generate questions'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question_type = request.data.get('question_type', 'mcq')
        difficulty = request.data.get('difficulty', 'medium')
        count = int(request.data.get('count', 5))
        
        questions = ai_service.generate_questions(
            text=text,
            question_type=question_type,
            difficulty=difficulty,
            count=count
        )
        
        return Response({
            'questions': questions,
            'message': f'Generated {len(questions)} questions'
        })


class GradeAnswerView(APIView):
    """Grade an answer using AI"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, question_id):
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can grade answers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        question = get_object_or_404(Question, id=question_id)
        student_answer_text = request.data.get('answer_text', '')
        
        if not student_answer_text:
            return Response(
                {'error': 'No answer provided to grade'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = ai_service.grade_descriptive_answer(
            question_text=question.question_text,
            expected_answer=question.correct_answer,
            student_answer=student_answer_text,
            max_marks=question.marks
        )
        
        return Response(result)


class AnalyzePerformanceView(APIView):
    """Analyze student performance using AI"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, student_id):
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can analyze performance'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student = get_object_or_404(User, id=student_id, user_type='student')
        
        attempts = ExamAttempt.objects.filter(student=student)
        
        student_data = {
            'student_id': str(student.id),
            'student_name': student.get_full_name(),
            'total_exams': attempts.count(),
            'completed_exams': attempts.filter(status='completed').count(),
            'average_score': attempts.aggregate(Avg('total_marks_obtained'))['total_marks_obtained__avg'] or 0,
            'exam_history': []
        }
        
        for attempt in attempts[:10]:
            exam_data = {
                'exam_title': attempt.exam.title,
                'score': attempt.total_marks_obtained,
                'total_marks': attempt.exam.total_marks,
                'date': attempt.created_at.isoformat(),
                'status': attempt.status
            }
            student_data['exam_history'].append(exam_data)
        
        analysis = ai_service.analyze_student_performance(student_data)
        
        return Response({
            'student': {
                'id': str(student.id),
                'name': student.get_full_name(),
                'email': student.email
            },
            'analysis': analysis
        })


class GeneratePracticeQuestionsView(APIView):
    """Generate personalized practice questions for a student"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type != 'teacher':
            return Response(
                {'error': 'Only teachers can generate practice questions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        weak_topics = request.data.get('weak_topics', [])
        difficulty = request.data.get('difficulty', 'medium')
        
        if not weak_topics:
            return Response(
                {'error': 'No weak topics provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        questions = ai_service.generate_practice_questions(
            weak_topics=weak_topics,
            difficulty=difficulty
        )
        
        return Response({
            'questions': questions,
            'message': f'Generated {len(questions)} practice questions'
        })