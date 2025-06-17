#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "Applying database schema enhancements..."

# Apply the schema enhancements
psql -h localhost -p 5432 -U ${APP_DB_USER} -d ${POSTGRES_DB} -f migrations/schema_enhancements.sql

echo "Database schema enhancements applied successfully!"

# Optional: Show the updated table structures
echo ""
echo "Updated table structures:"
echo "========================"

echo ""
echo "Recipes table:"
psql -h localhost -p 5432 -U ${APP_DB_USER} -d ${POSTGRES_DB} -c "\d recipes"

echo ""
echo "Ingredients table:"
psql -h localhost -p 5432 -U ${APP_DB_USER} -d ${POSTGRES_DB} -c "\d ingredients"

echo ""
echo "Sample data counts:"
echo "==================="
psql -h localhost -p 5432 -U ${APP_DB_USER} -d ${POSTGRES_DB} -c "
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
"

echo ""
echo "FODMAP level distribution:"
psql -h localhost -p 5432 -U ${APP_DB_USER} -d ${POSTGRES_DB} -c "
SELECT 
    fodmap_level, 
    COUNT(*) as ingredient_count 
FROM ingredients 
WHERE fodmap_level IS NOT NULL 
GROUP BY fodmap_level 
ORDER BY fodmap_level;
"
