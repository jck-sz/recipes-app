-- Database schema initialization for FODMAP application
-- This script creates all tables, indexes, and sample data
-- User creation is handled by 01-create-user.sh

-- Create tables with complete schema
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL CHECK (name IN ('Śniadanie', 'Obiad', 'Kolacja', 'Przekąska'))
);

CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    preparation_time INT,
    serving_size INT,
    image_url VARCHAR(500),
    category_id INT REFERENCES categories(id),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity_unit VARCHAR(50),
    fodmap_level VARCHAR(10) NOT NULL CHECK (fodmap_level IN ('LOW', 'MODERATE', 'HIGH')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS recipe_tags (
    id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id, tag_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_fodmap_level ON ingredients(fodmap_level);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag_id);

-- Insert sample categories
INSERT INTO categories (name) VALUES 
    ('Śniadanie'),
    ('Obiad'), 
    ('Kolacja'),
    ('Przekąska')
ON CONFLICT DO NOTHING;

-- Insert sample tags
INSERT INTO tags (name) VALUES 
    ('Wegetariańskie'),
    ('Wegańskie'),
    ('Bezglutenowe'),
    ('Szybkie'),
    ('Zdrowe'),
    ('Niskokaloryczne')
ON CONFLICT (name) DO NOTHING;

-- Insert sample ingredients with FODMAP levels
INSERT INTO ingredients (name, quantity_unit, fodmap_level) VALUES 
    ('Awokado', 'szt', 'MODERATE'),
    ('Brokuły', 'g', 'MODERATE'),
    ('Marchew', 'g', 'LOW'),
    ('Szpinak', 'g', 'LOW'),
    ('Pomidory', 'g', 'LOW'),
    ('Ogórki', 'g', 'LOW'),
    ('Sałata', 'g', 'LOW'),
    ('Papryka czerwona', 'g', 'LOW'),
    ('Cukinia', 'g', 'LOW'),
    ('Bakłażan', 'g', 'LOW'),
    ('Ziemniaki', 'g', 'LOW'),
    ('Bataty', 'g', 'LOW'),
    ('Ryż', 'g', 'LOW'),
    ('Quinoa', 'g', 'LOW'),
    ('Owies', 'g', 'LOW'),
    ('Kurczak', 'g', 'LOW'),
    ('Łosoś', 'g', 'LOW'),
    ('Jajka', 'szt', 'LOW'),
    ('Mleko migdałowe', 'ml', 'LOW'),
    ('Oliwa z oliwek', 'ml', 'LOW'),
    ('Czosnek', 'ząbek', 'HIGH'),
    ('Cebula', 'g', 'HIGH'),
    ('Fasola', 'g', 'HIGH'),
    ('Soczewica', 'g', 'HIGH'),
    ('Jabłka', 'szt', 'MODERATE'),
    ('Banany', 'szt', 'LOW'),
    ('Jagody', 'g', 'LOW'),
    ('Truskawki', 'g', 'LOW'),
    ('Pomarańcze', 'szt', 'LOW'),
    ('Cytryny', 'szt', 'LOW')
ON CONFLICT DO NOTHING;
