#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🐳 Setting up FODMAP Docker environment...');

// Generate secure random passwords
function generatePassword() {
    return crypto.randomBytes(32).toString('base64').replace(/[=+/]/g, '').substring(0, 25);
}

const POSTGRES_PASSWORD = generatePassword();
const APP_DB_PASSWORD = generatePassword();

console.log('📝 Creating .env file with generated passwords...');

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
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
`;

fs.writeFileSync('.env', envContent);

console.log('✅ Environment file created successfully!');
console.log('🔑 Generated secure passwords automatically');
console.log('');
console.log('🚀 Starting Docker services...');

try {
    execSync('docker-compose up -d', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Failed to start Docker services');
    console.error('💡 Make sure Docker is running and try again');
    process.exit(1);
}

console.log('');
console.log('⏳ Waiting for services to be healthy...');

// Wait for services to be healthy
const timeout = 60;
let counter = 0;

const checkHealth = () => {
    try {
        const status = execSync('docker-compose ps', { encoding: 'utf8' });
        const healthyCount = (status.match(/healthy/g) || []).length;
        
        if (healthyCount === 2) {
            console.log('✅ All services are healthy!');
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
};

const waitForHealth = () => {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (checkHealth()) {
                clearInterval(interval);
                resolve();
            } else if (counter >= timeout) {
                clearInterval(interval);
                reject(new Error('Timeout waiting for services'));
            } else {
                console.log(`⏳ Waiting... (${counter}/${timeout} seconds)`);
                counter += 2;
            }
        }, 2000);
    });
};

waitForHealth()
    .then(() => {
        console.log('');
        console.log('🔧 Setting up database user...');

        // Create the application user in the database
        try {
            const createUserSQL = `
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'recipes_user') THEN
                        CREATE USER recipes_user WITH PASSWORD '${APP_DB_PASSWORD}';
                        GRANT ALL PRIVILEGES ON DATABASE fodmap_db TO recipes_user;
                        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO recipes_user;
                        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO recipes_user;
                        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO recipes_user;
                        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO recipes_user;
                    END IF;
                END
                $$;
            `;

            execSync(`docker-compose exec -T db psql -U postgres -d fodmap_db -c "${createUserSQL.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
            console.log('✅ Database user created successfully!');
        } catch (error) {
            console.log('⚠️  Warning: Could not create database user automatically');
            console.log('   The user might already exist or there was a connection issue');
        }

        console.log('');
        console.log('🎉 FODMAP Docker environment is ready!');
        console.log('');
        console.log('📡 Available endpoints:');
        console.log('   • API: http://localhost:3000');
        console.log('   • Health: http://localhost:3000/health');
        console.log('   • Database: localhost:5432');
        console.log('');
        console.log('📋 Useful commands:');
        console.log('   • Development mode: npm run dev');
        console.log('   • View logs: npm run logs');
        console.log('   • Stop services: npm run stop');
        console.log('   • Restart: npm run restart');
        console.log('   • API shell: npm run shell:api');
        console.log('   • Database shell: npm run shell:db');
        console.log('');
        console.log('🧪 Test the API:');
        console.log('   curl http://localhost:3000/health');
        console.log('');
        console.log('💡 Both database AND backend are now running in Docker!');
        console.log('   Your code changes will auto-reload thanks to volume mounting.');
    })
    .catch((error) => {
        console.log('⚠️  Services took longer than expected to start');
        console.log('📋 Current status:');
        try {
            execSync('docker-compose ps', { stdio: 'inherit' });
        } catch (e) {
            console.error('Failed to get status');
        }
        process.exit(1);
    });
