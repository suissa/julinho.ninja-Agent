#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Setup Script

set -e

echo "🔧 Setting up WhatsApp Multi-Agent Chatbot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check system requirements
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi
print_success "npm $(npm -v) is installed"

# Optional: Check Docker
if command -v docker &> /dev/null; then
    print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) is installed"
else
    print_warning "Docker is not installed. Docker deployment will not be available."
fi

# Optional: Check PM2
if command -v pm2 &> /dev/null; then
    print_success "PM2 is installed"
else
    print_warning "PM2 is not installed. Installing PM2 for process management..."
    npm install -g pm2
    print_success "PM2 installed successfully"
fi

# Create directory structure
print_status "Creating directory structure..."
mkdir -p logs sessions config scripts
print_success "Directory structure created"

# Set up environment file
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration"
else
    print_success ".env file already exists"
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Build the project
print_status "Building the project..."
npm run build
print_success "Project built successfully"

# Make scripts executable
print_status "Making scripts executable..."
chmod +x scripts/*.sh
print_success "Scripts are now executable"

# Create systemd service file (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Creating systemd service file..."
    
    SERVICE_FILE="/etc/systemd/system/whatsapp-chatbot.service"
    CURRENT_DIR=$(pwd)
    CURRENT_USER=$(whoami)
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=WhatsApp Multi-Agent Chatbot
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$CURRENT_DIR
ExecStart=/usr/bin/node $CURRENT_DIR/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$CURRENT_DIR/.env

# Logging
StandardOutput=append:$CURRENT_DIR/logs/systemd-out.log
StandardError=append:$CURRENT_DIR/logs/systemd-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$CURRENT_DIR/logs $CURRENT_DIR/sessions

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    print_success "Systemd service created at $SERVICE_FILE"
    print_status "To enable and start the service:"
    print_status "  sudo systemctl enable whatsapp-chatbot"
    print_status "  sudo systemctl start whatsapp-chatbot"
fi

# Setup complete
echo ""
print_success "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Edit .env file with your RabbitMQ configuration"
echo "  2. Start RabbitMQ server"
echo "  3. Choose one of the following startup methods:"
echo ""
echo "🚀 Startup options:"
echo "  Development:  ./scripts/start-dev.sh"
echo "  Production:   ./scripts/start-prod.sh"
echo "  Docker:       ./scripts/start-docker.sh"
echo "  PM2:          pm2 start ecosystem.config.js --env production"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
echo "  Systemd:      sudo systemctl start whatsapp-chatbot"
fi
echo ""
echo "🛑 To stop:"
echo "  ./scripts/stop.sh"
echo ""
echo "📊 Monitoring:"
echo "  Health check: http://localhost:8080/health"
echo "  Metrics:      http://localhost:9090/metrics"
echo "  RabbitMQ:     http://localhost:15672"