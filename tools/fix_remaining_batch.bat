@echo off
chcp 65001 >nul
echo Fixing remaining Polish ingredients...

echo Creating JSON files...
echo {"name": "Sól morska", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_35.json
echo {"name": "Mąka ryżowa", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_39.json
echo {"name": "Siemię lniane mielone", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_40.json
echo {"name": "Masło klarowane", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_41.json
echo {"name": "Borówki", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_43.json
echo {"name": "Wołowina", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_46.json
echo {"name": "Ryż brązowy", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_47.json
echo {"name": "Pierś indyka", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_70.json

echo Updating ingredients with delays...

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/35" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_35.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/39" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_39.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/40" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_40.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/41" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_41.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/43" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_43.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/46" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_46.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/47" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_47.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/70" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_70.json"

echo.
echo All ingredients updated!
echo Testing...
curl "http://localhost:3000/recipes/1"

echo.
echo Done!
