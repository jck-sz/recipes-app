-- Database Schema Enhancements Migration
-- This script adds the requested enhancements to the existing database structure

-- 1. Add new fields to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS serving_size INT,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- 2. Add fodmap_level field to ingredients table
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS fodmap_level VARCHAR(10) CHECK (fodmap_level IN ('LOW', 'MODERATE', 'HIGH'));

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_fodmap_level ON ingredients(fodmap_level);

-- 4. Insert sample ingredients with FODMAP levels
INSERT INTO ingredients (name, quantity_unit, fodmap_level) VALUES 
    ('Marchew', 'g', 'LOW'),
    ('Ziemniaki', 'g', 'LOW'),
    ('Szpinak', 'g', 'LOW'),
    ('Pomidory', 'g', 'LOW'),
    ('Ogórki', 'g', 'LOW'),
    ('Kurczak', 'g', 'LOW'),
    ('Łosoś', 'g', 'LOW'),
    ('Jajka', 'szt', 'LOW'),
    ('Ryż', 'g', 'LOW'),
    ('Quinoa', 'g', 'LOW'),
    ('Oliwa z oliwek', 'ml', 'LOW'),
    ('Masło', 'g', 'LOW'),
    ('Cebula', 'g', 'HIGH'),
    ('Czosnek', 'ząbek', 'HIGH'),
    ('Fasola', 'g', 'HIGH'),
    ('Mleko', 'ml', 'HIGH'),
    ('Jabłko', 'szt', 'MODERATE'),
    ('Awokado', 'szt', 'MODERATE'),
    ('Brokuły', 'g', 'MODERATE'),
    ('Kapusta', 'g', 'MODERATE')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert sample tags
INSERT INTO tags (name) VALUES 
    ('Bezglutenowe'),
    ('Wegetariańskie'),
    ('Wegańskie'),
    ('Niskokaloryczne'),
    ('Wysokobiałkowe'),
    ('Szybkie'),
    ('Łatwe'),
    ('Zdrowe'),
    ('Comfort food'),
    ('Dietetyczne')
ON CONFLICT (name) DO NOTHING;

-- 6. Insert sample recipes (optional - demonstrating the new fields)
INSERT INTO recipes (title, description, preparation_time, serving_size, image_url, category_id, created_by) VALUES 
    ('Sałatka z marchewką i szpinakiem', 'Zdrowa sałatka z niskoFODMAP składnikami', 15, 2, 'https://example.com/salad.jpg', 1, 'system'),
    ('Grillowany łosoś z ryżem', 'Pyszny łosoś z ryżem i warzywami', 30, 4, 'https://example.com/salmon.jpg', 2, 'system'),
    ('Jajecznica z pomidorami', 'Szybka jajecznica na śniadanie', 10, 1, 'https://example.com/eggs.jpg', 1, 'system')
ON CONFLICT DO NOTHING;

-- 7. Add some sample recipe-ingredient relationships
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) 
SELECT r.id, i.id, 100.0
FROM recipes r, ingredients i 
WHERE r.title = 'Sałatka z marchewką i szpinakiem' AND i.name IN ('Marchew', 'Szpinak')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) 
SELECT r.id, i.id, 
    CASE 
        WHEN i.name = 'Łosoś' THEN 200.0
        WHEN i.name = 'Ryż' THEN 150.0
        ELSE 50.0
    END
FROM recipes r, ingredients i 
WHERE r.title = 'Grillowany łosoś z ryżem' AND i.name IN ('Łosoś', 'Ryż', 'Oliwa z oliwek')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) 
SELECT r.id, i.id, 
    CASE 
        WHEN i.name = 'Jajka' THEN 2.0
        WHEN i.name = 'Pomidory' THEN 100.0
        ELSE 10.0
    END
FROM recipes r, ingredients i 
WHERE r.title = 'Jajecznica z pomidorami' AND i.name IN ('Jajka', 'Pomidory', 'Masło')
ON CONFLICT DO NOTHING;

-- 8. Add some sample recipe-tag relationships
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipes r, tags t 
WHERE r.title = 'Sałatka z marchewką i szpinakiem' AND t.name IN ('Zdrowe', 'Wegetariańskie', 'Niskokaloryczne')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipes r, tags t 
WHERE r.title = 'Grillowany łosoś z ryżem' AND t.name IN ('Zdrowe', 'Wysokobiałkowe')
ON CONFLICT DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipes r, tags t 
WHERE r.title = 'Jajecznica z pomidorami' AND t.name IN ('Szybkie', 'Łatwe', 'Wegetariańskie')
ON CONFLICT DO NOTHING;
