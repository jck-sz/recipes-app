@echo off
REM FODMAP Application Startup Script for Windows
REM This script starts the application in detached mode by default

echo 🚀 Starting FODMAP Application...
echo 📦 Building and starting containers in detached mode...

REM Start containers in detached mode
docker-compose up --build -d

REM Wait a moment for containers to start
timeout /t 3 /nobreak >nul

REM Show status
echo.
echo 📊 Container Status:
docker-compose ps

echo.
echo ✅ FODMAP Application started successfully!
echo.
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Admin Panel: http://localhost:3001/admin.html
echo 🔗 API: http://localhost:3000
echo 🗄️ Database: localhost:5432
echo.
echo 📋 Useful commands:
echo   docker-compose logs -f          # View logs
echo   docker-compose logs -f api      # View API logs only
echo   docker-compose logs -f frontend # View frontend logs only
echo   docker-compose stop             # Stop containers
echo   docker-compose down             # Stop and remove containers
echo.
pause
