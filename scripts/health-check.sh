#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Health Check Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_URL="http://localhost:8080/health"
METRICS_URL="http://localhost:9090/metrics"
RABBITMQ_URL="http://localhost:15672/api/overview"
TIMEOUT=10

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

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    print_status "Checking $name..."
    
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$url" 2>/dev/null || echo "000")
    elif command -v wget &> /dev/null; then
        response=$(wget --timeout=$TIMEOUT --tries=1 --spider -S "$url" 2>&1 | grep "HTTP/" | awk '{print $2}' | tail -1 || echo "000")
    else
        print_error "Neither curl nor wget is available for health checks"
        return 1
    fi
    
    if [ "$response" = "$expected_status" ]; then
        print_success "$name is healthy (HTTP $response)"
        return 0
    else
        print_error "$name is unhealthy (HTTP $response)"
        return 1
    fi
}

# Function to check process
check_process() {
    local process_name=$1
    
    print_status "Checking $process_name process..."
    
    if pgrep -f "$process_name" > /dev/null; then
        local pid=$(pgrep -f "$process_name")
        print_success "$process_name is running (PID: $pid)"
        return 0
    else
        print_error "$process_name is not running"
        return 1
    fi
}

# Function to check Docker containers
check_docker() {
    print_status "Checking Docker containers..."
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed"
        return 1
    fi
    
    # Function to use docker-compose or docker compose
    docker_compose_cmd() {
        if command -v docker-compose &> /dev/null; then
            docker-compose "$@"
        else
            docker compose "$@"
        fi
    }
    
    if [ -f "docker-compose.yml" ]; then
        local running_containers=$(docker_compose_cmd ps --services --filter "status=running" 2>/dev/null | wc -l)
        local total_containers=$(docker_compose_cmd ps --services 2>/dev/null | wc -l)
        
        if [ "$running_containers" -gt 0 ]; then
            print_success "Docker containers: $running_containers/$total_containers running"
            docker_compose_cmd ps
            return 0
        else
            print_error "No Docker containers are running"
            return 1
        fi
    else
        print_warning "docker-compose.yml not found"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        print_success "Disk usage: ${usage}% (healthy)"
    elif [ "$usage" -lt 90 ]; then
        print_warning "Disk usage: ${usage}% (warning)"
    else
        print_error "Disk usage: ${usage}% (critical)"
        return 1
    fi
}

# Function to check log files
check_logs() {
    print_status "Checking log files..."
    
    if [ -d "logs" ]; then
        local log_count=$(find logs -name "*.log" -type f | wc -l)
        if [ "$log_count" -gt 0 ]; then
            print_success "Found $log_count log files"
            
            # Check for recent errors
            local recent_errors=$(find logs -name "*.log" -type f -mtime -1 -exec grep -l "ERROR\|FATAL" {} \; 2>/dev/null | wc -l)
            if [ "$recent_errors" -gt 0 ]; then
                print_warning "Found recent errors in $recent_errors log files"
            fi
        else
            print_warning "No log files found"
        fi
    else
        print_warning "Logs directory not found"
    fi
}

# Main health check
echo "🏥 WhatsApp Multi-Agent Chatbot Health Check"
echo "=============================================="

overall_status=0

# Check if running with Docker
if check_docker 2>/dev/null; then
    echo ""
    echo "🐳 Docker Mode Detected"
    echo "----------------------"
    
    # Check Docker services
    check_endpoint "$HEALTH_CHECK_URL" "Chatbot Health Check" || overall_status=1
    check_endpoint "$METRICS_URL" "Chatbot Metrics" || overall_status=1
    check_endpoint "$RABBITMQ_URL" "RabbitMQ Management" || overall_status=1
    
else
    echo ""
    echo "🖥️  Native Mode Detected"
    echo "----------------------"
    
    # Check processes
    check_process "node.*dist/index.js\|ts-node.*src/index.ts" || overall_status=1
    
    # Check endpoints
    check_endpoint "$HEALTH_CHECK_URL" "Chatbot Health Check" || overall_status=1
    check_endpoint "$METRICS_URL" "Chatbot Metrics" || overall_status=1
fi

echo ""
echo "🔧 System Checks"
echo "----------------"

# System checks
check_disk_space || overall_status=1
check_logs

echo ""
echo "=============================================="

if [ $overall_status -eq 0 ]; then
    print_success "🎉 All health checks passed!"
    exit 0
else
    print_error "❌ Some health checks failed!"
    exit 1
fi