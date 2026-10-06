from django.apps import AppConfig


class LeavesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'leaves'


    def ready(self):
        # Register leave-state signals (broadcast on status change)
        from . import signals  # noqa: F401
