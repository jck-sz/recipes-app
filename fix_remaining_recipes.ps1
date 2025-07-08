# Set UTF-8 encoding for PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$API_BASE = "http://localhost:3000"

Write-Host "Fixing remaining recipes with Polish characters..." -ForegroundColor Green

# Recipe 12 - Omlet
$recipe12 = @{
    title = "Omlet z żółtek z cukinią i szpinakiem LOW FODMAP"
    description = "Lekki omlet z żółtek bez białka kurzego z warzywami Low FODMAP. 385 kcal | 15 min. Przygotowanie żelkowanego siemienia: Siemię + woda wymieszać, odstawić na 5 min (zrobi się żelowate). Żółtka + żel z siemienia ubić razem. Przygotowanie składników (3 min): Żółtka ostrożnie oddzielić od białek (białka zachować na inne cele). Żółtka ubić widelcem z solą i pieprzem. Cukinię pokroić w kostki 0,5cm. Szpinak umyć i osuszyć. Warzywa (4 min): Na patelni rozgrzać połowę oleju. Cukinię smażyć 2-3 minuty do lekkiego zrumienienia. Dodać szpinak, smażyć 1 minutę do zwiędnięcia. Przełożyć warzywa na talerz, przyprawić solą. Omlet z żółtek (3 min): Tę samą patelnię wyczyścić, rozgrzać z resztą oleju. Wlać żółtka - będą gęstsze niż zwykłe jajka. Po 30 sekundach dodać warzywa na połowę omletu. Smażyć 2 minuty na średnim ogniu. Złożyć na pół łopatką. Posypać koperkiem. Podawanie: Przełożyć na talerz. Podawać z pieczonym chlebem bezglutenowym. Można skropić kroplą oleju oliwkowego."
    preparation_time = 15
    serving_size = 1
    category_id = 3
    created_by = "system"
    ingredients = @(
        @{ingredient_id = 37; quantity = 4},
        @{ingredient_id = 40; quantity = 5},
        @{ingredient_id = 9; quantity = 100},
        @{ingredient_id = 4; quantity = 50},
        @{ingredient_id = 48; quantity = 15},
        @{ingredient_id = 86; quantity = 2},
        @{ingredient_id = 73; quantity = 5},
        @{ingredient_id = 35; quantity = 2},
        @{ingredient_id = 74; quantity = 1},
        @{ingredient_id = 77; quantity = 2}
    )
    tags = @(3, 5)
} | ConvertTo-Json -Depth 10

# Recipe 14 - Stir-fry
$recipe14 = @{
    title = "Stir-fry indyk z warzywami LOW FODMAP"
    description = "Azjatyckie stir-fry z indykiem i warzywami Low FODMAP. 480 kcal | 15 min. Przygotowanie składników (5 min): Indyka pokroić w paski 1cm x 5cm (w poprzek włókien). Cukinię pokroić w paski lub półplastry. Marchew pokroić w cienkie paski. Paprykę pokroić w cienkie paski (MAX 40g - limit Low FODMAP). Imbir obrać i zetrzeć na tarce. Szczypiorek pokroić (tylko zielone części). Marynata dla indyka (2 min): Indyka włożyć do miski. Dodać imbir + pieprz. Wymieszać, zostawić na 5 minut. Stir-fry - smażenie (8 min): Wok lub dużą patelnię rozgrzać na wysokim ogniu. Dodać olej rzepakowy (wędruje po całej patelni). Indyka smażyć 2-3 minuty (nie mieszać za często!). Dodać marchew - smażyć 2 minuty. Dodać paprykę - smażyć 1 minutę. Dodać cukinię - smażyć 1-2 minuty (powinna być al dente). Finalizacja (2 min): Dodać ocet ryżowy. Smażyć 30 sekund (sos powinien syczec). Zdjąć z ognia, dodać olej sezamowy. Wymieszać delikatnie. Posypać nasionami sezamu i szczypiorkiem. WAŻNE Low FODMAP: Papryka czerwona: 40g (limit: 43g) ✅, Cukinia: 120g (low FODMAP bez limitu) ✅, Marchewka: 100g (low FODMAP bez limitu) ✅, Szczypiorek: tylko zielone części (białe = high FODMAP!) ❌. Technika stir-fry: Wysoka temperatura, Wok rozgrzany do smoke point, składniki dodawane szybko. Kolejność: Mięso (najdłużej) → Twarde warzywa → Średnie → Miękkie → Sosy na końcu. Olej sezamowy: Low FODMAP w umiarkowanych ilościach, dodawać na końcu. Wszystkie składniki przygotuj wcześniej, nie przeciążaj patelni. Z ryżem: Podawaj z 50g ryżu brązowego ugotowanego osobno (~650 kcal razem). Zdrowe tłuszcze z oleju sezamowego!"
    preparation_time = 15
    serving_size = 1
    category_id = 3
    created_by = "system"
    ingredients = @(
        @{ingredient_id = 70; quantity = 100},
        @{ingredient_id = 9; quantity = 120},
        @{ingredient_id = 3; quantity = 100},
        @{ingredient_id = 8; quantity = 40},
        @{ingredient_id = 79; quantity = 15},
        @{ingredient_id = 48; quantity = 15},
        @{ingredient_id = 80; quantity = 5},
        @{ingredient_id = 81; quantity = 5},
        @{ingredient_id = 82; quantity = 5},
        @{ingredient_id = 83; quantity = 5},
        @{ingredient_id = 35; quantity = 2},
        @{ingredient_id = 57; quantity = 1}
    )
    tags = @(4, 5)
} | ConvertTo-Json -Depth 10

# Recipe 15 - Szprotki
$recipe15 = @{
    title = "Szprotki z ziemniakami i ogórkiem LOW FODMAP"
    description = "Proste i zdrowe danie z szprotkami, ziemniakami i świeżym ogórkiem Low FODMAP. 395 kcal | 20 min. Ziemniaki (15 min): Ziemniaki umyć, można nie obierać (jeśli młode). Ugotować w osolonej wodzie 12-15 minut do miękkości. Odsączyć, ostudzić 5 minut. Pokroić w plastry 1cm. Przyprawić solą, pieprzem, skropić oliwą. Ogórki (5 min): Ogórki umyć, pokroić w cienkie plastry lub małe kostki. Posypać szczyptą soli, zostawić 5 minut (wypuszczą wodę). Odsączyć z nadmiaru wody. Skropić octem jabłkowym i sokiem z cytryny. Posypać koperkiem. Przygotowanie szprotek (3 min): Szprotki ostrożnie wyjąć z puszki (są delikatne!). Odsączyć z oleju (zachować 1 łyżkę). Rozłożyć na talerzu całe (nie dzielić). Skropić sokiem z cytryny. Przyprawić białym pieprzem. Komponowanie posiłku (2 min): Na talerz ułożyć listki sałaty jako podstawę. Ziemniaki ułożyć z jednej strony. Ogórki z drugiej strony. Szprotki delikatnie ułożyć na środku. Polać całość olejem z puszki + oliwa. Posypać świeżym koperkiem. Bogate w omega-3 ze szprotek!"
    preparation_time = 20
    serving_size = 1
    category_id = 3
    created_by = "system"
    ingredients = @(
        @{ingredient_id = 84; quantity = 110},
        @{ingredient_id = 11; quantity = 150},
        @{ingredient_id = 6; quantity = 100},
        @{ingredient_id = 20; quantity = 15},
        @{ingredient_id = 73; quantity = 5},
        @{ingredient_id = 64; quantity = 10},
        @{ingredient_id = 35; quantity = 2},
        @{ingredient_id = 74; quantity = 1},
        @{ingredient_id = 7; quantity = 30},
        @{ingredient_id = 85; quantity = 5}
    )
    tags = @(4, 5)
} | ConvertTo-Json -Depth 10

# Update recipes
try {
    Write-Host "Updating recipe 12..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$API_BASE/recipes/12" -Method PUT -Body $recipe12 -ContentType "application/json; charset=utf-8"
    Write-Host "Recipe 12 updated successfully!" -ForegroundColor Green
    
    Write-Host "Updating recipe 14..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$API_BASE/recipes/14" -Method PUT -Body $recipe14 -ContentType "application/json; charset=utf-8"
    Write-Host "Recipe 14 updated successfully!" -ForegroundColor Green
    
    Write-Host "Updating recipe 15..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$API_BASE/recipes/15" -Method PUT -Body $recipe15 -ContentType "application/json; charset=utf-8"
    Write-Host "Recipe 15 updated successfully!" -ForegroundColor Green
    
    Write-Host "All remaining recipes updated with proper Polish encoding!" -ForegroundColor Green
}
catch {
    Write-Host "Error updating recipes: $($_.Exception.Message)" -ForegroundColor Red
}
