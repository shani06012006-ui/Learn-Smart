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


class GradeViewSet(viewsets.ModelViewSet):
    """
    CRUD for institution grades.

    - List/retrieve: any authenticated user in the institution
    - Create/update/delete: institution admin only
    - All operations are institution-scoped (superusers see everything)
    """
    from .serializers import GradeSerializer
    serializer_class = GradeSerializer

    def get_permissions(self):
        from admin_api.permissions import IsInstitutionAdmin
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsInstitutionAdmin()]

    def get_queryset(self):
        from .models import Grade
        user = self.request.user
        qs = Grade.objects.all().select_related("institution")
        if not user.is_superuser:
            qs = qs.filter(institution_id=user.institution_id)
        return qs.order_by("level")

    def perform_create(self, serializer):
        user = self.request.user
        institution = user.institution
        if institution is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Your account has no institution.")
        serializer.save(institution=institution)

