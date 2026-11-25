FROM python:3.12-slim

WORKDIR /app
COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/api/main.py .
COPY apps/web-preview ./web-preview
ENV AFTRO_PREVIEW_DIR=/app/web-preview
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
