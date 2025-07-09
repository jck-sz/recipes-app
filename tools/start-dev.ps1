# FODMAP Development Environment Startup Script
param(
    [switch]$Help,
    [switch]$FrontendOnly
)

if ($Help) {
    Write-Host "FODMAP Development Environment" -ForegroundColor Cyan
    Write-Host "Usage: .\start-dev.ps1 [-FrontendOnly] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:3001/admin.html"
    Write-Host "  Password: Dupadupa123"
    exit 0
}

Write-Host "Starting FODMAP Development Environment..." -ForegroundColor Green

if (-not $FrontendOnly) {
    Write-Host "Starting backend (Docker)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd docker; npm run setup" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

Write-Host "Starting frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npx http-server -p 3001" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Services starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3001/admin.html" -ForegroundColor Green
Write-Host "Password: Dupadupa123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening admin panel..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:3001/admin.html"
