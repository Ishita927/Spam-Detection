FROM python:3.11-slim

WORKDIR /app

# Install system deps (if any needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY main.py .
# NOTE: Copy your models folder into the image before building:
# e.g. place models/ next to this Dockerfile and it will be included:
# COPY models/ models/
COPY README.md .

EXPOSE 8000

# Use gunicorn for production; bind to 0.0.0.0:8000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]