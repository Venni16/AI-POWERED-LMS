FROM python:3.9-slim

WORKDIR /code

# Install system dependencies for document processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libmagic1 \
    libmagic-dev \
    poppler-utils \
    antiword \
    unrtf \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create temp directory for file processing
RUN mkdir -p /tmp/materials

# Expose port
EXPOSE 7861

# Start the application
CMD uvicorn app:app --host 0.0.0.0 --port 7861
