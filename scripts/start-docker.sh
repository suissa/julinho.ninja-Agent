#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Docker Startup Script

set -e

echo "🐳 Starting WhatsApp Multi-Agent Chatbot with Docker"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example"
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Create necessary directories for volumes
echo "📁 Creating necessary directories..."
mkdir -p logs sessions

# Function to use docker-compose or docker compose
docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Build and start services
echo "🔨 Building and starting services..."
docker_compose_cmd up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker_compose_cmd ps

# Show logs
echo "📋 Showing recent logs..."
docker_compose_cmd logs --tail=20

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🔗 Service URLs:"
echo "   - Chatbot Health Check: http://localhost:8080/health"
echo "   - Chatbot Metrics: http://localhost:9090/metrics"
echo "   - RabbitMQ Management: http://localhost:15672 (guest/guest)"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose logs -f chatbot"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - View status: docker-compose ps"