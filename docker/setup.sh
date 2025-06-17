#!/bin/bash

# FODMAP Docker Setup Script
# Automatically generates secure passwords and sets up environment

set -e

echo "🐳 Setting up FODMAP Docker environment..."

# Generate secure random passwords
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

POSTGRES_PASSWORD=$(generate_password)
APP_DB_PASSWORD=$(generate_password)

echo "📝 Creating .env file with generated passwords..."

cat > .env << EOF
# Database Configuration for Docker (Auto-generated)
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
EOF

echo "✅ Environment file created successfully!"
echo "🔑 Generated secure passwords automatically"
echo ""
echo "🚀 Starting Docker services..."

# Start Docker services
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."

# Wait for services to be healthy
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        if [ $(docker-compose ps | grep "healthy" | wc -l) -eq 2 ]; then
            echo "✅ All services are healthy!"
            break
        fi
    fi
    
    echo "⏳ Waiting... ($counter/$timeout seconds)"
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "⚠️  Services took longer than expected to start"
    echo "📋 Current status:"
    docker-compose ps
    exit 1
fi

echo ""
echo "🎉 FODMAP Docker environment is ready!"
echo ""
echo "📡 Available endpoints:"
echo "   • API: http://localhost:3000"
echo "   • Health: http://localhost:3000/health"
echo "   • Database: localhost:5432"
echo ""
echo "📋 Useful commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart: docker-compose restart"
echo ""
echo "🧪 Test the API:"
echo "   curl http://localhost:3000/health"
