# PostgreSQL Database Setup Guide

## 🗄️ **Complete Database Setup for Modern Authentication System**

This guide will help you set up a PostgreSQL database with all the necessary tables, indexes, and functions for tracking authentication, transactions, and analytics.

---

## 📋 **Prerequisites**

### **1. PostgreSQL Installation**

#### **Ubuntu/Debian:**

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

#### **macOS (using Homebrew):**

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Check status
brew services list | grep postgresql
```

#### **Windows:**

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Follow the setup wizard
4. PostgreSQL service will start automatically

### **2. Node.js Dependencies**

```bash
# Install PostgreSQL client for Node.js
cd server
npm install pg pg-pool
```

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Database and User**

#### **Connect to PostgreSQL:**

```bash
# Switch to postgres user (Linux/macOS)
sudo -u postgres psql

# Or connect directly (if you have a password set)
psql -U postgres -h localhost
```

#### **Create Database and User:**

```sql
-- Create database
CREATE DATABASE modern_auth_db;

-- Create user (replace 'your_username' and 'your_password')
CREATE USER your_username WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE modern_auth_db TO your_username;

-- Connect to the new database
\c modern_auth_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO your_username;

-- Exit PostgreSQL
\q
```

### **Step 2: Configure Environment Variables**

#### **Create .env file:**

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your database credentials
nano .env
```

#### **Update these values in .env:**

```env
# Database Configuration
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/modern_auth_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modern_auth_db
DB_USER=your_username
DB_PASSWORD=your_password

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Configuration
NODE_ENV=development
PORT=3001
```

### **Step 3: Run Database Setup**

#### **Install dependencies:**

```bash
# Install server dependencies
cd server
npm install

# Install database dependencies
npm install pg pg-pool
```

#### **Run the setup script:**

```bash
# From the project root
node database/setup.js
```

**Expected output:**

```
🗄️  Setting up Modern Authentication Database...

1. Testing database connection...
✅ Database connection successful

2. Creating database schema...
   ✅ Statement 1/15 executed
   ✅ Statement 2/15 executed
   ...
✅ Database schema created successfully

3. Inserting initial data...
✅ Initial data inserted successfully

4. Verifying database setup...
   ✅ Table 'users' exists with 0 rows
   ✅ Table 'webauthn_credentials' exists with 0 rows
   ...
✅ Database setup verification completed

🎉 Database setup completed successfully!

📊 Your database now includes:
   • Users table with WebAuthn support
   • Transactions table with PSD3 compliance
   • Analytics and conversion tracking
   • Audit logging and security features
   • Performance indexes and functions

🚀 Ready to start the application!
```

---

## 📊 **Database Schema Overview**

### **Core Tables:**

#### **1. Users Table**

- Stores user information and authentication preferences
- Supports multiple auth types (passkey, password, demo)
- Tracks login history and account status

#### **2. WebAuthn Credentials Table**

- Stores passkey credentials securely
- Tracks credential usage and counters
- Supports multiple devices per user

#### **3. Transactions Table**

- Records all financial transactions
- Implements PSD3 compliance (€150 threshold)
- Tracks step-up authentication requirements

#### **4. Analytics Events Table**

- Comprehensive event tracking
- Supports JSON metadata for flexibility
- Real-time analytics data collection

#### **5. Conversion Tracking Table**

- Measures authentication success rates
- Tracks user journey completion
- Performance comparison data

#### **6. Audit Logs Table**

- Complete audit trail
- Security compliance
- Change tracking

### **Supporting Tables:**

#### **7. Auth Sessions Table**

- Session management
- Security tracking
- User activity monitoring

#### **8. Auth Challenges Table**

- WebAuthn challenge storage
- Security verification
- Challenge expiration management

#### **9. Step-up Authentications Table**

- OTP management
- Verification tracking
- Security compliance

---

## 🔧 **Database Functions**

### **Analytics Functions:**

#### **get_conversion_rate(flow_type, start_date, end_date)**

- Calculates conversion rates for authentication flows
- Supports date range filtering
- Returns percentage values

#### **get_stepup_stats(start_date, end_date)**

- Provides step-up authentication statistics
- Tracks success rates
- Performance metrics

### **Performance Features:**

#### **Indexes:**

- Optimized for common queries
- Fast user lookups
- Efficient transaction processing
- Analytics query optimization

#### **Triggers:**

- Automatic timestamp updates
- Data integrity enforcement
- Audit trail maintenance

---

## 🧪 **Testing the Database**

### **1. Test Connection:**

```bash
# Test database connection
node -e "
const { testConnection } = require('./server/config/database');
testConnection().then(result => {
  console.log('Connection test:', result ? '✅ Success' : '❌ Failed');
  process.exit(result ? 0 : 1);
});
"
```

### **2. Test Basic Operations:**

```bash
# Test user creation
node -e "
const User = require('./server/models/User');
User.create({
  username: 'testuser',
  email: 'test@example.com',
  auth_type: 'demo'
}).then(user => {
  console.log('✅ User created:', user.username);
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"
```

### **3. Test Analytics:**

```bash
# Test analytics functions
node -e "
const { query } = require('./server/config/database');
query('SELECT get_conversion_rate($1)', ['passkey'])
.then(result => {
  console.log('✅ Analytics function working:', result.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"
```

---

## 🔒 **Security Considerations**

### **1. Environment Variables:**

- Never commit `.env` files to version control
- Use strong, unique passwords
- Rotate secrets regularly

### **2. Database Security:**

- Use dedicated database users
- Limit database permissions
- Enable SSL in production
- Regular security updates

### **3. Connection Security:**

- Use connection pooling
- Implement proper error handling
- Monitor connection usage
- Set appropriate timeouts

---

## 📈 **Production Considerations**

### **1. Database Optimization:**

```sql
-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### **2. Backup Strategy:**

```bash
# Create backup script
#!/bin/bash
pg_dump -U your_username -h localhost modern_auth_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U your_username -h localhost modern_auth_db < backup_file.sql
```

### **3. Monitoring:**

- Set up database monitoring
- Monitor slow queries
- Track connection usage
- Alert on errors

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. Connection Refused:**

```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Check port availability
netstat -tlnp | grep 5432
```

#### **2. Authentication Failed:**

```bash
# Check pg_hba.conf configuration
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### **3. Permission Denied:**

```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE modern_auth_db TO your_username;
GRANT ALL ON SCHEMA public TO your_username;
```

#### **4. Schema Creation Failed:**

```bash
# Check if UUID extension is available
psql -U your_username -d modern_auth_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

---

## 🎯 **Next Steps**

### **1. Start the Application:**

```bash
# Start the development servers
npm run dev
```

### **2. Test All Features:**

- User registration and authentication
- Transaction processing
- Analytics dashboard
- Step-up authentication

### **3. Monitor Performance:**

- Check database logs
- Monitor query performance
- Track analytics data
- Verify security features

---

## 📚 **Additional Resources**

### **PostgreSQL Documentation:**

- [Official PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL Client](https://node-postgres.com/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)

### **Security Resources:**

- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [OWASP Database Security](https://owasp.org/www-project-top-ten/)
- [PSD3 Compliance](https://www.europeanpaymentscouncil.eu/)

---

**🎉 Congratulations! Your database is now ready for the Modern Authentication System with full tracking capabilities!**
