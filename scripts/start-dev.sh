#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Development Startup Script

set -e

echo "🚀 Starting WhatsApp Multi-Agent Chatbot in Development Mode"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example"
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs sessions

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if RabbitMQ is running (optional check)
if command -v rabbitmq-server &> /dev/null; then
    if ! pgrep -x "rabbitmq-server" > /dev/null; then
        echo "⚠️  RabbitMQ server is not running. Please start RabbitMQ first."
        echo "   You can start it with: sudo systemctl start rabbitmq-server"
        echo "   Or using Docker: docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management"
    fi
fi

# Start the application in development mode
echo "🎯 Starting chatbot in development mode..."
npm run dev