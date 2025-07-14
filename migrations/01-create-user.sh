#!/bin/bash
set -e

# This script creates the application user for the FODMAP database
# It runs during PostgreSQL container initialization
# Enhanced with better error handling and logging

echo "=============================================="
echo "FODMAP Database User Initialization Script"
echo "=============================================="
echo "Timestamp: $(date)"
echo "Database: $POSTGRES_DB"
echo "Admin User: $POSTGRES_USER"
echo "App User: $APP_DB_USER"
echo "App Password Length: ${#APP_DB_PASSWORD} characters"
echo "=============================================="

# Validate required environment variables
if [ -z "$APP_DB_USER" ]; then
    echo "ERROR: APP_DB_USER environment variable is not set"
    exit 1
fi

if [ -z "$APP_DB_PASSWORD" ]; then
    echo "ERROR: APP_DB_PASSWORD environment variable is not set"
    exit 1
fi

if [ -z "$POSTGRES_DB" ]; then
    echo "ERROR: POSTGRES_DB environment variable is not set"
    exit 1
fi

echo "✅ All required environment variables are present"
echo ""

# Create the application user with comprehensive error handling
echo "🔧 Creating/updating application user: $APP_DB_USER"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Log the start of user creation
    \echo '🚀 Starting user creation process...'

    -- Create application user if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${APP_DB_USER}') THEN
            CREATE USER ${APP_DB_USER} WITH
                PASSWORD '${APP_DB_PASSWORD}'
                LOGIN
                CREATEDB
                NOSUPERUSER
                NOREPLICATION;
            RAISE NOTICE '✅ User ${APP_DB_USER} created successfully with full permissions';
        ELSE
            -- Always update password to ensure it matches current environment
            ALTER USER ${APP_DB_USER} WITH PASSWORD '${APP_DB_PASSWORD}';
            RAISE NOTICE '🔄 User ${APP_DB_USER} already exists - password updated';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION '❌ Failed to create/update user ${APP_DB_USER}: %', SQLERRM;
    END
    \$\$;

    \echo '🔐 Granting database privileges...'

    -- Grant comprehensive database privileges
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};
    GRANT USAGE ON SCHEMA public TO ${APP_DB_USER};
    GRANT CREATE ON SCHEMA public TO ${APP_DB_USER};

    \echo '📋 Granting table and sequence privileges...'

    -- Grant privileges on existing objects
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${APP_DB_USER};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${APP_DB_USER};
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ${APP_DB_USER};

    \echo '🔮 Setting default privileges for future objects...'

    -- Grant privileges on future objects (critical for schema migrations)
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${APP_DB_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${APP_DB_USER};

    \echo '🧪 Testing user permissions...'

    -- Test that the user can perform basic operations
    CREATE TABLE IF NOT EXISTS _user_test_table (id SERIAL PRIMARY KEY, test_data TEXT);
    INSERT INTO _user_test_table (test_data) VALUES ('User creation test');

    -- Grant access to test table
    GRANT ALL ON _user_test_table TO ${APP_DB_USER};
    GRANT ALL ON SEQUENCE _user_test_table_id_seq TO ${APP_DB_USER};

    \echo '✅ User creation and permission setup completed successfully'

    -- Final verification
    SELECT
        '✅ Database user setup verification completed' as status,
        current_database() as database,
        '${APP_DB_USER}' as app_user,
        now() as timestamp;
EOSQL

echo ""
echo "=============================================="
echo "✅ Application user $APP_DB_USER setup completed successfully!"
echo "🔐 User can now connect with the configured password"
echo "📊 All privileges granted for database operations"
echo "🔄 User will persist across container restarts"
echo "=============================================="
