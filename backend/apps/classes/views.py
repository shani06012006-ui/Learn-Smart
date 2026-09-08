# backend/apps/classes/views.py

"""
Views (API endpoints) for the classes app.
"""

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Class, Enrollment
from .serializers import (
    ClassSerializer,
    EnrollmentSerializer,
    JoinClassSerializer,
)


class ClassListCreateView(generics.ListCreateAPIView):
    """API endpoint for listing and creating classes."""
    
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_teacher:
            return Class.objects.filter(teacher=user)
        else:
            enrolled_class_ids = Enrollment.objects.filter(
                student=user,
                is_active=True
            ).values_list('class_obj_id', flat=True)
            return Class.objects.filter(id__in=enrolled_class_ids)
    
    def perform_create(self, serializer):
        if not self.request.user.is_teacher:
            raise PermissionError("Only teachers can create classes")
        serializer.save(teacher=self.request.user)


class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API endpoint for retrieving, updating, or deleting a class."""
    
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_teacher:
            return Class.objects.filter(teacher=user)
        else:
            enrolled_class_ids = Enrollment.objects.filter(
                student=user,
                is_active=True
            ).values_list('class_obj_id', flat=True)
            return Class.objects.filter(id__in=enrolled_class_ids)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if instance.teacher != request.user:
            return Response(
                {'error': 'You do not have permission to delete this class.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        return Response(
            {'message': 'Class deleted successfully.'},
            status=status.HTTP_200_OK
        )


class JoinClassView(APIView):
    """API endpoint for a student to join a class using a join code."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_student:
            return Response(
                {'error': 'Only students can join classes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JoinClassSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            class_obj = serializer.context['class_obj']
            
            enrollment = Enrollment.objects.create(
                student=request.user,
                class_obj=class_obj,
                is_active=True,
                is_blocked=False,
            )
            
            return Response(
                {
                    'message': f"Successfully joined {class_obj.name}!",
                    'enrollment': EnrollmentSerializer(enrollment).data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeaveClassView(APIView):
    """API endpoint for a student to leave a class."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, class_id):
        if not request.user.is_student:
            return Response(
                {'error': 'Only students can leave classes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            enrollment = Enrollment.objects.get(
                student=request.user,
                class_obj_id=class_id,
                is_active=True
            )
            
            enrollment.is_active = False
            enrollment.save()
            
            return Response(
                {'message': 'Successfully left the class.'},
                status=status.HTTP_200_OK
            )
            
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'You are not enrolled in this class.'},
                status=status.HTTP_404_NOT_FOUND
            )


class ClassStudentsView(generics.ListAPIView):
    """Get all students enrolled in a specific class."""
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        class_id = self.kwargs.get('class_id')
        class_obj = get_object_or_404(Class, id=class_id)
        
        if self.request.user != class_obj.teacher:
            return Enrollment.objects.none()
        
        return Enrollment.objects.filter(
            class_obj_id=class_id,
            is_active=True
        ).select_related('student')


class StudentStatusView(APIView):
    """Get online/offline status of students in a class."""
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        class_obj = get_object_or_404(Class, id=class_id)
        
        if request.user != class_obj.teacher:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        enrollments = Enrollment.objects.filter(
            class_obj_id=class_id,
            is_active=True
        ).select_related('student')
        
        students_data = []
        for enrollment in enrollments:
            student = enrollment.student
            students_data.append({
                'id': str(student.id),
                'email': student.email,
                'username': student.username,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'is_online': student.is_online,
                'last_activity': student.last_activity,
                'is_blocked': enrollment.is_blocked,
            })
        
        return Response({
            'total': len(students_data),
            'online': sum(1 for s in students_data if s['is_online']),
            'students': students_data
        })


class BlockStudentView(APIView):
    """Block or unblock a student from a class."""
    permission_classes = [IsAuthenticated]

    def post(self, request, class_id, student_id):
        class_obj = get_object_or_404(Class, id=class_id)
        
        if request.user != class_obj.teacher:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            enrollment = Enrollment.objects.get(
                class_obj_id=class_id,
                student_id=student_id,
                is_active=True
            )
            enrollment.is_blocked = not enrollment.is_blocked
            enrollment.save()
            
            status_text = 'blocked' if enrollment.is_blocked else 'unblocked'
            return Response({
                'message': f'Student {status_text} successfully',
                'is_blocked': enrollment.is_blocked
            })
            
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'Student not found in this class'},
                status=status.HTTP_404_NOT_FOUND
            )