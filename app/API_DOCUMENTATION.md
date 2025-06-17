# FODMAP Recipe API Documentation

## Base URL
```
http://localhost:3000
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Description of the result",
  "data": {...} // Present on success
}
```

For paginated responses:
```json
{
  "success": true,
  "message": "Description",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Categories API

### GET /categories
List all categories.

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Śniadanie"
    }
  ]
}
```

### POST /categories
Create a new category.

**Request Body:**
```json
{
  "name": "Śniadanie" // Must be one of: Śniadanie, Obiad, Kolacja, Przekąska
}
```

### PUT /categories/:id
Update a category.

**Request Body:**
```json
{
  "name": "Obiad"
}
```

### DELETE /categories/:id
Delete a category. Fails if recipes are using this category.

## Ingredients API

### GET /ingredients
List ingredients with pagination and optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `fodmap_level` (optional): Filter by FODMAP level (LOW, MODERATE, HIGH)

### GET /ingredients/search
Search ingredients by name.

**Query Parameters:**
- `q` (required): Search term
- `page` (optional): Page number
- `limit` (optional): Items per page

### GET /ingredients/:id
Get a single ingredient by ID.

### POST /ingredients
Create a new ingredient.

**Request Body:**
```json
{
  "name": "Marchew",
  "quantity_unit": "g", // optional
  "fodmap_level": "LOW" // optional: LOW, MODERATE, HIGH
}
```

### PUT /ingredients/:id
Update an ingredient.

### DELETE /ingredients/:id
Delete an ingredient. Fails if recipes are using this ingredient.

## Tags API

### GET /tags
List all tags.

### POST /tags
Create a new tag.

**Request Body:**
```json
{
  "name": "Wegetariańskie"
}
```

### PUT /tags/:id
Update a tag.

### DELETE /tags/:id
Delete a tag. Fails if recipes are using this tag.

## Recipes API

### GET /recipes
List recipes with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): Filter by category ID
- `search` (optional): Search in title and description
- `tag` (optional): Filter by tag name
- `prep_time_max` (optional): Maximum preparation time in minutes

### GET /recipes/:id
Get a single recipe with full details including ingredients and tags.

**Response:**
```json
{
  "success": true,
  "message": "Recipe retrieved successfully",
  "data": {
    "id": 1,
    "title": "Sałatka z marchewką",
    "description": "Zdrowa sałatka",
    "preparation_time": 15,
    "serving_size": 2,
    "image_url": "https://example.com/image.jpg",
    "category_id": 1,
    "category_name": "Śniadanie",
    "created_by": "system",
    "updated_by": "system",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "ingredients": [
      {
        "id": 1,
        "name": "Marchew",
        "quantity": 100,
        "quantity_unit": "g",
        "fodmap_level": "LOW"
      }
    ],
    "tags": [
      {
        "id": 1,
        "name": "Zdrowe"
      }
    ]
  }
}
```

### POST /recipes
Create a new recipe with ingredients and tags.

**Request Body:**
```json
{
  "title": "Nowy przepis",
  "description": "Opis przepisu", // optional
  "preparation_time": 30, // optional, minutes
  "serving_size": 4, // optional
  "image_url": "https://example.com/image.jpg", // optional
  "category_id": 1,
  "created_by": "user123", // optional, defaults to "system"
  "ingredients": [ // optional
    {
      "ingredient_id": 1,
      "quantity": 100.5
    }
  ],
  "tags": [1, 2, 3] // optional, array of tag IDs
}
```

### PUT /recipes/:id
Update a recipe including ingredients and tags.

**Request Body:** Same as POST, but all fields are optional except `title` and `category_id`.

**Note:** If `ingredients` or `tags` arrays are provided, they completely replace the existing ones.

### DELETE /recipes/:id
Delete a recipe and all its relationships.

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Resource already exists or cannot be deleted"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## FODMAP Levels
- **LOW**: Safe for FODMAP diet
- **MODERATE**: Limited quantities allowed
- **HIGH**: Should be avoided on FODMAP diet

## Category Names
Valid category names (Polish):
- **Śniadanie** (Breakfast)
- **Obiad** (Lunch)
- **Kolacja** (Dinner)
- **Przekąska** (Snack)
