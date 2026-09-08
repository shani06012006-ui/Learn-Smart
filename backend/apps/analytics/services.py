# backend/apps/analytics/services.py

from datetime import timedelta

from django.db.models import Avg, Sum
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.classes.models import Class, Enrollment
from apps.exams.models import Exam, ExamAttempt

User = get_user_model()


class AnalyticsService:
    """Service for generating analytics data"""
    
    def __init__(self, teacher_id=None, class_id=None):
        self.teacher_id = teacher_id
        self.class_id = class_id
    
    def get_class_performance_summary(self):
        """Get overall class performance summary"""
        if not self.class_id:
            return {}
        
        enrollments = Enrollment.objects.filter(
            class_obj_id=self.class_id,
            is_active=True
        )
        
        total_students = enrollments.count()
        online_students = enrollments.filter(student__is_online=True).count()
        
        exams = Exam.objects.filter(class_obj_id=self.class_id)
        total_exams = exams.count()
        published_exams = exams.filter(is_published=True).count()
        
        attempts = ExamAttempt.objects.filter(
            exam__class_obj_id=self.class_id,
            status='completed'
        )
        
        avg_score = attempts.aggregate(Avg('total_marks_obtained'))['total_marks_obtained__avg'] or 0
        
        return {
            'total_students': total_students,
            'online_students': online_students,
            'total_exams': total_exams,
            'published_exams': published_exams,
            'average_score': avg_score,
            'completion_rate': (attempts.count() / (total_exams * total_students) * 100) if total_exams > 0 else 0
        }
    
    def get_student_performance_analytics(self):
        """Get detailed analytics for each student"""
        if not self.class_id:
            return []
        
        students = User.objects.filter(
            enrollments__class_obj_id=self.class_id,
            enrollments__is_active=True
        ).distinct()
        
        result = []
        for student in students:
            attempts = ExamAttempt.objects.filter(
                student=student,
                exam__class_obj_id=self.class_id,
                status='completed'
            )
            
            total_attempts = attempts.count()
            if total_attempts == 0:
                continue
            
            avg_score = attempts.aggregate(Avg('total_marks_obtained'))['total_marks_obtained__avg'] or 0
            total_marks = attempts.aggregate(Sum('total_marks_obtained'))['total_marks_obtained__sum'] or 0
            
            if avg_score >= 90:
                level = 'excellent'
            elif avg_score >= 75:
                level = 'very_good'
            elif avg_score >= 50:
                level = 'average'
            else:
                level = 'needs_improvement'
            
            result.append({
                'student': {
                    'id': str(student.id),
                    'name': student.get_full_name() or student.username,
                    'email': student.email
                },
                'total_attempts': total_attempts,
                'average_score': avg_score,
                'total_marks_obtained': total_marks,
                'performance_level': level,
                'is_online': student.is_online
            })
        
        result.sort(key=lambda x: x['average_score'], reverse=True)
        return result
    
    def get_topic_analytics(self):
        """Get analytics by topic/subject"""
        if not self.class_id:
            return []
        
        exams = Exam.objects.filter(class_obj_id=self.class_id)
        topics = {}
        
        for exam in exams:
            topic = exam.subject or 'General'
            if topic not in topics:
                topics[topic] = {
                    'topic': topic,
                    'total_exams': 0,
                    'total_attempts': 0,
                    'average_score': 0,
                    'total_students': set()
                }
            
            attempts = ExamAttempt.objects.filter(
                exam=exam,
                status='completed'
            )
            
            topics[topic]['total_exams'] += 1
            topics[topic]['total_attempts'] += attempts.count()
            for attempt in attempts:
                topics[topic]['total_students'].add(attempt.student.id)
            
            avg = attempts.aggregate(Avg('total_marks_obtained'))['total_marks_obtained__avg'] or 0
            topics[topic]['average_score'] = (topics[topic]['average_score'] + avg) / 2
        
        for topic in topics.values():
            topic['total_students'] = len(topic['total_students'])
        
        return list(topics.values())
    
    def get_recent_activity(self, days=7):
        """Get recent activity in the class"""
        if not self.class_id:
            return []
        
        cutoff = timezone.now() - timedelta(days=days)
        
        attempts = ExamAttempt.objects.filter(
            exam__class_obj_id=self.class_id,
            created_at__gte=cutoff
        ).select_related('student', 'exam')
        
        activities = []
        for attempt in attempts:
            activities.append({
                'type': 'exam_submission',
                'student': attempt.student.get_full_name() or attempt.student.username,
                'exam': attempt.exam.title,
                'score': attempt.total_marks_obtained,
                'timestamp': attempt.created_at
            })
        
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return activities[:20]
    
    def get_performance_trends(self):
        """Get performance trends over time"""
        if not self.class_id:
            return []
        
        exams = Exam.objects.filter(class_obj_id=self.class_id)
        trends = []
        
        for exam in exams:
            attempts = ExamAttempt.objects.filter(
                exam=exam,
                status='completed'
            )
            
            if attempts.count() > 0:
                avg_score = attempts.aggregate(Avg('total_marks_obtained'))['total_marks_obtained__avg'] or 0
                trends.append({
                    'date': exam.created_at.date(),
                    'exam_title': exam.title,
                    'average_score': avg_score,
                    'total_students': attempts.count()
                })
        
        trends.sort(key=lambda x: x['date'])
        return trends