#!/bin/bash

# Apply Performance Indexes Migration
# This script applies additional database indexes for improved performance

echo "Applying performance indexes migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: export DATABASE_URL='postgresql://username:password@localhost:5432/database_name'"
    exit 1
fi

# Apply the performance indexes
echo "Creating performance indexes..."
psql "$DATABASE_URL" -f "$(dirname "$0")/performance_indexes.sql"

if [ $? -eq 0 ]; then
    echo "Performance indexes applied successfully!"
    echo "Database performance should be improved for common query patterns."
else
    echo "Error applying performance indexes. Please check the error messages above."
    exit 1
fi
