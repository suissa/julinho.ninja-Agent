#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Production Startup Script

set -e

echo "🚀 Starting WhatsApp Multi-Agent Chatbot in Production Mode"

# Set production environment
export NODE_ENV=production

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
    echo "❌ .env file not found. Please create it with production configuration."
    exit 1
fi

# Validate required environment variables
echo "🔍 Validating environment configuration..."
source .env

required_vars=("RABBITMQ_HOST" "RABBITMQ_PORT" "RABBITMQ_USERNAME" "RABBITMQ_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set."
        exit 1
    fi
done

# Create necessary directories with proper permissions
echo "📁 Creating necessary directories..."
mkdir -p logs sessions
chmod 755 logs sessions

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Build failed. dist directory not found."
    exit 1
fi

# Start the application
echo "🎯 Starting chatbot in production mode..."
exec node dist/index.js