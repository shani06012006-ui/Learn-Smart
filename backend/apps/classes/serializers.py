# backend/apps/classes/serializers.py

"""
Serializers for the classes app.
Handles converting Class and Enrollment models to JSON.
"""

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Class, Enrollment


class ClassSerializer(serializers.ModelSerializer):
    """
    Serializer for the Class model.
    Includes teacher info and student count.
    """
    
    # Nested serializer to show teacher details instead of just ID
    teacher = UserSerializer(read_only=True)
    
    # Computed field to show number of enrolled students
    student_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Class
        fields = (
            'id',
            'name',
            'subject',
            'description',
            'join_code',
            'teacher',
            'student_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'join_code', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        """
        Create a new class.
        The teacher is set from the request context.
        """
        # Get the teacher from the request context
        teacher = self.context['request'].user
        validated_data['teacher'] = teacher
        return super().create(validated_data)


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Enrollment model.
    Shows the class details and student info.
    """
    
    # Nested serializers for detailed information
    class_obj = ClassSerializer(read_only=True)
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = (
            'id',
            'student',
            'class_obj',
            'is_active',
            'is_blocked',
            'enrolled_at',
        )
        read_only_fields = ('id', 'enrolled_at')


class JoinClassSerializer(serializers.Serializer):
    """
    Serializer for joining a class using a join code.
    This is a custom serializer because joining a class is a specific action.
    """
    
    join_code = serializers.CharField(
        max_length=6,
        required=True,
        help_text="The 6-character join code of the class"
    )
    
    def validate_join_code(self, value):
        """
        Validate that the join code exists and the class is available.
        """
        try:
            # Try to find the class with the given join code
            class_obj = Class.objects.get(join_code=value.upper())
            self.context['class_obj'] = class_obj
        except Class.DoesNotExist:
            raise serializers.ValidationError("Invalid join code.")
        
        return value.upper()
    
    def validate(self, attrs):
        """
        Check if the student is already enrolled in this class.
        """
        # Get the student from the request context
        student = self.context['request'].user
        class_obj = self.context['class_obj']
        
        # Check for existing enrollment
        if Enrollment.objects.filter(student=student, class_obj=class_obj).exists():
            raise serializers.ValidationError(
                "You are already enrolled in this class."
            )
        
        return attrs