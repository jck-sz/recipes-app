#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Creating application user and database schema..."

# Create application user with password from environment variable
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create application user with password from environment
    CREATE USER ${APP_DB_USER} WITH PASSWORD '${APP_DB_PASSWORD}';
    
    -- Grant privileges to the user
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${APP_DB_USER};
    
    -- Create tables
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
        name VARCHAR(255) NOT NULL UNIQUE,
        quantity_unit VARCHAR(50),
        fodmap_level VARCHAR(10) CHECK (fodmap_level IN ('LOW', 'MODERATE', 'HIGH'))
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INT REFERENCES ingredients(id),
        quantity DECIMAL(10,2),
        PRIMARY KEY (recipe_id, ingredient_id)
    );

    CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS recipe_tags (
        recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
        tag_id INT REFERENCES tags(id),
        PRIMARY KEY (recipe_id, tag_id)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
    CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
    CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id);
    CREATE INDEX IF NOT EXISTS idx_ingredients_fodmap_level ON ingredients(fodmap_level);

    -- Grant table permissions to app user
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${APP_DB_USER};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${APP_DB_USER};

    -- Insert default categories
    INSERT INTO categories (name) VALUES
        ('Śniadanie'),
        ('Obiad'),
        ('Kolacja'),
        ('Przekąska')
    ON CONFLICT DO NOTHING;

    -- Insert sample ingredients with FODMAP levels
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

    -- Insert sample tags
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

EOSQL

echo "Database initialization completed successfully!"