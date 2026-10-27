from rest_framework import permissions, viewsets
from .models import Institution
from .serializers import InstitutionSerializer, GradeSerializer


class InstitutionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only for now — any authenticated user can look up institution names.
    """
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]


class GradeViewSet(viewsets.ModelViewSet):
    """
    CRUD for institution grades (with nested sections).
    """
    serializer_class = GradeSerializer

    def get_permissions(self):
        from admin_api.permissions import IsInstitutionAdmin
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsInstitutionAdmin()]

    def get_queryset(self):
        from .models import Grade
        user = self.request.user
        
        # ✅ Use distinct() to prevent duplicate grades
        qs = Grade.objects.all().distinct().select_related("institution").prefetch_related("sections")
        
        if not user.is_superuser and getattr(user, "institution_id", None):
            qs = qs.filter(institution_id=user.institution_id)
            
        return qs.order_by("level")

    def perform_create(self, serializer):
        user = self.request.user
        institution = getattr(user, "institution", None)
        if institution is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Your account has no institution.")
        serializer.save(institution=institution)