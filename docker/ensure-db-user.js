#!/usr/bin/env node

/**
 * Robust database user creation script
 * This script ensures the database user exists and has correct permissions
 * Can be run independently or as part of the setup process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Ensuring database user configuration...');

// Read environment variables from .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Run setup.js first.');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
        envVars[key.trim()] = value.trim();
    }
});

const APP_DB_USER = envVars.APP_DB_USER || 'recipes_user';
const APP_DB_PASSWORD = envVars.APP_DB_PASSWORD;
const POSTGRES_DB = envVars.POSTGRES_DB || 'fodmap_db';

if (!APP_DB_PASSWORD) {
    console.error('❌ APP_DB_PASSWORD not found in .env file');
    process.exit(1);
}

console.log(`📋 Configuring user: ${APP_DB_USER}`);
console.log(`📋 Database: ${POSTGRES_DB}`);

// Function to execute SQL with proper error handling
function executeSql(sql, description) {
    try {
        console.log(`   ${description}...`);
        const result = execSync(
            `docker-compose exec -T db psql -U postgres -d ${POSTGRES_DB} -c "${sql}"`,
            { encoding: 'utf8', stdio: 'pipe' }
        );
        console.log(`   ✅ ${description} completed`);
        return true;
    } catch (error) {
        console.error(`   ❌ ${description} failed:`, error.message);
        return false;
    }
}

// Main user configuration function
function configureUser() {
    console.log('🔧 Starting user configuration...');
    
    // Step 1: Create or update user
    const createUserSql = `
        DO \\$\\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${APP_DB_USER}') THEN
                CREATE USER ${APP_DB_USER} WITH PASSWORD '${APP_DB_PASSWORD}';
                RAISE NOTICE 'User ${APP_DB_USER} created successfully';
            ELSE
                ALTER USER ${APP_DB_USER} WITH PASSWORD '${APP_DB_PASSWORD}';
                RAISE NOTICE 'User ${APP_DB_USER} password updated';
            END IF;
        END
        \\$\\$;
    `;
    
    if (!executeSql(createUserSql, 'Creating/updating user')) {
        return false;
    }
    
    // Step 2: Grant database privileges
    const grantDbSql = `GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};`;
    if (!executeSql(grantDbSql, 'Granting database privileges')) {
        return false;
    }
    
    // Step 3: Grant schema privileges
    const grantSchemaSql = `GRANT USAGE ON SCHEMA public TO ${APP_DB_USER};`;
    if (!executeSql(grantSchemaSql, 'Granting schema privileges')) {
        return false;
    }
    
    // Step 4: Grant table privileges
    const grantTablesSql = `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${APP_DB_USER};`;
    if (!executeSql(grantTablesSql, 'Granting table privileges')) {
        return false;
    }
    
    // Step 5: Grant sequence privileges
    const grantSequencesSql = `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${APP_DB_USER};`;
    if (!executeSql(grantSequencesSql, 'Granting sequence privileges')) {
        return false;
    }
    
    // Step 6: Grant default privileges for future objects
    const grantDefaultTablesSql = `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_DB_USER};`;
    if (!executeSql(grantDefaultTablesSql, 'Setting default table privileges')) {
        return false;
    }
    
    const grantDefaultSequencesSql = `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_DB_USER};`;
    if (!executeSql(grantDefaultSequencesSql, 'Setting default sequence privileges')) {
        return false;
    }
    
    return true;
}

// Test user connection
function testConnection() {
    console.log('🧪 Testing user connection...');
    try {
        const result = execSync(
            `docker-compose exec -T db psql -U ${APP_DB_USER} -d ${POSTGRES_DB} -c "SELECT 'Connection successful' as status, current_user, current_database();"`,
            { encoding: 'utf8', stdio: 'pipe' }
        );
        console.log('✅ Connection test successful!');
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    }
}

// Main execution
async function main() {
    try {
        // Check if database container is running
        try {
            execSync('docker-compose exec -T db pg_isready -U postgres', { stdio: 'pipe' });
        } catch (error) {
            console.error('❌ Database container is not ready. Make sure Docker services are running.');
            process.exit(1);
        }
        
        // Configure user
        if (!configureUser()) {
            console.error('❌ Failed to configure database user');
            process.exit(1);
        }
        
        // Test connection
        if (!testConnection()) {
            console.error('❌ User configuration completed but connection test failed');
            process.exit(1);
        }
        
        console.log('');
        console.log('🎉 Database user configuration completed successfully!');
        console.log(`✅ User '${APP_DB_USER}' is ready for use`);
        console.log('✅ All permissions granted');
        console.log('✅ Connection verified');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { configureUser, testConnection };
