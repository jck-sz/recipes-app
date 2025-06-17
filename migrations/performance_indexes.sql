-- Performance Indexes Migration
-- Additional indexes for improved query performance

-- Indexes for recipe queries
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_preparation_time ON recipes(preparation_time);
CREATE INDEX IF NOT EXISTS idx_recipes_serving_size ON recipes(serving_size);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_recipes_category_created ON recipes(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_prep_time_category ON recipes(preparation_time, category_id);

-- Text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_recipes_title_gin ON recipes USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description_gin ON recipes USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_ingredients_name_gin ON ingredients USING gin(to_tsvector('english', name));

-- Indexes for relationship tables
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON recipe_tags(tag_id);

-- Composite indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_composite ON recipe_ingredients(recipe_id, ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_composite ON recipe_tags(recipe_id, tag_id);

-- Indexes for FODMAP queries
CREATE INDEX IF NOT EXISTS idx_ingredients_fodmap_name ON ingredients(fodmap_level, name);

-- Partial indexes for specific use cases
CREATE INDEX IF NOT EXISTS idx_recipes_with_prep_time ON recipes(preparation_time) WHERE preparation_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_with_serving_size ON recipes(serving_size) WHERE serving_size IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_with_fodmap ON ingredients(fodmap_level) WHERE fodmap_level IS NOT NULL;

-- Index for category name lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_categories_name_lower ON categories(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tags_name_lower ON tags(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_ingredients_name_lower ON ingredients(LOWER(name));

-- Covering indexes for common SELECT patterns
CREATE INDEX IF NOT EXISTS idx_recipes_list_covering ON recipes(created_at DESC) 
  INCLUDE (id, title, description, preparation_time, serving_size, image_url, category_id);

-- Statistics update for better query planning
ANALYZE recipes;
ANALYZE ingredients;
ANALYZE categories;
ANALYZE tags;
ANALYZE recipe_ingredients;
ANALYZE recipe_tags;
