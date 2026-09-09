# backend/apps/accounts/views.py

"""
Views (API endpoints) for the accounts app.
Handles user registration, login, and profile management.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    """
    API endpoint for user registration (signup).
    Anyone can access this endpoint (AllowAny permission).
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            return Response(
                {
                    'message': 'User created successfully',
                    'user': UserSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that uses our serializer to include user data.
    This is the endpoint for user login.
    """
    
    serializer_class = CustomTokenObtainPairSerializer


class ProfileView(APIView):
    """
    API endpoint for getting the current user's profile.
    Requires authentication (JWT token).
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    API endpoint for logout.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        return Response(
            {'message': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )