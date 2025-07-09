# Database User Permission Fix

This document explains the permanent solution for the recurring database user permission issue in the FODMAP application.

## Problem

Previously, the database user `recipes_user` would sometimes not be created correctly or have wrong permissions, causing authentication failures like:

```
❌ Database connection failed: password authentication failed for user "recipes_user"
```

This happened because:
1. PostgreSQL initialization scripts only run on first container creation
2. If containers were restarted or volumes persisted, the user might not exist
3. Password mismatches between .env file and database
4. Insufficient permissions granted to the user

## Solution

We've implemented a **robust, multi-layered approach** that ensures the database user works **EVERY TIME**:

### 1. Enhanced Setup Script (`robust-setup.js`)

The new setup script:
- ✅ Always checks and creates/updates the database user
- ✅ Handles existing containers gracefully
- ✅ Ensures password consistency between .env and database
- ✅ Grants comprehensive permissions
- ✅ Tests the connection before completing
- ✅ Provides detailed logging and error messages

### 2. Improved Initialization Script (`01-create-user.sh`)

The database initialization script now:
- ✅ Has better error handling and validation
- ✅ Grants more comprehensive permissions
- ✅ Includes detailed logging
- ✅ Tests user creation immediately
- ✅ Handles edge cases gracefully

### 3. Standalone Fix Script (`ensure-db-user.js`)

For when things go wrong:
- ✅ Can be run independently to fix user issues
- ✅ Reads current .env configuration
- ✅ Updates user permissions without restarting containers
- ✅ Provides detailed diagnostics

## Usage

### Normal Startup (Recommended)
```bash
# This now uses the robust setup automatically
start.bat
```

Or manually:
```bash
cd docker
npm run setup
```

### If Database User Issues Occur
```bash
cd docker
npm run fix-db-user
```

### Complete Reset (Nuclear Option)
```bash
cd docker
npm run reset
```

### Check System Health
```bash
cd docker
npm run health
npm run status
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup` | Robust setup (default) |
| `npm run setup:original` | Original setup script |
| `npm run fix-db-user` | Fix database user permissions |
| `npm run health` | Check API health |
| `npm run status` | Show container status |
| `npm run reset` | Complete reset with volumes |
| `npm run logs` | View all logs |
| `npm run logs:api` | View API logs only |
| `npm run logs:db` | View database logs only |

## How It Works

### 1. Environment Setup
- Generates or reuses secure passwords
- Creates comprehensive .env file
- Validates all required variables

### 2. Container Management
- Checks for existing problematic containers
- Gracefully handles restarts
- Ensures clean startup state

### 3. Database User Creation
- Creates user with comprehensive permissions:
  - `LOGIN` - Can connect to database
  - `CREATEDB` - Can create databases
  - `ALL PRIVILEGES` on database
  - `ALL PRIVILEGES` on all tables/sequences
  - `DEFAULT PRIVILEGES` for future objects
  - `USAGE` and `CREATE` on schema

### 4. Connection Testing
- Tests user can actually connect
- Verifies permissions work
- Provides immediate feedback

### 5. Health Monitoring
- Waits for services to be healthy
- Provides detailed status information
- Offers troubleshooting guidance

## Troubleshooting

### If Setup Still Fails

1. **Check Docker is running:**
   ```bash
   docker version
   ```

2. **View detailed logs:**
   ```bash
   cd docker
   npm run logs:db
   ```

3. **Try manual user fix:**
   ```bash
   cd docker
   npm run fix-db-user
   ```

4. **Complete reset:**
   ```bash
   cd docker
   npm run reset
   ```

5. **Manual database access:**
   ```bash
   cd docker
   npm run shell:db
   ```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Docker not running" | Start Docker Desktop |
| "User already exists" | Run `npm run fix-db-user` |
| "Permission denied" | Check .env file passwords |
| "Connection refused" | Wait longer or check container logs |
| "Unhealthy containers" | Run `npm run reset` |

## Technical Details

### User Permissions Granted
```sql
-- Basic user creation
CREATE USER recipes_user WITH 
    PASSWORD 'generated_password'
    LOGIN
    CREATEDB
    NOSUPERUSER;

-- Database level
GRANT ALL PRIVILEGES ON DATABASE fodmap_db TO recipes_user;

-- Schema level
GRANT USAGE ON SCHEMA public TO recipes_user;
GRANT CREATE ON SCHEMA public TO recipes_user;

-- Object level
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO recipes_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO recipes_user;

-- Future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO recipes_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO recipes_user;
```

### Environment Variables
```bash
POSTGRES_DB=fodmap_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<generated>
APP_DB_USER=recipes_user
APP_DB_PASSWORD=<generated>
DATABASE_URL=postgresql://recipes_user:<password>@db:5432/fodmap_db
```

## Success Indicators

When everything works correctly, you should see:
```
🎉 FODMAP Docker environment is ready!
✅ Database user created and verified
✅ All services are running
✅ Ready for development
```

And the API health check should return:
```json
{
  "error": false,
  "message": "Application is healthy",
  "data": {
    "status": "healthy",
    "services": {
      "database": {
        "status": "healthy",
        "connection": "active"
      }
    }
  }
}
```

## Maintenance

This solution is designed to be **maintenance-free**. The robust setup script will:
- Always ensure the user exists with correct permissions
- Handle password updates automatically
- Work across container restarts and volume changes
- Provide clear feedback when issues occur

**The database user permission issue should now be permanently resolved!** 🎉
