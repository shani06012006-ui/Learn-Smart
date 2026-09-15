from .base import *  # noqa: F401,F403

DEBUG = True

# SQLite fallback for quick local checks without Postgres running.
# Real development should still point DB_* env vars at Postgres per docker-compose.
import os  # noqa: E402

if os.getenv("USE_SQLITE", "False") == "True":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }

INSTALLED_APPS += []  # dev-only apps (e.g. django-extensions) can be appended here

CORS_ALLOW_ALL_ORIGINS = True
