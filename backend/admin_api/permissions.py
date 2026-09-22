"""
Permissions for the institution admin API.

Two rules, in order:

1. The caller must be authenticated AND have role == "admin"
   (this is the same check as core.permissions.IsInstitutionAdmin).

2. If the caller is NOT a superuser, they must have an institution
   attached. A superuser bypasses this — they may see every institution's
   data. Everyone else is scoped strictly to their own institution by the
   view's queryset filter.
"""
from rest_framework.permissions import BasePermission


class IsInstitutionAdmin(BasePermission):
    """Admins only. Superusers pass; everyone else must have role='admin'."""

    message = "Only institution admins may perform this action."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == "admin")


class RequiresInstitutionUnlessSuperuser(BasePermission):
    """
    Institution admins must have an institution set. Superusers are exempt.

    This is a defense-in-depth check: even if a view forgets to filter by
    institution, an admin without one can't reach the endpoint. It doesn't
    replace the queryset filter — it complements it.
    """

    message = (
        "Your admin account is not associated with an institution. "
        "Ask a platform administrator to assign you to one."
    )

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated and u.role == "admin"):
            return False
        if u.is_superuser:
            return True
        return u.institution_id is not None