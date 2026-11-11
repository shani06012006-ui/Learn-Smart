"""
Base settings shared by all environments.
Environment-specific overrides live in dev.py / prod.py.
"""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure-secret-key-change-me")

DEBUG = os.getenv("DJANGO_DEBUG", "False") == "True"

ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "channels",
    "corsheaders",
]

LOCAL_APPS = [
    "core",
    "accounts",
    "institutions",
    "classes",
    "leaves",
    "admin_api",
    "chat",
    "attendance",
    "quizzes",
    "notifications", 
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "autolearn"),
        "USER": os.getenv("DB_USER", "autolearn_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", "autolearn_pass"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static / media files
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Upload constraints enforced app-wide; individual apps (materials) add
# stricter per-field validators on top of this.
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "accounts.jwt_auth.TokensValidAfterJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    # django-filter is wired in via DEFAULT_FILTER_BACKENDS when the
    # exams/analytics modules land and introduce filterable list views.
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    # Per-IP limit for the teacher sign-up endpoints (see accounts/registration.py).
    "DEFAULT_THROTTLE_RATES": {
        "registration": os.getenv("REGISTRATION_THROTTLE_RATE", "20/hour"),
        # Activation flow (see accounts/activation.py). Both scopes are consumed
        # while the student is NOT authenticated yet, so they are keyed by IP.
        "activation": os.getenv("ACTIVATION_THROTTLE_RATE", "30/hour"),
        "activation_request": os.getenv("ACTIVATION_REQUEST_THROTTLE_RATE", "5/hour"),
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Intelligent Auto-Learning & Grading Platform API",
    "DESCRIPTION": "REST + WebSocket API for the AI-powered LMS.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# ---------------------------------------------------------------------------
# Simple JWT
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_LIFETIME_MIN", 30))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_LIFETIME_DAYS", 7))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")

# ---------------------------------------------------------------------------
# Student activation flow (see accounts/activation.py)
# ---------------------------------------------------------------------------
# Public URL of the React app. Activation / login links embedded in the invite
# e-mail (or WhatsApp message) are built from this so a student always lands on
# the right host. In dev the Vite server runs on :5173.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
TEACHER_ONBOARDING_TTL_MINUTES = int(os.getenv("TEACHER_ONBOARDING_TTL_MINUTES", "30"))
# How long a one-time activation link (and the fallback temporary password)
# stays valid. After this window the invite must be re-sent.
ACTIVATION_TOKEN_TTL_HOURS = int(os.getenv("ACTIVATION_TOKEN_TTL_HOURS", "48"))
# Optional E.164 country code (e.g. "+44") prepended to a WhatsApp number that
# was captured without an international prefix. Leave blank to reject such
# numbers instead of guessing.
ACTIVATION_DEFAULT_COUNTRY_CODE = os.getenv("ACTIVATION_DEFAULT_COUNTRY_CODE", "")

# ---------------------------------------------------------------------------
# E-mail (sign-up verification codes)
# Default = console backend: the e-mail, including the 6-digit code, is printed
# in the Django terminal - no setup needed for development.
# For real delivery set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# plus the EMAIL_HOST* variables below (see SIGNUP_SETUP.md).
# ---------------------------------------------------------------------------
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")

EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "reach.shaniyas@gmail.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = "Learn Smart <reach.shaniyas@gmail.com>"

# ---------------------------------------------------------------------------
# Channels / Redis
# ---------------------------------------------------------------------------
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("127.0.0.1", 6379)]},
    }
}

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", f"redis://{REDIS_HOST}:{REDIS_PORT}/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# ---------------------------------------------------------------------------
# AI Engine (used from Module D onward; present here so .env.example is complete)
# ---------------------------------------------------------------------------
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Free AI provider settings (see quizzes/ai_service.py)
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")     
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

# ---------------------------------------------------------------------------
# Joining code config (classes app)
# ---------------------------------------------------------------------------
JOINING_CODE_LENGTH = 6
JOINING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # excludes 0/O/1/I to avoid ambiguity

# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------
# Redis-backed cache. Required for the WebSocket ticket flow and for
# anything else that crosses process boundaries (rate limits, presence
# throttles, permission caches). Do not switch this to LocMemCache: it
# is process-local and would silently break those flows under Daphne.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
    },
}

# ---------------------------------------------------------------- live classes

LIVE_CLASS_HORIZON_WEEKS = 4
# Allow large base64 images
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024 
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  