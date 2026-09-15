from rest_framework import permissions, viewsets

from .models import Institution
from .serializers import InstitutionSerializer


class InstitutionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only for now — any authenticated user can look up institution
    names (e.g. to show on a profile page). Full CRUD + admin-only write
    permissions land with Module J (Institution Management).
    """

    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]
