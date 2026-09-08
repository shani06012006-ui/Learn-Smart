# backend/apps/analytics/views.py

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.classes.models import Class

from .services import AnalyticsService


class ClassAnalyticsView(APIView):
    """Get analytics for a specific class"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, class_id):
        class_obj = get_object_or_404(Class, id=class_id)
        
        if request.user != class_obj.teacher:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        service = AnalyticsService(class_id=class_id)
        
        data = {
            'summary': service.get_class_performance_summary(),
            'students': service.get_student_performance_analytics(),
            'topics': service.get_topic_analytics(),
            'recent_activity': service.get_recent_activity(),
            'trends': service.get_performance_trends()
        }
        
        return Response(data)


class TeacherDashboardAnalyticsView(APIView):
    """Get analytics for the teacher's dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_teacher:
            return Response(
                {'error': 'Only teachers can view this'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        classes = Class.objects.filter(teacher=request.user)
        
        data = {
            'total_classes': classes.count(),
            'total_students': 0,
            'total_exams': 0,
            'classes': []
        }
        
        for class_obj in classes:
            service = AnalyticsService(class_id=class_obj.id)
            summary = service.get_class_performance_summary()
            
            data['total_students'] += summary.get('total_students', 0)
            data['total_exams'] += summary.get('total_exams', 0)
            
            data['classes'].append({
                'id': str(class_obj.id),
                'name': class_obj.name,
                'subject': class_obj.subject,
                'students': summary.get('total_students', 0),
                'average_score': summary.get('average_score', 0),
                'completion_rate': summary.get('completion_rate', 0)
            })
        
        return Response(data)