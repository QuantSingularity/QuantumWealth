FROM python:3.12-slim

# Build context is code/ (not code/backend/): the Django project imports the
# sibling `ai_models` package, so both directories must be copied into the image.
#   docker build -f backend/Dockerfile code

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    gcc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Copy application. settings/base.py adds /app to sys.path when /app/ai_models
# exists, which is what makes `import ai_models` work at runtime.
COPY backend/ .
COPY ai_models ./ai_models

# Pre-create the directories that get mounted as named volumes
# (staticfiles, media) so Docker copies their ownership into the volume on
# first creation. Without this, a fresh named volume mounted at a path that
# doesn't already exist in the image defaults to root ownership, and
# collectstatic would fail with a permission error under the non-root user
# below on every container startup.
RUN mkdir -p /app/staticfiles /app/media

# Non-root user for security
RUN useradd -m -u 1000 appuser \
 && chown -R appuser:appuser /app
USER appuser

# Runtime settings
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=quantumwealth.settings.production

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/api/schema/ || exit 1

# Default command. docker-compose overrides it to run migrations and
# collectstatic before starting gunicorn.
CMD ["gunicorn", "quantumwealth.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120", \
     "--log-level", "info"]
