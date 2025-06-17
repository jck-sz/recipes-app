# FODMAP Recipe API - Endpoint Documentation

## Base URL
```
http://localhost:3000
```

## Health Endpoints

### GET /health
Returns application health status including database connectivity.

**Response:**
```json
{
  "error": false,
  "message": "Application is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-17T18:00:00.000Z",
    "uptime": 123.456,
    "environment": "development",
    "version": "1.0.0",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": "5ms",
        "connection": "active"
      }
    }
  }
}
```

### GET /health/db
Returns detailed database health information.

## Categories API

### GET /categories
Returns all categories.

### GET /categories/:id
Returns a single category by ID.

### POST /categories
Creates a new category.

**Request Body:**
```json
{
  "name": "Śniadanie" // Must be one of: Śniadanie, Obiad, Kolacja, Przekąska
}
```

### PUT /categories/:id
Updates a category.

### DELETE /categories/:id
Deletes a category (only if no recipes use it).

### GET /categories/:id/recipes
Returns all recipes in a specific category with pagination.

## Ingredients API

### GET /ingredients
Returns paginated list of ingredients.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `fodmap_level` (string): Filter by FODMAP level (LOW, MODERATE, HIGH)

### GET /ingredients/:id
Returns a single ingredient by ID.

### GET /ingredients/search
Search ingredients by name.

**Query Parameters:**
- `q` (string, required): Search term
- `page`, `limit`: Pagination parameters

### GET /ingredients/unused
Returns ingredients not used in any recipe.

### GET /ingredients/by-fodmap-level
Returns ingredients grouped by FODMAP level with statistics.

**Query Parameters:**
- `level` (string, required): FODMAP level (LOW, MODERATE, HIGH)

### POST /ingredients
Creates a new ingredient.

**Request Body:**
```json
{
  "name": "Ingredient Name",
  "quantity_unit": "g", // Optional
  "fodmap_level": "LOW" // Optional: LOW, MODERATE, HIGH
}
```

### PUT /ingredients/:id
Updates an ingredient.

### DELETE /ingredients/:id
Deletes an ingredient (only if no recipes use it).

### POST /ingredients/bulk
Bulk import ingredients.

**Request Body:**
```json
{
  "ingredients": [
    {
      "name": "Ingredient 1",
      "quantity_unit": "g",
      "fodmap_level": "LOW"
    },
    {
      "name": "Ingredient 2",
      "quantity_unit": "ml",
      "fodmap_level": "MODERATE"
    }
  ]
}
```

## Tags API

### GET /tags
Returns all tags.

### GET /tags/:id
Returns a single tag by ID.

### POST /tags
Creates a new tag.

**Request Body:**
```json
{
  "name": "Tag Name"
}
```

### PUT /tags/:id
Updates a tag.

### DELETE /tags/:id
Deletes a tag (only if no recipes use it).

## Recipes API

### GET /recipes
Returns paginated list of recipes with filtering options.

**Query Parameters:**
- `page`, `limit`: Pagination
- `category` (number): Filter by category ID
- `search` (string): Search in title and description
- `tag` (string): Filter by tag name
- `prep_time_max` (number): Maximum preparation time in minutes

### GET /recipes/:id
Returns a single recipe with full details including ingredients and tags.

### GET /recipes/popular
Returns popular recipes from the last N days.

**Query Parameters:**
- `days` (number): Number of days to look back (default: 30, max: 365)
- `page`, `limit`: Pagination

### GET /recipes/fodmap-safe
Returns recipes that are safe for the specified FODMAP level.

**Query Parameters:**
- `max_level` (string): Maximum FODMAP level (LOW, MODERATE) (default: LOW)
- `page`, `limit`: Pagination

### GET /recipes/:id/ingredients
Returns detailed ingredient list for a specific recipe.

### POST /recipes
Creates a new recipe with ingredients and tags.

**Request Body:**
```json
{
  "title": "Recipe Title",
  "description": "Recipe description", // Optional
  "preparation_time": 30, // Optional, in minutes
  "serving_size": 4, // Optional
  "image_url": "https://example.com/image.jpg", // Optional
  "category_id": 1,
  "created_by": "user_name", // Optional
  "ingredients": [ // Optional
    {
      "ingredient_id": 1,
      "quantity": 100.5
    }
  ],
  "tags": [1, 2, 3] // Optional, array of tag IDs
}
```

### PUT /recipes/:id
Updates a recipe including its ingredients and tags.

### DELETE /recipes/:id
Deletes a recipe and all its relationships.

### POST /recipes/bulk
Bulk import recipes.

### DELETE /recipes/bulk
Bulk delete recipes by IDs.

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

### PUT /recipes/:id/ingredients
Updates only the ingredients of a recipe.

**Request Body:**
```json
{
  "ingredients": [
    {
      "ingredient_id": 1,
      "quantity": 150
    }
  ]
}
```

## Response Format

All API responses follow this consistent format:

### Success Response
```json
{
  "error": false,
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Paginated Response
```json
{
  "error": false,
  "message": "Success message",
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "error": true,
  "message": "Error message",
  "details": [ /* array of error details */ ],
  "code": "ERROR_CODE"
}
```

## Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `CATEGORY_NOT_FOUND`: Category not found
- `INGREDIENT_NOT_FOUND`: Ingredient not found
- `TAG_NOT_FOUND`: Tag not found
- `RECIPE_NOT_FOUND`: Recipe not found
- `CATEGORY_EXISTS`: Category already exists
- `INGREDIENT_EXISTS`: Ingredient already exists
- `TAG_EXISTS`: Tag already exists
- `CATEGORY_IN_USE`: Cannot delete category (recipes using it)
- `INGREDIENT_IN_USE`: Cannot delete ingredient (recipes using it)
- `TAG_IN_USE`: Cannot delete tag (recipes using it)
- `ENDPOINT_NOT_FOUND`: API endpoint not found
- `INVALID_JSON`: Invalid JSON in request body
- `DATABASE_ERROR`: Database connection error
- `INTERNAL_ERROR`: Internal server error

## HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error, invalid JSON)
- `404`: Not Found
- `409`: Conflict (duplicate resource, resource in use)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error
