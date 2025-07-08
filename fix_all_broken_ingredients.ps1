# Fix all broken Polish ingredients
$API_BASE = "http://localhost:3000"

Write-Host "Fixing ALL broken Polish ingredients..." -ForegroundColor Green

# All broken ingredients with correct Polish names
$brokenIngredients = @{
    32 = @{ name = "Mleko ryżowe"; quantity_unit = "ml"; fodmap_level = "LOW" }
    33 = @{ name = "Orzechy włoskie"; quantity_unit = "g"; fodmap_level = "LOW" }
    35 = @{ name = "Sól morska"; quantity_unit = "g"; fodmap_level = "LOW" }
    39 = @{ name = "Mąka ryżowa"; quantity_unit = "g"; fodmap_level = "LOW" }
    40 = @{ name = "Siemię lniane mielone"; quantity_unit = "g"; fodmap_level = "LOW" }
    41 = @{ name = "Masło klarowane"; quantity_unit = "g"; fodmap_level = "LOW" }
    43 = @{ name = "Borówki"; quantity_unit = "g"; fodmap_level = "LOW" }
    46 = @{ name = "Wołowina"; quantity_unit = "g"; fodmap_level = "LOW" }
    47 = @{ name = "Ryż brązowy"; quantity_unit = "g"; fodmap_level = "LOW" }
    70 = @{ name = "Pierś indyka"; quantity_unit = "g"; fodmap_level = "LOW" }
}

function Fix-Ingredient {
    param(
        [int]$Id,
        [hashtable]$Data
    )
    
    # Create JSON file
    $jsonFile = "ingredient_$Id.json"
    $jsonContent = @{
        name = $Data.name
        quantity_unit = $Data.quantity_unit
        fodmap_level = $Data.fodmap_level
    } | ConvertTo-Json -Depth 10
    
    # Save with UTF-8 encoding
    [System.IO.File]::WriteAllText($jsonFile, $jsonContent, [System.Text.Encoding]::UTF8)
    
    try {
        # Use curl to update
        $result = & curl -X PUT "$API_BASE/ingredients/$Id" -H "Content-Type: application/json; charset=utf-8" -d "@$jsonFile" 2>&1
        
        if ($result -match '"error":false') {
            Write-Host "✅ Fixed ingredient $Id`: $($Data.name)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Failed ingredient $Id`: $result" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error updating ingredient $Id`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        # Clean up JSON file
        if (Test-Path $jsonFile) {
            Remove-Item $jsonFile -Force
        }
    }
    
    Start-Sleep -Seconds 5
}

$successCount = 0
$totalCount = $brokenIngredients.Count

Write-Host "Processing $totalCount broken ingredients..." -ForegroundColor Yellow

foreach ($ingredientId in $brokenIngredients.Keys) {
    Write-Host "`nFixing ingredient $ingredientId..." -ForegroundColor Cyan
    $ingredientData = $brokenIngredients[$ingredientId]
    if (Fix-Ingredient -Id $ingredientId -Data $ingredientData) {
        $successCount++
    }
}

Write-Host "`n🎉 Ingredient encoding fix completed!" -ForegroundColor Green
Write-Host "Successfully fixed: $successCount/$totalCount ingredients" -ForegroundColor Cyan

# Test one recipe to verify
Write-Host "`nTesting recipe 1 to verify fixes..." -ForegroundColor Yellow
$testResult = & curl -s "$API_BASE/recipes/1"
if ($testResult -match '"Mleko ryżowe"') {
    Write-Host "✅ Verification successful - Polish characters are working!" -ForegroundColor Green
} else {
    Write-Host "❌ Verification failed - still seeing encoding issues" -ForegroundColor Red
}
