#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Stop Script

set -e

echo "🛑 Stopping WhatsApp Multi-Agent Chatbot"

# Function to use docker-compose or docker compose
docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Check if running with Docker
if [ -f "docker-compose.yml" ] && docker_compose_cmd ps | grep -q "chatbot"; then
    echo "🐳 Stopping Docker services..."
    docker_compose_cmd down
    echo "✅ Docker services stopped successfully!"
else
    # Stop Node.js processes
    echo "🔍 Looking for running chatbot processes..."
    
    # Find and kill Node.js processes running the chatbot
    PIDS=$(pgrep -f "node.*dist/index.js\|ts-node.*src/index.ts" || true)
    
    if [ -n "$PIDS" ]; then
        echo "🔪 Stopping chatbot processes: $PIDS"
        kill -TERM $PIDS
        
        # Wait for graceful shutdown
        sleep 5
        
        # Force kill if still running
        REMAINING_PIDS=$(pgrep -f "node.*dist/index.js\|ts-node.*src/index.ts" || true)
        if [ -n "$REMAINING_PIDS" ]; then
            echo "⚡ Force stopping remaining processes: $REMAINING_PIDS"
            kill -KILL $REMAINING_PIDS
        fi
        
        echo "✅ Chatbot processes stopped successfully!"
    else
        echo "ℹ️  No running chatbot processes found."
    fi
fi

echo "🏁 Shutdown complete!"