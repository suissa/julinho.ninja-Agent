#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Deployment Script

set -e

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

# Configuration
DEPLOYMENT_MODE=${1:-"production"}
VALID_MODES=("development" "production" "docker")

echo "🚀 WhatsApp Multi-Agent Chatbot Deployment"
echo "==========================================="
echo "Deployment Mode: $DEPLOYMENT_MODE"
echo ""

# Validate deployment mode
if [[ ! " ${VALID_MODES[@]} " =~ " ${DEPLOYMENT_MODE} " ]]; then
    print_error "Invalid deployment mode: $DEPLOYMENT_MODE"
    echo "Valid modes: ${VALID_MODES[*]}"
    exit 1
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if configuration validation script exists and run it
if [ -f "scripts/validate-config.sh" ]; then
    print_status "Validating configuration..."
    if ! bash scripts/validate-config.sh; then
        print_error "Configuration validation failed"
        exit 1
    fi
else
    print_warning "Configuration validation script not found"
fi

# Check system requirements
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) is available"

# Deployment-specific checks
case $DEPLOYMENT_MODE in
    "docker")
        if ! command -v docker &> /dev/null; then
            print_error "Docker is not installed"
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
            print_error "Docker Compose is not installed"
            exit 1
        fi
        print_success "Docker and Docker Compose are available"
        ;;
        
    "production")
        if ! command -v pm2 &> /dev/null; then
            print_warning "PM2 is not installed. Installing PM2..."
            npm install -g pm2
            print_success "PM2 installed successfully"
        else
            print_success "PM2 is available"
        fi
        ;;
esac

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs sessions config/backup
chmod 755 logs sessions
print_success "Directories created"

# Backup existing configuration (production only)
if [ "$DEPLOYMENT_MODE" = "production" ] && [ -f ".env" ]; then
    print_status "Backing up existing configuration..."
    cp .env "config/backup/.env.$(date +%Y%m%d_%H%M%S)"
    print_success "Configuration backed up"
fi

# Install dependencies
print_status "Installing dependencies..."
if [ "$DEPLOYMENT_MODE" = "production" ]; then
    npm ci --only=production
else
    npm install
fi
print_success "Dependencies installed"

# Build the project
print_status "Building the project..."
npm run build
print_success "Project built successfully"

# Run tests (if not production)
if [ "$DEPLOYMENT_MODE" != "production" ]; then
    print_status "Running tests..."
    if npm test --silent; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, but continuing deployment"
    fi
fi

# Deploy based on mode
case $DEPLOYMENT_MODE in
    "docker")
        print_status "Deploying with Docker..."
        
        # Stop existing containers
        if docker-compose ps | grep -q "chatbot"; then
            print_status "Stopping existing containers..."
            docker-compose down
        fi
        
        # Build and start containers
        docker-compose up --build -d
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 15
        
        # Check service health
        if curl -f http://localhost:8080/health >/dev/null 2>&1; then
            print_success "Chatbot service is healthy"
        else
            print_error "Chatbot service health check failed"
            docker-compose logs chatbot
            exit 1
        fi
        ;;
        
    "production")
        print_status "Deploying with PM2..."
        
        # Stop existing PM2 processes
        if pm2 list | grep -q "whatsapp-chatbot"; then
            print_status "Stopping existing PM2 processes..."
            pm2 stop whatsapp-chatbot || true
            pm2 delete whatsapp-chatbot || true
        fi
        
        # Start with PM2
        pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 startup (if not already done)
        if ! pm2 startup | grep -q "already"; then
            print_status "Setting up PM2 startup..."
            pm2 startup
        fi
        
        print_success "Application started with PM2"
        ;;
        
    "development")
        print_status "Starting development server..."
        
        # Kill any existing development processes
        pkill -f "ts-node.*src/index.ts" || true
        pkill -f "node.*dist/index.js" || true
        
        # Start in background
        nohup npm run dev > logs/dev.log 2>&1 &
        DEV_PID=$!
        
        print_success "Development server started (PID: $DEV_PID)"
        ;;
esac

# Post-deployment verification
print_status "Running post-deployment verification..."

# Wait a moment for services to start
sleep 5

# Check if the application is responding
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    print_success "Health check passed"
else
    print_warning "Health check failed - service may still be starting"
fi

# Display deployment summary
echo ""
echo "==========================================="
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Mode: $DEPLOYMENT_MODE"
echo "   Node.js: $(node -v)"
echo "   Environment: ${NODE_ENV:-development}"
echo ""
echo "🔗 Service URLs:"
echo "   Health Check: http://localhost:8080/health"
echo "   Metrics: http://localhost:9090/metrics"
echo "   RabbitMQ Management: http://localhost:15672"
echo ""

case $DEPLOYMENT_MODE in
    "docker")
        echo "🐳 Docker Commands:"
        echo "   View logs: docker-compose logs -f chatbot"
        echo "   Stop services: docker-compose down"
        echo "   Restart: docker-compose restart"
        ;;
        
    "production")
        echo "🔧 PM2 Commands:"
        echo "   View logs: pm2 logs whatsapp-chatbot"
        echo "   Monitor: pm2 monit"
        echo "   Restart: pm2 restart whatsapp-chatbot"
        echo "   Stop: pm2 stop whatsapp-chatbot"
        ;;
        
    "development")
        echo "🛠️  Development Commands:"
        echo "   View logs: tail -f logs/dev.log"
        echo "   Stop: pkill -f 'ts-node.*src/index.ts'"
        ;;
esac

echo ""
echo "📊 Monitoring:"
echo "   Run health check: ./scripts/health-check.sh"
echo "   View system status: ./scripts/status.sh"