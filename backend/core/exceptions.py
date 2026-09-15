import logging

from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default handler to return a consistent error envelope:
        { "error": { "detail": ..., "code": ... } }
    so the frontend can rely on one shape regardless of the exception type.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        detail = response.data
        response.data = {
            "error": {
                "detail": detail,
                "status_code": response.status_code,
            }
        }
    else:
        # Unhandled exception — log it, return a generic 500 shape.
        logger.exception("Unhandled exception in view", exc_info=exc)

    return response
