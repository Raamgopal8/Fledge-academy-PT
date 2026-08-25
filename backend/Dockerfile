# Use official Python 3.12 slim image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies required for PostgreSQL and building packages
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend application code
COPY . .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Expose ports for all microservices
EXPOSE 8000 8001 8002 8003 8004 8005 8006 8009

# Run all microservices
CMD ["/bin/bash", "./entrypoint.sh"]
