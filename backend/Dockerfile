FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps: libpq for psycopg2, build tools for any C-extension wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/dev.txt

COPY . .

RUN mkdir -p /app/media /app/staticfiles

EXPOSE 8000

# Overridden per-service in docker-compose.yml (web runs daphne, worker runs celery)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
