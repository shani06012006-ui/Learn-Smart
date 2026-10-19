# backend/notifications/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)[:50]
        return Response({
            "count": qs.count(),
            "unread": qs.filter(is_read=False).count(),
            "results": NotificationSerializer(qs, many=True).data,
        })

    def post(self, request):
        """Mark all as read."""
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"status": "ok"})