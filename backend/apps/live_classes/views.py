# backend/apps/live_classes/views.py

import random
import string

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.classes.models import Class

from .models import LiveClass, LiveClassAttendance
from .serializers import LiveClassAttendanceSerializer, LiveClassSerializer


class LiveClassListCreateView(generics.ListCreateAPIView):
    """List live classes for a class or create new one"""
    serializer_class = LiveClassSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        class_id = self.kwargs['class_id']
        user = self.request.user
        
        queryset = LiveClass.objects.filter(class_obj_id=class_id)
        
        if user.is_student:
            from datetime import timedelta
            queryset = queryset.filter(
                start_time__gte=timezone.now() - timedelta(hours=1)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        class_obj = get_object_or_404(Class, id=self.kwargs['class_id'])
        
        if not self.request.user.is_teacher:
            raise permissions.PermissionDenied("Only teachers can create live classes")
        
        meeting_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        meeting_password = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        serializer.save(
            class_obj=class_obj,
            created_by=self.request.user,
            meeting_id=meeting_id,
            meeting_password=meeting_password
        )


class LiveClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a live class"""
    queryset = LiveClass.objects.all()
    serializer_class = LiveClassSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'


class JoinLiveClassView(APIView):
    """Join a live class"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, class_id):
        live_class = get_object_or_404(LiveClass, id=class_id)
        
        if not live_class.is_active:
            return Response(
                {'error': 'Live class is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request.user.is_student:
            is_enrolled = request.user.enrollments.filter(
                class_obj=live_class.class_obj,
                is_active=True
            ).exists()
            
            if not is_enrolled:
                return Response(
                    {'error': 'You are not enrolled in this class'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        attendance, created = LiveClassAttendance.objects.get_or_create(
            live_class=live_class,
            student=request.user
        )
        
        if not created and not attendance.left_at:
            return Response({
                'message': 'Already joined',
                'meeting_link': live_class.meeting_link,
                'meeting_id': live_class.meeting_id,
                'meeting_password': live_class.meeting_password
            })
        
        return Response({
            'message': 'Joined successfully',
            'meeting_link': live_class.meeting_link,
            'meeting_id': live_class.meeting_id,
            'meeting_password': live_class.meeting_password
        })


class LeaveLiveClassView(APIView):
    """Leave a live class"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, class_id):
        live_class = get_object_or_404(LiveClass, id=class_id)
        
        attendance = get_object_or_404(
            LiveClassAttendance,
            live_class=live_class,
            student=request.user
        )
        
        if not attendance.left_at:
            attendance.left_at = timezone.now()
            attendance.duration_seconds = (
                attendance.left_at - attendance.joined_at
            ).total_seconds()
            attendance.save()
        
        return Response({'message': 'Left successfully'})