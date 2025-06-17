# FODMAP Docker Setup Script for Windows PowerShell
# Automatically generates secure passwords and sets up environment

Write-Host "🐳 Setting up FODMAP Docker environment..." -ForegroundColor Cyan

# Function to generate secure random passwords
function Generate-Password {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes) -replace '[=+/]', '' | Select-Object -First 25
}

$POSTGRES_PASSWORD = Generate-Password
$APP_DB_PASSWORD = Generate-Password

Write-Host "📝 Creating .env file with generated passwords..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration for Docker (Auto-generated)
POSTGRES_DB=fodmap_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
APP_DB_USER=recipes_user
APP_DB_PASSWORD=$APP_DB_PASSWORD

# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME=fodmap-recipe-api

# Database URL for application (uses Docker service name 'db')
DATABASE_URL=postgresql://recipes_user:$APP_DB_PASSWORD@db:5432/fodmap_db

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
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Environment file created successfully!" -ForegroundColor Green
Write-Host "🔑 Generated secure passwords automatically" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting Docker services..." -ForegroundColor Cyan

# Start Docker services
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow

# Wait for services to be healthy
$timeout = 60
$counter = 0

while ($counter -lt $timeout) {
    $status = docker-compose ps
    $healthyCount = ($status | Select-String "healthy").Count
    
    if ($healthyCount -eq 2) {
        Write-Host "✅ All services are healthy!" -ForegroundColor Green
        break
    }
    
    Write-Host "⏳ Waiting... ($counter/$timeout seconds)" -ForegroundColor Yellow
    Start-Sleep 2
    $counter += 2
}

if ($counter -ge $timeout) {
    Write-Host "⚠️  Services took longer than expected to start" -ForegroundColor Red
    Write-Host "📋 Current status:" -ForegroundColor Yellow
    docker-compose ps
    exit 1
}

Write-Host ""
Write-Host "🎉 FODMAP Docker environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📡 Available endpoints:" -ForegroundColor Cyan
Write-Host "   • API: http://localhost:3000"
Write-Host "   • Health: http://localhost:3000/health"
Write-Host "   • Database: localhost:5432"
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Cyan
Write-Host "   • View logs: docker-compose logs -f"
Write-Host "   • Stop services: docker-compose down"
Write-Host "   • Restart: docker-compose restart"
Write-Host ""
Write-Host "🧪 Test the API:" -ForegroundColor Cyan
Write-Host "   Invoke-RestMethod http://localhost:3000/health"
