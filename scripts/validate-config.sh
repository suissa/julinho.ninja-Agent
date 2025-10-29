#!/bin/bash

# WhatsApp Multi-Agent Chatbot - Configuration Validation Script

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

echo "🔍 WhatsApp Multi-Agent Chatbot Configuration Validation"
echo "======================================================="

validation_errors=0

# Check if .env file exists
print_status "Checking .env file..."
if [ ! -f ".env" ]; then
    print_error ".env file not found"
    print_status "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration"
    else
        print_error ".env.example file not found"
        validation_errors=$((validation_errors + 1))
    fi
else
    print_success ".env file exists"
fi

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

# Validate required environment variables
print_status "Validating required environment variables..."

required_vars=(
    "RABBITMQ_HOST"
    "RABBITMQ_PORT"
    "RABBITMQ_USERNAME"
    "RABBITMQ_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        validation_errors=$((validation_errors + 1))
    else
        print_success "$var is set"
    fi
done

# Validate RabbitMQ port
if [ -n "$RABBITMQ_PORT" ]; then
    if ! [[ "$RABBITMQ_PORT" =~ ^[0-9]+$ ]] || [ "$RABBITMQ_PORT" -lt 1 ] || [ "$RABBITMQ_PORT" -gt 65535 ]; then
        print_error "RABBITMQ_PORT must be a valid port number (1-65535)"
        validation_errors=$((validation_errors + 1))
    else
        print_success "RABBITMQ_PORT is valid ($RABBITMQ_PORT)"
    fi
fi

# Validate numeric environment variables
numeric_vars=(
    "MIN_MESSAGE_INTERVAL:1000:60000"
    "SESSION_TIMEOUT:60000:7200000"
    "MAX_RETRY_ATTEMPTS:1:10"
    "AGENT_TIMEOUT_USER_RESPONSE:5000:300000"
    "AGENT_TIMEOUT_REMINDER:10000:600000"
    "MAX_CONCURRENT_SESSIONS:1:10000"
    "MESSAGE_PROCESSING_TIMEOUT:1000:30000"
)

print_status "Validating numeric configuration values..."

for var_config in "${numeric_vars[@]}"; do
    IFS=':' read -r var_name min_val max_val <<< "$var_config"
    var_value="${!var_name}"
    
    if [ -n "$var_value" ]; then
        if ! [[ "$var_value" =~ ^[0-9]+$ ]]; then
            print_error "$var_name must be a numeric value"
            validation_errors=$((validation_errors + 1))
        elif [ "$var_value" -lt "$min_val" ] || [ "$var_value" -gt "$max_val" ]; then
            print_error "$var_name must be between $min_val and $max_val (current: $var_value)"
            validation_errors=$((validation_errors + 1))
        else
            print_success "$var_name is valid ($var_value)"
        fi
    fi
done

# Validate boolean environment variables
boolean_vars=(
    "SESSION_PERSISTENCE_ENABLED"
    "MONITORING_ENABLED"
    "ENCRYPT_SENSITIVE_DATA"
    "AUDIT_LOGGING"
    "SANITIZE_USER_DATA"
)

print_status "Validating boolean configuration values..."

for var in "${boolean_vars[@]}"; do
    var_value="${!var}"
    if [ -n "$var_value" ]; then
        if [[ "$var_value" != "true" && "$var_value" != "false" ]]; then
            print_error "$var must be 'true' or 'false' (current: $var_value)"
            validation_errors=$((validation_errors + 1))
        else
            print_success "$var is valid ($var_value)"
        fi
    fi
done

# Validate log level
print_status "Validating log level..."
if [ -n "$LOG_LEVEL" ]; then
    valid_levels=("error" "warn" "info" "debug")
    if [[ ! " ${valid_levels[@]} " =~ " ${LOG_LEVEL} " ]]; then
        print_error "LOG_LEVEL must be one of: ${valid_levels[*]} (current: $LOG_LEVEL)"
        validation_errors=$((validation_errors + 1))
    else
        print_success "LOG_LEVEL is valid ($LOG_LEVEL)"
    fi
fi

# Validate NODE_ENV
print_status "Validating NODE_ENV..."
if [ -n "$NODE_ENV" ]; then
    valid_envs=("development" "production" "test")
    if [[ ! " ${valid_envs[@]} " =~ " ${NODE_ENV} " ]]; then
        print_error "NODE_ENV must be one of: ${valid_envs[*]} (current: $NODE_ENV)"
        validation_errors=$((validation_errors + 1))
    else
        print_success "NODE_ENV is valid ($NODE_ENV)"
    fi
fi

# Check configuration files
print_status "Checking configuration files..."

config_files=(
    "config/agents.json"
    "config/system.json"
    "config/rabbitmq.conf"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
        
        # Validate JSON files
        if [[ "$file" == *.json ]]; then
            if command -v node &> /dev/null; then
                if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
                    print_success "$file is valid JSON"
                else
                    print_error "$file contains invalid JSON"
                    validation_errors=$((validation_errors + 1))
                fi
            fi
        fi
    else
        print_error "$file not found"
        validation_errors=$((validation_errors + 1))
    fi
done

# Check directory structure
print_status "Checking directory structure..."

required_dirs=(
    "logs"
    "sessions"
    "config"
    "scripts"
    "src"
    "dist"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_success "$dir directory exists"
    else
        if [ "$dir" = "dist" ]; then
            print_warning "$dir directory not found (run 'npm run build' to create it)"
        else
            print_warning "$dir directory not found (will be created automatically)"
        fi
    fi
done

# Check package.json and dependencies
print_status "Checking package.json and dependencies..."

if [ -f "package.json" ]; then
    print_success "package.json exists"
    
    if [ -d "node_modules" ]; then
        print_success "node_modules directory exists"
    else
        print_warning "node_modules directory not found (run 'npm install')"
    fi
else
    print_error "package.json not found"
    validation_errors=$((validation_errors + 1))
fi

# Summary
echo ""
echo "======================================================="

if [ $validation_errors -eq 0 ]; then
    print_success "🎉 Configuration validation completed successfully!"
    echo ""
    echo "✅ All checks passed. Your configuration is ready for deployment."
    exit 0
else
    print_error "❌ Configuration validation failed with $validation_errors error(s)"
    echo ""
    echo "🔧 Please fix the errors above before starting the chatbot."
    exit 1
fi