#!/bin/bash

API_BASE="http://localhost:3000"

echo "🌱 Adding missing ingredients to the database..."

# Function to add ingredient
add_ingredient() {
    local name="$1"
    local unit="$2"
    local fodmap="$3"
    
    response=$(curl -s -w "%{http_code}" -X POST "$API_BASE/ingredients" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$name\",\"quantity_unit\":\"$unit\",\"fodmap_level\":\"$fodmap\"}")
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "201" ]; then
        echo "✅ Added: $name ($fodmap)"
    elif [ "$http_code" = "409" ]; then
        echo "⏭️  Skipped: $name (already exists)"
    else
        echo "❌ Failed to add $name: HTTP $http_code"
    fi
}

# From Śniadania
add_ingredient "Płatki owsiane" "g" "LOW"
add_ingredient "Mleko ryżowe" "ml" "LOW"
add_ingredient "Orzechy włoskie" "g" "LOW"
add_ingredient "Olej kokosowy" "g" "LOW"
add_ingredient "Sól morska" "g" "LOW"
add_ingredient "Cynamon" "g" "LOW"
add_ingredient "Żółtka jaj" "szt" "LOW"
add_ingredient "Jogurt kokosowy" "ml" "LOW"
add_ingredient "Mąka ryżowa" "g" "LOW"
add_ingredient "Siemię lniane mielone" "g" "LOW"
add_ingredient "Masło klarowane" "g" "LOW"
add_ingredient "Ekstrakt waniliowy" "ml" "LOW"
add_ingredient "Borówki" "g" "LOW"
add_ingredient "Kiwi" "szt" "LOW"
add_ingredient "Syrop klonowy" "ml" "LOW"

# From Obiady
add_ingredient "Wołowina" "g" "LOW"
add_ingredient "Ryż brązowy" "g" "LOW"
add_ingredient "Olej rzepakowy" "ml" "LOW"
add_ingredient "Olej czosnkowy" "ml" "LOW"
add_ingredient "Koncentrat pomidorowy" "g" "LOW"
add_ingredient "Bulion wołowy" "ml" "LOW"
add_ingredient "Papryka słodka" "g" "LOW"
add_ingredient "Majeranek suszony" "g" "LOW"
add_ingredient "Tymianek" "g" "LOW"
add_ingredient "Liście laurowe" "szt" "LOW"
add_ingredient "Kminek" "g" "LOW"
add_ingredient "Pieprz czarny" "g" "LOW"
add_ingredient "Indyk" "g" "LOW"
add_ingredient "Bulion warzywny" "ml" "LOW"
add_ingredient "Jagnięcina mielona" "g" "LOW"
add_ingredient "Bułka tarta bezglutenowa" "g" "LOW"
add_ingredient "Rozmaryn świeży" "g" "LOW"
add_ingredient "Oregano" "g" "LOW"
add_ingredient "Sok z cytryny" "ml" "LOW"
add_ingredient "Fasolka szparagowa" "g" "LOW"

# From Przekąski
add_ingredient "Melon kantalupa" "g" "LOW"
add_ingredient "Mleko owsiane" "ml" "LOW"
add_ingredient "Miód" "g" "MODERATE"
add_ingredient "Mięta świeża" "g" "LOW"

# From Kolacje
add_ingredient "Pierś indyka" "g" "LOW"
add_ingredient "Bazylia suszona" "g" "LOW"
add_ingredient "Filet z łososia" "g" "LOW"
add_ingredient "Koper świeży" "g" "LOW"
add_ingredient "Pieprz biały" "g" "LOW"
add_ingredient "Mozzarella di bufala" "g" "LOW"
add_ingredient "Roszponka" "g" "LOW"
add_ingredient "Bazylia świeża" "g" "LOW"
add_ingredient "Ocet balsamiczny" "ml" "LOW"
add_ingredient "Olej sezamowy" "ml" "LOW"
add_ingredient "Ocet ryżowy" "ml" "LOW"
add_ingredient "Imbir świeży" "g" "LOW"
add_ingredient "Nasiona sezamu" "g" "LOW"
add_ingredient "Szczypiorek" "g" "LOW"
add_ingredient "Szprotki w oleju" "g" "LOW"
add_ingredient "Ocet jabłkowy" "ml" "LOW"
add_ingredient "Chleb bezglutenowy" "kromka" "LOW"

echo ""
echo "📊 Finished adding ingredients!"
