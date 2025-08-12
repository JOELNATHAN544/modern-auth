#!/bin/bash

# Modern Authentication System - Database Setup Script
# This script automates the PostgreSQL database setup process

set -e  # Exit on any error

echo "🗄️  Modern Authentication System - Database Setup"
echo "=================================================="
echo ""

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

# Check if PostgreSQL is installed
check_postgresql() {
    print_status "Checking PostgreSQL installation..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is installed"
        PSQL_VERSION=$(psql --version | head -n1)
        echo "   Version: $PSQL_VERSION"
    else
        print_error "PostgreSQL is not installed"
        echo ""
        echo "Please install PostgreSQL first:"
        echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        echo "  macOS: brew install postgresql"
        echo "  Windows: Download from https://www.postgresql.org/download/windows/"
        exit 1
    fi
}

# Check if PostgreSQL service is running
check_postgresql_service() {
    print_status "Checking PostgreSQL service status..."
    
    if pg_isready -q; then
        print_success "PostgreSQL service is running"
    else
        print_warning "PostgreSQL service is not running"
        echo "Attempting to start PostgreSQL service..."
        
        if command -v systemctl &> /dev/null; then
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
        elif command -v brew &> /dev/null; then
            brew services start postgresql
        else
            print_error "Could not start PostgreSQL service automatically"
            echo "Please start PostgreSQL service manually and run this script again"
            exit 1
        fi
        
        # Wait a moment for service to start
        sleep 3
        
        if pg_isready -q; then
            print_success "PostgreSQL service started successfully"
        else
            print_error "Failed to start PostgreSQL service"
            exit 1
        fi
    fi
}

# Get database configuration from user
get_database_config() {
    echo ""
    print_status "Database Configuration"
    echo "---------------------------"
    
    # Read database name
    read -p "Database name [modern_auth_db]: " DB_NAME
    DB_NAME=${DB_NAME:-modern_auth_db}
    
    # Read database user
    read -p "Database username [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    # Read database password
    read -s -p "Database password: " DB_PASSWORD
    echo ""
    
    # Read database host
    read -p "Database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    # Read database port
    read -p "Database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
}

# Create database and user
create_database() {
    print_status "Creating database and user..."
    
    # Create database
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_warning "Database '$DB_NAME' already exists"
        read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Dropping existing database..."
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
        else
            print_warning "Using existing database"
            return 0
        fi
    fi
    
    # Create database
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    print_success "Database '$DB_NAME' created successfully"
}

# Create .env file
create_env_file() {
    print_status "Creating .env file..."
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Using existing .env file"
            return 0
        fi
    fi
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-super-secret-jwt-key-change-this-in-production")
    
    # Create .env file
    cat > .env << EOF
# Modern Authentication System Environment Variables
# Generated on $(date)

# Application Configuration
NODE_ENV=development
PORT=3001
APP_NAME=Modern Auth System
APP_VERSION=1.0.0

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# Security Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# WebAuthn Configuration
WEBAUTHN_RP_NAME=Modern Auth Demo
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Analytics Configuration
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_UPDATE_INTERVAL=30

# Step-up Authentication Configuration
PSD3_THRESHOLD=150
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3

# Development Configuration
DEV_MODE=true
DEBUG_ENABLED=true
DEMO_MODE_ENABLED=true

# Production Configuration
FORCE_HTTPS=false
SECURE_COOKIES=false
TRUST_PROXY=false

# Feature Flags
FEATURE_FLAGS=webauthn,stepup,analytics
MAINTENANCE_MODE=false
EOF
    
    print_success ".env file created successfully"
}

# Install Node.js dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Install server dependencies
    if [ -d "server" ]; then
        cd server
        npm install
        cd ..
    fi
    
    # Install client dependencies
    if [ -d "client" ]; then
        cd client
        npm install
        cd ..
    fi
    
    print_success "Dependencies installed successfully"
}

# Run database setup
run_database_setup() {
    print_status "Running database setup script..."
    
    if [ -f "database/setup.js" ]; then
        node database/setup.js
        if [ $? -eq 0 ]; then
            print_success "Database setup completed successfully"
        else
            print_error "Database setup failed"
            exit 1
        fi
    else
        print_error "Database setup script not found"
        exit 1
    fi
}

# Main execution
main() {
    echo "This script will set up the PostgreSQL database for the Modern Authentication System."
    echo ""
    
    # Check prerequisites
    check_postgresql
    check_postgresql_service
    
    # Get configuration
    get_database_config
    
    # Create database
    create_database
    
    # Create .env file
    create_env_file
    
    # Install dependencies
    install_dependencies
    
    # Run database setup
    run_database_setup
    
    echo ""
    print_success "Database setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start the application: npm run dev"
    echo "2. Open http://localhost:3000 in your browser"
    echo "3. Test the authentication system"
    echo ""
    echo "For more information, see DATABASE_SETUP.md"
}

# Run main function
main "$@"
