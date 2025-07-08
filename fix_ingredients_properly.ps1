$API_BASE = "http://localhost:3000"

Write-Host "Fixing ingredients with CORRECT Polish characters..." -ForegroundColor Green

# Correct Polish ingredient names based on the original source
$correctIngredients = @{
    37 = @{ name = "Żółtka jaj"; quantity_unit = "szt"; fodmap_level = "LOW" }
    31 = @{ name = "Płatki owsiane"; quantity_unit = "g"; fodmap_level = "LOW" }
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

function Update-Ingredient-Safely {
    param(
        [int]$Id,
        [hashtable]$IngredientData
    )
    
    # First check current state
    try {
        $current = Invoke-RestMethod -Uri "$API_BASE/ingredients/$Id" -Method GET
        Write-Host "Current: $($current.data.name) -> Target: $($IngredientData.name)" -ForegroundColor Yellow
        
        if ($current.data.name -eq $IngredientData.name) {
            Write-Host "Already correct: $($IngredientData.name)" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "Failed to check ingredient $Id" -ForegroundColor Red
        return $false
    }
    
    $body = @{
        name = $IngredientData.name
        quantity_unit = $IngredientData.quantity_unit
        fodmap_level = $IngredientData.fodmap_level
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri "$API_BASE/ingredients/$Id" -Method PUT -Body $body -ContentType "application/json; charset=utf-8" | Out-Null
        Write-Host "✅ Fixed: $($IngredientData.name)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to update ingredient $Id`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    Start-Sleep -Seconds 3
}

Write-Host "Checking and fixing ingredients one by one..." -ForegroundColor Yellow
Write-Host "This will take a while due to rate limiting..." -ForegroundColor Yellow

$successCount = 0
$totalCount = $correctIngredients.Count

foreach ($ingredientId in $correctIngredients.Keys) {
    Write-Host "`nProcessing ingredient $ingredientId..." -ForegroundColor Cyan
    $ingredientData = $correctIngredients[$ingredientId]
    if (Update-Ingredient-Safely -Id $ingredientId -IngredientData $ingredientData) {
        $successCount++
    }
}

Write-Host "`n🎉 Ingredient fix completed!" -ForegroundColor Green
Write-Host "Successfully updated: $successCount/$totalCount ingredients" -ForegroundColor Cyan
