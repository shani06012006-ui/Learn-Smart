# -*- coding: utf-8 -*-
from rest_framework import serializers

from accounts.models import StudentAttendance


class StudentAttendanceReadSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentAttendance
        fields = [
            "id", "student", "student_name", "class_course",
            "date", "status", "note", "source",
            "joined_at", "left_at", "duration_seconds",
            "marked_by", "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        u = obj.student
        if not u:
            return ""
        full = f"{u.first_name or ''} {u.last_name or ''}".strip()
        return full or u.email


class AttendanceMarkItemSerializer(serializers.Serializer):
    student = serializers.UUIDField()
    status = serializers.ChoiceField(choices=[
        StudentAttendance.STATUS_PRESENT,
        StudentAttendance.STATUS_ABSENT,
        StudentAttendance.STATUS_LATE,
        StudentAttendance.STATUS_EXCUSED,
    ])
    note = serializers.CharField(required=False, allow_blank=True, default="")


class AttendanceBulkMarkSerializer(serializers.Serializer):
    klass = serializers.UUIDField()
    date = serializers.DateField()
    records = AttendanceMarkItemSerializer(many=True)
