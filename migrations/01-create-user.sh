#!/bin/bash
set -e

# This script creates the application user for the FODMAP database
# It runs during PostgreSQL container initialization

echo "Creating application user: $APP_DB_USER"

# Create the application user with the password from environment variable
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user if it doesn't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_DB_USER') THEN
            CREATE USER $APP_DB_USER WITH PASSWORD '$APP_DB_PASSWORD';
            RAISE NOTICE 'User $APP_DB_USER created successfully';
        ELSE
            -- Update password in case it changed
            ALTER USER $APP_DB_USER WITH PASSWORD '$APP_DB_PASSWORD';
            RAISE NOTICE 'User $APP_DB_USER password updated';
        END IF;
    END
    \$\$;

    -- Grant necessary privileges
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $APP_DB_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $APP_DB_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $APP_DB_USER;
    
    -- Grant privileges on future tables and sequences
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_DB_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_DB_USER;
    
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO $APP_DB_USER;
EOSQL

echo "Application user $APP_DB_USER setup completed"
