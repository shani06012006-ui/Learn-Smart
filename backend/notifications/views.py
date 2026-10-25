from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(recipient=request.user).order_by("-created_at")
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Mark all notifications for the user as read."""
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk=None):
        """Mark a single notification as read."""
        updated_count = Notification.objects.filter(pk=pk, recipient=request.user).update(is_read=True)
        
        if updated_count == 0:
            return Response(
                {"error": "Notification not found or already read."}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        return Response({"status": "ok"}, status=status.HTTP_200_OK)