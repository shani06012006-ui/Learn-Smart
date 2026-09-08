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
        """
        Handle POST request to create a new user.
        
        Expected JSON data:
        {
            "email": "user@example.com",
            "username": "username",
            "password": "password123",
            "password2": "password123",
            "role": "teacher" or "student",
            "first_name": "John",
            "last_name": "Doe"
        }
        """
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Return the created user data with a 201 Created status
            return Response(
                {
                    'message': 'User created successfully',
                    'user': UserSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        
        # Return validation errors
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
        """
        Get the profile of the currently authenticated user.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """
        Update the current user's profile.
        """
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    API endpoint for logout.
    Since we're using JWT, logout is handled on the frontend by removing the token.
    This endpoint is just a placeholder for good practice.
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Logout the user.
        With JWT, we just tell the frontend to remove the token.
        The backend doesn't need to do anything special.
        """
        return Response(
            {'message': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )