# backend/apps/materials/serializers.py

from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import MaterialCategory, StudyMaterial, Announcement


class MaterialCategorySerializer(serializers.ModelSerializer):
    """Serializer for material categories"""
    
    class Meta:
        model = MaterialCategory
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class StudyMaterialSerializer(serializers.ModelSerializer):
    """Serializer for study materials"""
    created_by = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = StudyMaterial
        fields = '__all__'
        read_only_fields = ('id', 'view_count', 'download_count', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class StudyMaterialListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list view"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = StudyMaterial
        fields = ('id', 'title', 'description', 'material_type', 'category_name', 
                  'created_by_name', 'view_count', 'download_count', 'is_pinned', 
                  'created_at', 'file', 'link_url')


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for announcements"""
    created_by = UserSerializer(read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)