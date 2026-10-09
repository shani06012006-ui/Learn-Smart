# -*- coding: utf-8 -*-
from rest_framework import serializers

from accounts.models import StudentAttendance


class StudentAttendanceReadSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    roll_number = serializers.SerializerMethodField()
    class_teacher_name = serializers.SerializerMethodField()
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentAttendance
        fields = [
            "id", "student", "student_name", "roll_number",
            "class_course", "grade", "class_teacher_name",
            "date", "status", "note", "source",
            "joined_at", "left_at", "duration_seconds",
            "marked_by", "marked_by_name", "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        u = obj.student
        if not u:
            return ""
        full = f"{u.first_name or ''} {u.last_name or ''}".strip()
        return full or u.email

    def get_roll_number(self, obj):
        try:
            enroll = obj.student.enrollments.filter(
                class_course=obj.class_course
            ).first()
            return enroll.roll_number if enroll else ""
        except Exception:
            return ""

    def get_class_teacher_name(self, obj):
        try:
            t = obj.class_course.teacher if obj.class_course else None
            if not t:
                return ""
            return f"{t.first_name or ''} {t.last_name or ''}".strip() or t.email
        except Exception:
            return ""

    def get_marked_by_name(self, obj):
        u = obj.marked_by
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
    """
    Accepts:
      - klass OR class_course OR class_id  (all aliases for the target ClassCourse)
      - grade                              (Grade target, exclusive with class)
      - date
      - records: [{student, status, note?}]
    """
    klass = serializers.UUIDField(required=False, allow_null=True)
    class_course = serializers.UUIDField(required=False, allow_null=True)
    class_id = serializers.UUIDField(required=False, allow_null=True)
    grade = serializers.UUIDField(required=False, allow_null=True)
    date = serializers.DateField()
    records = AttendanceMarkItemSerializer(many=True)

    def validate(self, attrs):
        klass = attrs.get("klass") or attrs.get("class_course") or attrs.get("class_id")
        grade = attrs.get("grade")
        if not klass and not grade:
            raise serializers.ValidationError(
                "Provide either a class ('klass', 'class_course', or 'class_id') or 'grade'."
            )
        if klass and grade:
            raise serializers.ValidationError(
                "Provide only one of class or 'grade', not both."
            )
        attrs["klass"] = klass
        return attrs
