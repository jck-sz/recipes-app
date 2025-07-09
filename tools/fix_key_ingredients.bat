@echo off
chcp 65001 >nul
echo Fixing key Polish ingredients...

echo Creating ingredient files...

echo {"name": "Mleko ryżowe", "quantity_unit": "ml", "fodmap_level": "LOW"} > ingredient_32.json
echo {"name": "Orzechy włoskie", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_33.json
echo {"name": "Mąka ryżowa", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_39.json
echo {"name": "Wołowina", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_46.json
echo {"name": "Ryż brązowy", "quantity_unit": "g", "fodmap_level": "LOW"} > ingredient_47.json

echo Updating ingredients...

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/32" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_32.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/33" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_33.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/39" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_39.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/46" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_46.json"

timeout /t 5 /nobreak >nul
curl -X PUT "http://localhost:3000/ingredients/47" -H "Content-Type: application/json; charset=utf-8" -d "@ingredient_47.json"

echo Done!
pause
