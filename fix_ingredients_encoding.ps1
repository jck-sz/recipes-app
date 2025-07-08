$API_BASE = "http://localhost:3000"

Write-Host "Fixing Polish character encoding in ALL ingredients..." -ForegroundColor Green

# Mapping of corrupted ingredient names to correct Polish names with full data
$ingredientFixes = @{
    37 = @{ name = "Żółtka jaj"; quantity_unit = "szt"; fodmap_level = "LOW" }
    39 = @{ name = "Mąka ryżowa"; quantity_unit = "g"; fodmap_level = "LOW" }
    31 = @{ name = "Płatki owsiane"; quantity_unit = "g"; fodmap_level = "LOW" }
    46 = @{ name = "Wołowina"; quantity_unit = "g"; fodmap_level = "LOW" }
    35 = @{ name = "Sól morska"; quantity_unit = "g"; fodmap_level = "LOW" }
    32 = @{ name = "Mleko ryżowe"; quantity_unit = "ml"; fodmap_level = "LOW" }
    33 = @{ name = "Orzechy włoskie"; quantity_unit = "g"; fodmap_level = "LOW" }
    41 = @{ name = "Masło klarowane"; quantity_unit = "g"; fodmap_level = "LOW" }
    43 = @{ name = "Borówki"; quantity_unit = "g"; fodmap_level = "LOW" }
    47 = @{ name = "Ryż brązowy"; quantity_unit = "g"; fodmap_level = "LOW" }
    40 = @{ name = "Siemię lniane mielone"; quantity_unit = "g"; fodmap_level = "LOW" }
    58 = @{ name = "Indyk"; quantity_unit = "g"; fodmap_level = "LOW" }
    70 = @{ name = "Pierś indyka"; quantity_unit = "g"; fodmap_level = "LOW" }
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
        $response = Invoke-RestMethod -Uri "$API_BASE/ingredients/$Id" -Method PUT -Body $body -ContentType "application/json; charset=utf-8"
        Write-Host "Updated ingredient $Id`: $($IngredientData.name)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Failed to update ingredient $Id`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }

    Start-Sleep -Milliseconds 300
}

$successCount = 0
$totalCount = $ingredientFixes.Count

Write-Host "Updating $totalCount corrupted ingredients..." -ForegroundColor Yellow

foreach ($ingredientId in $ingredientFixes.Keys) {
    $ingredientData = $ingredientFixes[$ingredientId]
    if (Update-Ingredient -Id $ingredientId -IngredientData $ingredientData) {
        $successCount++
    }
}

Write-Host ""
Write-Host "Ingredient encoding fix completed!" -ForegroundColor Green
Write-Host "Successfully updated: $successCount/$totalCount ingredients" -ForegroundColor Cyan
