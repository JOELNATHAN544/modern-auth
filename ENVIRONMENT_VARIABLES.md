# Environment Variables Guide

## 🔐 **Complete Environment Configuration for Modern Authentication System**

This guide provides all the environment variables you need to configure your `.env` file for the database-enabled Modern Authentication System.

---

## 📋 **Required Environment Variables**

### **1. Database Configuration**

```env
# PostgreSQL Database URL (Primary connection string)
DATABASE_URL=postgresql://username:password@localhost:5432/modern_auth_db

# Individual Database Settings (Alternative to DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modern_auth_db
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# Database Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

### **2. Application Configuration**

```env
# Application Environment
NODE_ENV=development
PORT=3001
APP_NAME=Modern Auth System
APP_VERSION=1.0.0
```

### **3. Security Configuration**

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# WebAuthn Configuration
WEBAUTHN_RP_NAME=Modern Auth Demo
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **4. CORS Configuration**

```env
# Allowed Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### **5. Logging Configuration**

```env
# Log Level
LOG_LEVEL=info

# Log File Path
LOG_FILE_PATH=./logs/app.log
```

### **6. Analytics Configuration**

```env
# Analytics Data Retention (in days)
ANALYTICS_RETENTION_DAYS=90

# Real-time Analytics Update Interval (in seconds)
ANALYTICS_UPDATE_INTERVAL=30
```

### **7. Step-up Authentication Configuration**

```env
# PSD3 Transaction Threshold (in EUR)
PSD3_THRESHOLD=150

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
```

### **8. Development Configuration**

```env
# Development Mode Settings
DEV_MODE=true
DEBUG_ENABLED=true
DEMO_MODE_ENABLED=true
```

### **9. Production Configuration**

```env
# Production Settings (set to false in development)
FORCE_HTTPS=false
SECURE_COOKIES=false
TRUST_PROXY=false
```

### **10. Feature Flags**

```env
# Custom Application Settings
FEATURE_FLAGS=webauthn,stepup,analytics
MAINTENANCE_MODE=false
```

---

## 🚀 **Quick Setup**

### **Option 1: Automated Setup (Recommended)**

```bash
# Run the automated setup script
./setup-database.sh
```

This script will:

- Check PostgreSQL installation
- Create database and user
- Generate `.env` file automatically
- Install dependencies
- Run database setup

### **Option 2: Manual Setup**

#### **Step 1: Create .env file**

```bash
# Copy the example file
cp env.example .env

# Edit with your values
nano .env
```

#### **Step 2: Update Database Settings**

```env
# Replace these values with your actual database credentials
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/modern_auth_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modern_auth_db
DB_USER=your_username
DB_PASSWORD=your_password
```

#### **Step 3: Generate JWT Secret**

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

Then update your `.env` file:

```env
JWT_SECRET=your-generated-secret-here
```

---

## 🔒 **Security Best Practices**

### **1. Environment Variable Security**

```env
# ✅ DO: Use strong, unique secrets
JWT_SECRET=your-very-long-and-random-secret-key-here

# ❌ DON'T: Use weak or default secrets
JWT_SECRET=secret
JWT_SECRET=123456
```

### **2. Database Security**

```env
# ✅ DO: Use dedicated database users
DB_USER=modern_auth_user

# ✅ DO: Use strong passwords
DB_PASSWORD=your-strong-database-password

# ✅ DO: Use SSL in production
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### **3. Production Configuration**

```env
# Production settings
NODE_ENV=production
FORCE_HTTPS=true
SECURE_COOKIES=true
TRUST_PROXY=true
DEV_MODE=false
DEBUG_ENABLED=false
```

---

## 📊 **Environment-Specific Configurations**

### **Development Environment**

```env
# Development settings
NODE_ENV=development
DEV_MODE=true
DEBUG_ENABLED=true
DEMO_MODE_ENABLED=true
LOG_LEVEL=debug
FORCE_HTTPS=false
SECURE_COOKIES=false
```

### **Testing Environment**

```env
# Testing settings
NODE_ENV=test
DB_NAME=modern_auth_test_db
LOG_LEVEL=error
DEBUG_ENABLED=false
DEMO_MODE_ENABLED=true
```

### **Production Environment**

```env
# Production settings
NODE_ENV=production
DEV_MODE=false
DEBUG_ENABLED=false
DEMO_MODE_ENABLED=false
LOG_LEVEL=warn
FORCE_HTTPS=true
SECURE_COOKIES=true
TRUST_PROXY=true
```

---

## 🔧 **Advanced Configuration**

### **1. Email Configuration (for Production OTP)**

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Email Templates
EMAIL_FROM=noreply@modernauth.com
EMAIL_SUBJECT_PREFIX=[Modern Auth]
```

### **2. Redis Configuration (for Session Storage)**

```env
# Redis URL (optional, for production)
REDIS_URL=redis://localhost:6379

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### **3. Monitoring Configuration**

```env
# Health Check Endpoint
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# API Documentation
API_DOCS_ENABLED=true
API_DOCS_PATH=/api-docs
```

### **4. Backup Configuration**

```env
# Database Backup Configuration
BACKUP_ENABLED=false
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION_DAYS=7
```

---

## 🧪 **Testing Your Configuration**

### **1. Test Database Connection**

```bash
# Test connection with your .env file
node -e "
require('dotenv').config();
const { testConnection } = require('./server/config/database');
testConnection().then(result => {
  console.log('Database connection:', result ? '✅ Success' : '❌ Failed');
  process.exit(result ? 0 : 1);
});
"
```

### **2. Test Environment Variables**

```bash
# Test environment variable loading
node -e "
require('dotenv').config();
console.log('Database URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('JWT Secret:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('Node Env:', process.env.NODE_ENV);
"
```

### **3. Test Application Startup**

```bash
# Test if the application starts with your configuration
npm run dev
```

---

## 🚨 **Common Issues and Solutions**

### **1. Database Connection Issues**

```env
# ❌ Common mistake: Wrong port
DB_PORT=5432  # PostgreSQL default port

# ❌ Common mistake: Wrong host
DB_HOST=localhost  # For local development

# ❌ Common mistake: Missing password
DB_PASSWORD=your_actual_password
```

### **2. JWT Issues**

```env
# ❌ Common mistake: Weak secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ✅ Better: Generate a strong secret
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. CORS Issues**

```env
# ❌ Common mistake: Wrong origin
CORS_ORIGINS=http://localhost:3000

# ✅ Better: Include all necessary origins
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 📝 **Complete .env Example**

Here's a complete `.env` file example:

```env
# =============================================================================
# MODERN AUTHENTICATION SYSTEM - ENVIRONMENT VARIABLES
# =============================================================================

# Application Configuration
NODE_ENV=development
PORT=3001
APP_NAME=Modern Auth System
APP_VERSION=1.0.0

# Database Configuration
DATABASE_URL=postgresql://modern_auth_user:your_strong_password@localhost:5432/modern_auth_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modern_auth_db
DB_USER=modern_auth_user
DB_PASSWORD=your_strong_password

# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
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
```

---

## 🎯 **Next Steps**

1. **Create your `.env` file** using the automated script or manual setup
2. **Test your configuration** using the provided test commands
3. **Run the database setup** to create all tables and functions
4. **Start the application** and test all features
5. **Monitor the logs** to ensure everything is working correctly

---

**🔐 Remember: Never commit your `.env` file to version control! It contains sensitive information like database passwords and JWT secrets.**
