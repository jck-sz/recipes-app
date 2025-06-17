# Apply Performance Indexes Migration (PowerShell)
# This script applies additional database indexes for improved performance

Write-Host "Applying performance indexes migration..." -ForegroundColor Green

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "Error: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL to your PostgreSQL connection string" -ForegroundColor Yellow
    Write-Host "Example: `$env:DATABASE_URL='postgresql://username:password@localhost:5432/database_name'" -ForegroundColor Yellow
    exit 1
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Apply the performance indexes
Write-Host "Creating performance indexes..." -ForegroundColor Blue
try {
    psql $env:DATABASE_URL -f "$scriptDir\performance_indexes.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Performance indexes applied successfully!" -ForegroundColor Green
        Write-Host "Database performance should be improved for common query patterns." -ForegroundColor Green
    } else {
        Write-Host "Error applying performance indexes. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error executing psql command: $_" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL client tools are installed and in your PATH." -ForegroundColor Yellow
    exit 1
}
