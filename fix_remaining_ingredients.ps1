$API_BASE = "http://localhost:3000"

Write-Host "Fixing remaining Polish character encoding in ingredients..." -ForegroundColor Green

# Remaining ingredients that failed due to rate limiting
$remainingFixes = @{
    33 = @{ name = "Orzechy włoskie"; quantity_unit = "g"; fodmap_level = "LOW" }
    32 = @{ name = "Mleko ryżowe"; quantity_unit = "ml"; fodmap_level = "LOW" }
    31 = @{ name = "Płatki owsiane"; quantity_unit = "g"; fodmap_level = "LOW" }
    70 = @{ name = "Pierś indyka"; quantity_unit = "g"; fodmap_level = "LOW" }
    47 = @{ name = "Ryż brązowy"; quantity_unit = "g"; fodmap_level = "LOW" }
    46 = @{ name = "Wołowina"; quantity_unit = "g"; fodmap_level = "LOW" }
}

function Update-Ingredient {
    param(
        [int]$Id,
        [hashtable]$IngredientData
    )
    
    $body = @{
        name = $IngredientData.name
        quantity_unit = $IngredientData.quantity_unit
        fodmap_level = $IngredientData.fodmap_level
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri "$API_BASE/ingredients/$Id" -Method PUT -Body $body -ContentType "application/json; charset=utf-8" | Out-Null
        Write-Host "Updated ingredient $Id`: $($IngredientData.name)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Failed to update ingredient $Id`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    Start-Sleep -Seconds 2
}

$successCount = 0
$totalCount = $remainingFixes.Count

Write-Host "Updating $totalCount remaining ingredients..." -ForegroundColor Yellow

foreach ($ingredientId in $remainingFixes.Keys) {
    $ingredientData = $remainingFixes[$ingredientId]
    if (Update-Ingredient -Id $ingredientId -IngredientData $ingredientData) {
        $successCount++
    }
}

Write-Host ""
Write-Host "Remaining ingredient encoding fix completed!" -ForegroundColor Green
Write-Host "Successfully updated: $successCount/$totalCount ingredients" -ForegroundColor Cyan
