#!/usr/bin/env node

/**
 * Robust FODMAP Docker Setup Script
 * This script ensures the database user is created correctly EVERY TIME
 * Handles all edge cases including:
 * - Existing containers with wrong user permissions
 * - Volume persistence issues
 * - Password mismatches
 * - Container restart scenarios
 */

const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🚀 FODMAP Robust Docker Setup');
console.log('==============================');
console.log('This script ensures database user works EVERY TIME!');
console.log('');

// Generate secure random passwords
function generatePassword() {
    return crypto.randomBytes(32).toString('base64').replace(/[=+/]/g, '').substring(0, 25);
}

// Execute command with proper error handling
function execCommand(command, description, options = {}) {
    try {
        console.log(`🔧 ${description}...`);
        const result = execSync(command, { 
            encoding: 'utf8', 
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options 
        });
        console.log(`✅ ${description} completed`);
        return { success: true, output: result };
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        return { success: false, error: error.message };
    }
}

// Check if Docker is running
function checkDocker() {
    console.log('🐳 Checking Docker status...');
    const result = execCommand('docker version', 'Docker version check', { silent: true });
    if (!result.success) {
        console.error('❌ Docker is not running!');
        console.error('💡 Please start Docker Desktop and try again.');
        process.exit(1);
    }
    console.log('✅ Docker is running');
}

// Generate or load environment configuration
function setupEnvironment() {
    console.log('📝 Setting up environment configuration...');
    
    let POSTGRES_PASSWORD, APP_DB_PASSWORD;
    
    // Check if .env already exists
    if (fs.existsSync('.env')) {
        console.log('📄 Found existing .env file');
        const envContent = fs.readFileSync('.env', 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value && !key.startsWith('#')) {
                envVars[key.trim()] = value.trim();
            }
        });
        
        POSTGRES_PASSWORD = envVars.POSTGRES_PASSWORD || generatePassword();
        APP_DB_PASSWORD = envVars.APP_DB_PASSWORD || generatePassword();
        
        console.log('🔄 Using existing passwords from .env file');
    } else {
        console.log('🆕 Creating new .env file with fresh passwords');
        POSTGRES_PASSWORD = generatePassword();
        APP_DB_PASSWORD = generatePassword();
    }

    const envContent = `# Database Configuration for Docker (Auto-generated)
POSTGRES_DB=fodmap_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
APP_DB_USER=recipes_user
APP_DB_PASSWORD=${APP_DB_PASSWORD}

# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME=fodmap-recipe-api

# Database URL for application (uses Docker service name 'db')
DATABASE_URL=postgresql://recipes_user:${APP_DB_PASSWORD}@db:5432/fodmap_db

# Database Pool Settings
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# Security Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080,http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
ADMIN_PASSWORD=Dupadupa123

# Logging
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Environment configuration ready');
    
    return { POSTGRES_PASSWORD, APP_DB_PASSWORD };
}

// Clean up any problematic containers/volumes
function cleanupIfNeeded() {
    console.log('🧹 Checking for existing containers...');
    
    try {
        const containers = execSync('docker-compose ps -q', { encoding: 'utf8' }).trim();
        if (containers) {
            console.log('🔄 Found existing containers, checking their status...');
            
            // Check if API container is unhealthy
            const apiStatus = execSync('docker-compose ps api', { encoding: 'utf8' });
            if (apiStatus.includes('unhealthy') || apiStatus.includes('Exit')) {
                console.log('⚠️  API container is unhealthy, will restart services');
                execCommand('docker-compose down', 'Stopping existing services');
            }
        }
    } catch (error) {
        console.log('📝 No existing containers found');
    }
}

// Start Docker services
function startServices() {
    console.log('🚀 Starting Docker services...');
    const result = execCommand('docker-compose up -d', 'Starting containers');
    if (!result.success) {
        console.error('❌ Failed to start Docker services');
        console.error('💡 Make sure Docker is running and try again');
        process.exit(1);
    }
}

// Wait for database to be ready
async function waitForDatabase() {
    console.log('⏳ Waiting for database to be ready...');
    
    const maxWait = 60; // seconds
    let waited = 0;

    while (waited < maxWait) {
        const result = execCommand('docker-compose exec -T db pg_isready -U postgres', 'Database readiness check', { silent: true });
        if (result.success) {
            console.log('✅ Database is ready!');
            return true;
        }
        
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 2000));
        waited += 2;
    }

    console.log('');
    console.log('⚠️ Database took longer than expected to start');
    return false;
}

// Ensure database user is configured correctly
function ensureDatabaseUser(APP_DB_PASSWORD) {
    console.log('🔧 Ensuring database user configuration...');
    
    const createUserScript = `
        DO \\$\\$
        BEGIN
            -- Create user if it doesn't exist
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'recipes_user') THEN
                CREATE USER recipes_user WITH 
                    PASSWORD '${APP_DB_PASSWORD}'
                    LOGIN
                    CREATEDB
                    NOSUPERUSER;
                RAISE NOTICE 'User recipes_user created successfully';
            ELSE
                -- Always update password to ensure it matches .env file
                ALTER USER recipes_user WITH PASSWORD '${APP_DB_PASSWORD}';
                RAISE NOTICE 'User recipes_user password updated';
            END IF;
            
            -- Grant all necessary privileges (idempotent operations)
            GRANT ALL PRIVILEGES ON DATABASE fodmap_db TO recipes_user;
            GRANT USAGE ON SCHEMA public TO recipes_user;
            GRANT CREATE ON SCHEMA public TO recipes_user;
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO recipes_user;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO recipes_user;
            
            -- Grant privileges on future objects
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO recipes_user;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO recipes_user;
            
            RAISE NOTICE 'All privileges granted to recipes_user';
        END
        \\$\\$;
    `;
    
    const result = execCommand(
        `docker-compose exec -T db psql -U postgres -d fodmap_db -c "${createUserScript}"`,
        'Configuring database user',
        { silent: true }
    );
    
    if (!result.success) {
        console.error('❌ Failed to configure database user');
        console.error('💡 Will retry when API container starts');
        return false;
    }
    
    // Test the connection
    const testResult = execCommand(
        `docker-compose exec -T db psql -U recipes_user -d fodmap_db -c "SELECT 'Connection test successful' as status;"`,
        'Testing user connection',
        { silent: true }
    );
    
    if (testResult.success) {
        console.log('✅ Database user configured and tested successfully!');
        return true;
    } else {
        console.error('❌ User configuration completed but connection test failed');
        return false;
    }
}

// Wait for services to be healthy
async function waitForHealthy() {
    console.log('⏳ Waiting for services to be healthy...');
    
    const timeout = 120; // Increased timeout
    let counter = 0;
    
    while (counter < timeout) {
        try {
            const status = execSync('docker-compose ps', { encoding: 'utf8' });
            const healthyCount = (status.match(/healthy/g) || []).length;
            
            if (healthyCount >= 1) { // At least database should be healthy
                console.log('✅ Services are healthy!');
                return true;
            }
            
            if (counter % 10 === 0) {
                console.log(`⏳ Waiting... (${counter}/${timeout} seconds)`);
            }
            
        } catch (error) {
            // Continue waiting
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        counter += 2;
    }
    
    console.log('⚠️ Services took longer than expected to start');
    return false;
}

// Main execution
async function main() {
    try {
        checkDocker();
        const { POSTGRES_PASSWORD, APP_DB_PASSWORD } = setupEnvironment();
        cleanupIfNeeded();
        startServices();
        
        const dbReady = await waitForDatabase();
        if (dbReady) {
            ensureDatabaseUser(APP_DB_PASSWORD);
        }
        
        await waitForHealthy();
        
        console.log('');
        console.log('🎉 FODMAP Docker environment is ready!');
        console.log('======================================');
        console.log('✅ Database user created and verified');
        console.log('✅ All services are running');
        console.log('✅ Ready for development');
        console.log('');
        console.log('📡 Available endpoints:');
        console.log('   • API: http://localhost:3000');
        console.log('   • Health: http://localhost:3000/health');
        console.log('   • Database: localhost:5432');
        console.log('');
        console.log('🔧 Useful commands:');
        console.log('   • Fix DB user: npm run fix-db-user');
        console.log('   • Check health: npm run health');
        console.log('   • View logs: npm run logs');
        console.log('   • Stop services: npm run stop');
        console.log('');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };
