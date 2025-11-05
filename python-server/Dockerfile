FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies efficiently
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Clean up to reduce image size
RUN pip cache purge
RUN apt-get autoremove -y && apt-get clean

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]