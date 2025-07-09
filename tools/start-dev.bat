@echo off
echo Starting FODMAP Development Environment...
echo.

if "%1"=="frontend" (
    echo Starting frontend only...
    start "FODMAP Frontend" cmd /k "cd frontend && npx http-server -p 3001"
    timeout /t 3 /nobreak >nul
    echo Frontend: http://localhost:3001/admin.html
    echo Password: Dupadupa123
    start http://localhost:3001/admin.html
    goto :end
)

if "%1"=="help" (
    echo Usage: start-dev.bat [frontend^|help]
    echo.
    echo   start-dev.bat          - Start both backend and frontend
    echo   start-dev.bat frontend - Start frontend only
    echo   start-dev.bat help     - Show this help
    echo.
    echo Services:
    echo   Frontend: http://localhost:3001/admin.html
    echo   Password: Dupadupa123
    goto :end
)

echo Starting backend (Docker)...
start "FODMAP Backend" cmd /k "cd docker && npm run setup"

echo Starting frontend...
start "FODMAP Frontend" cmd /k "cd frontend && npx http-server -p 3001"

timeout /t 5 /nobreak >nul
echo.
echo Services starting...
echo Frontend: http://localhost:3001/admin.html
echo Password: Dupadupa123
echo.
echo Opening admin panel...
timeout /t 2 /nobreak >nul
start http://localhost:3001/admin.html

:end
echo.
echo Development environment ready!
pause
