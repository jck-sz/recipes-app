# PowerShell script to apply database schema enhancements
param(
    [string]$EnvFile = ".env"
)

# Function to load environment variables from .env file
function Load-EnvFile {
    param([string]$Path)
    
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
        Write-Host "Environment variables loaded from $Path"
    } else {
        Write-Warning "Environment file $Path not found"
    }
}

# Load environment variables
Load-EnvFile -Path $EnvFile

# Get environment variables
$APP_DB_USER = $env:APP_DB_USER
$POSTGRES_DB = $env:POSTGRES_DB
$APP_DB_PASSWORD = $env:APP_DB_PASSWORD

if (-not $APP_DB_USER -or -not $POSTGRES_DB) {
    Write-Error "Required environment variables not found. Please check your .env file."
    exit 1
}

Write-Host "Applying database schema enhancements..." -ForegroundColor Green

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $APP_DB_PASSWORD

try {
    # Apply the schema enhancements
    psql -h localhost -p 5432 -U $APP_DB_USER -d $POSTGRES_DB -f migrations/schema_enhancements.sql
    
    Write-Host "Database schema enhancements applied successfully!" -ForegroundColor Green
    
    # Optional: Show the updated table structures
    Write-Host ""
    Write-Host "Updated table structures:" -ForegroundColor Yellow
    Write-Host "========================" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Recipes table:" -ForegroundColor Cyan
    psql -h localhost -p 5432 -U $APP_DB_USER -d $POSTGRES_DB -c "\d recipes"
    
    Write-Host ""
    Write-Host "Ingredients table:" -ForegroundColor Cyan
    psql -h localhost -p 5432 -U $APP_DB_USER -d $POSTGRES_DB -c "\d ingredients"
    
    Write-Host ""
    Write-Host "Sample data counts:" -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Yellow
    psql -h localhost -p 5432 -U $APP_DB_USER -d $POSTGRES_DB -c @"
SELECT 
    'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 
    'Ingredients' as table_name, COUNT(*) as count FROM ingredients
UNION ALL
SELECT 
    'Tags' as table_name, COUNT(*) as count FROM tags
UNION ALL
SELECT 
    'Recipes' as table_name, COUNT(*) as count FROM recipes;
"@
    
    Write-Host ""
    Write-Host "FODMAP level distribution:" -ForegroundColor Yellow
    psql -h localhost -p 5432 -U $APP_DB_USER -d $POSTGRES_DB -c @"
SELECT 
    fodmap_level, 
    COUNT(*) as ingredient_count 
FROM ingredients 
WHERE fodmap_level IS NOT NULL 
GROUP BY fodmap_level 
ORDER BY fodmap_level;
"@

} catch {
    Write-Error "Failed to apply database enhancements: $_"
    exit 1
} finally {
    # Clear the password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
