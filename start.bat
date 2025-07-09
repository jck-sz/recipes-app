@echo off
setlocal enabledelayedexpansion

echo ========================================
echo FODMAP Recipe Application Startup
echo ========================================
echo.

:: Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Starting database services...
cd docker
call npm run setup
cd ..

echo.
echo [2/3] Starting backend API...
start "FODMAP Backend" cmd /k "cd app && npm start"

echo [3/3] Starting frontend...
start "FODMAP Frontend" cmd /k "cd frontend && npx http-server -p 3001"

echo.
echo ========================================
echo Services are starting...
echo ========================================
echo Backend API:  http://localhost:3000
echo Frontend:     http://localhost:3001
echo Admin Panel:  http://localhost:3001/admin.html
echo.
echo Admin Password: Dupadupa123
echo.
echo The backend may take 1-2 minutes to fully start.
echo You can check service status with: npm run health
echo.
echo Opening admin panel in 15 seconds...
timeout /t 15 /nobreak >nul
start http://localhost:3001/admin.html

echo.
echo All services started successfully!
echo Use Ctrl+C in the terminal windows to stop services.
pause
