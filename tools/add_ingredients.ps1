$API_BASE = "http://localhost:3000"

Write-Host "Adding missing ingredients to the database..." -ForegroundColor Green

function Add-Ingredient {
    param(
        [string]$Name,
        [string]$Unit,
        [string]$FodmapLevel
    )
    
    $body = @{
        name = $Name
        quantity_unit = $Unit
        fodmap_level = $FodmapLevel
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/ingredients" -Method POST -Body $body -ContentType "application/json"
        Write-Host "Added: $Name ($FodmapLevel)" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "Skipped: $Name (already exists)" -ForegroundColor Yellow
        }
        else {
            Write-Host "Failed to add $Name`: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# From Śniadania
Add-Ingredient "Płatki owsiane" "g" "LOW"
Add-Ingredient "Mleko ryżowe" "ml" "LOW"
Add-Ingredient "Orzechy włoskie" "g" "LOW"
Add-Ingredient "Olej kokosowy" "g" "LOW"
Add-Ingredient "Sól morska" "g" "LOW"
Add-Ingredient "Cynamon" "g" "LOW"
Add-Ingredient "Żółtka jaj" "szt" "LOW"
Add-Ingredient "Jogurt kokosowy" "ml" "LOW"
Add-Ingredient "Mąka ryżowa" "g" "LOW"
Add-Ingredient "Siemię lniane mielone" "g" "LOW"
Add-Ingredient "Masło klarowane" "g" "LOW"
Add-Ingredient "Ekstrakt waniliowy" "ml" "LOW"
Add-Ingredient "Borówki" "g" "LOW"
Add-Ingredient "Kiwi" "szt" "LOW"
Add-Ingredient "Syrop klonowy" "ml" "LOW"

# From Obiady
Add-Ingredient "Wołowina" "g" "LOW"
Add-Ingredient "Ryż brązowy" "g" "LOW"
Add-Ingredient "Olej rzepakowy" "ml" "LOW"
Add-Ingredient "Olej czosnkowy" "ml" "LOW"
Add-Ingredient "Koncentrat pomidorowy" "g" "LOW"
Add-Ingredient "Bulion wołowy" "ml" "LOW"
Add-Ingredient "Papryka słodka" "g" "LOW"
Add-Ingredient "Majeranek suszony" "g" "LOW"
Add-Ingredient "Tymianek" "g" "LOW"
Add-Ingredient "Liście laurowe" "szt" "LOW"
Add-Ingredient "Kminek" "g" "LOW"
Add-Ingredient "Pieprz czarny" "g" "LOW"
Add-Ingredient "Indyk" "g" "LOW"
Add-Ingredient "Bulion warzywny" "ml" "LOW"
Add-Ingredient "Jagnięcina mielona" "g" "LOW"
Add-Ingredient "Bułka tarta bezglutenowa" "g" "LOW"
Add-Ingredient "Rozmaryn świeży" "g" "LOW"
Add-Ingredient "Oregano" "g" "LOW"
Add-Ingredient "Sok z cytryny" "ml" "LOW"
Add-Ingredient "Fasolka szparagowa" "g" "LOW"

# From Przekąski
Add-Ingredient "Melon kantalupa" "g" "LOW"
Add-Ingredient "Mleko owsiane" "ml" "LOW"
Add-Ingredient "Miód" "g" "MODERATE"
Add-Ingredient "Mięta świeża" "g" "LOW"

# From Kolacje
Add-Ingredient "Pierś indyka" "g" "LOW"
Add-Ingredient "Bazylia suszona" "g" "LOW"
Add-Ingredient "Filet z łososia" "g" "LOW"
Add-Ingredient "Koper świeży" "g" "LOW"
Add-Ingredient "Pieprz biały" "g" "LOW"
Add-Ingredient "Mozzarella di bufala" "g" "LOW"
Add-Ingredient "Roszponka" "g" "LOW"
Add-Ingredient "Bazylia świeża" "g" "LOW"
Add-Ingredient "Ocet balsamiczny" "ml" "LOW"
Add-Ingredient "Olej sezamowy" "ml" "LOW"
Add-Ingredient "Ocet ryżowy" "ml" "LOW"
Add-Ingredient "Imbir świeży" "g" "LOW"
Add-Ingredient "Nasiona sezamu" "g" "LOW"
Add-Ingredient "Szczypiorek" "g" "LOW"
Add-Ingredient "Szprotki w oleju" "g" "LOW"
Add-Ingredient "Ocet jabłkowy" "ml" "LOW"
Add-Ingredient "Chleb bezglutenowy" "kromka" "LOW"

Write-Host ""
Write-Host "Finished adding ingredients!" -ForegroundColor Green
