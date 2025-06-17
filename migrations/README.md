# Database Schema Enhancements

This document describes the database schema enhancements implemented for the FODMAP application.

## Changes Made

### 1. Recipes Table Enhancements
- **serving_size** (INT): Number of servings the recipe makes
- **image_url** (VARCHAR(500)): URL to recipe image
- **created_by** (VARCHAR(255)): User who created the recipe (for future auth)
- **updated_by** (VARCHAR(255)): User who last updated the recipe (for future auth)

### 2. Ingredients Table Enhancements
- **fodmap_level** (VARCHAR(10)): FODMAP level with CHECK constraint (LOW/MODERATE/HIGH)

### 3. Performance Indexes
- `idx_recipes_title`: Index on recipes.title for faster recipe searches
- `idx_ingredients_name`: Index on ingredients.name for faster ingredient lookups
- `idx_recipes_category_id`: Index on recipes.category_id for faster category filtering
- `idx_ingredients_fodmap_level`: Index on ingredients.fodmap_level for FODMAP filtering

### 4. Sample Data Added

#### Categories (already existed)
- Śniadanie (Breakfast)
- Obiad (Lunch)
- Kolacja (Dinner)
- Przekąska (Snack)

#### Ingredients with FODMAP Levels
**LOW FODMAP:**
- Marchew (Carrots)
- Ziemniaki (Potatoes)
- Szpinak (Spinach)
- Pomidory (Tomatoes)
- Ogórki (Cucumbers)
- Kurczak (Chicken)
- Łosoś (Salmon)
- Jajka (Eggs)
- Ryż (Rice)
- Quinoa
- Oliwa z oliwek (Olive oil)
- Masło (Butter)

**MODERATE FODMAP:**
- Jabłko (Apple)
- Awokado (Avocado)
- Brokuły (Broccoli)
- Kapusta (Cabbage)

**HIGH FODMAP:**
- Cebula (Onion)
- Czosnek (Garlic)
- Fasola (Beans)
- Mleko (Milk)

#### Tags
- Bezglutenowe (Gluten-free)
- Wegetariańskie (Vegetarian)
- Wegańskie (Vegan)
- Niskokaloryczne (Low-calorie)
- Wysokobiałkowe (High-protein)
- Szybkie (Quick)
- Łatwe (Easy)
- Zdrowe (Healthy)
- Comfort food
- Dietetyczne (Dietary)

#### Sample Recipes
- Sałatka z marchewką i szpinakiem (Carrot and spinach salad)
- Grillowany łosoś z ryżem (Grilled salmon with rice)
- Jajecznica z pomidorami (Scrambled eggs with tomatoes)

## How to Apply Changes

### For New Database Setup
The changes are already included in the main migration files:
- `init.sh` - Used by Docker initialization
- `init.sql` - Standalone SQL file

### For Existing Database
Use one of the following methods:

#### Method 1: Using the Enhancement Script (Linux/Mac)
```bash
./migrations/apply_enhancements.sh
```

#### Method 2: Using PowerShell (Windows)
```powershell
./migrations/apply_enhancements.ps1
```

#### Method 3: Manual SQL Execution
```bash
psql -h localhost -p 5432 -U your_user -d your_database -f migrations/schema_enhancements.sql
```

## Environment Variables Required
Make sure your `.env` file contains:
```
APP_DB_USER=your_app_user
APP_DB_PASSWORD=your_password
POSTGRES_DB=your_database_name
```

## Verification
After applying the changes, you can verify them by:

1. **Check table structure:**
   ```sql
   \d recipes
   \d ingredients
   ```

2. **Check sample data:**
   ```sql
   SELECT COUNT(*) FROM ingredients WHERE fodmap_level IS NOT NULL;
   SELECT fodmap_level, COUNT(*) FROM ingredients GROUP BY fodmap_level;
   ```

3. **Check indexes:**
   ```sql
   \di
   ```

## Database Schema Diagram
The enhanced schema includes:
- Recipes with serving size, image URL, and audit fields
- Ingredients with FODMAP levels
- Performance indexes for common queries
- Rich sample data for testing and development

## Future Considerations
- The `created_by` and `updated_by` fields are prepared for future user authentication
- FODMAP levels can be used for dietary filtering
- Indexes will improve performance as the dataset grows
- Sample data provides a good foundation for testing and development
