from rest_framework import serializers

from institutions.models import Institution
from .models import User


class InstitutionBriefSerializer(serializers.ModelSerializer):
    """Compact institution payload for embedding in user rows."""

    class Meta:
        model = Institution
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    institution = InstitutionBriefSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "institution",
            "is_active",
            "is_superuser",
        ]
        read_only_fields = ["id"]


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
        ]
        read_only_fields = fields