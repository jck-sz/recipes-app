const Joi = require('joi');

// Common validation patterns
const positiveInteger = Joi.number().integer().positive();
const nonEmptyString = Joi.string().trim().min(1);
const url = Joi.string().uri();
const fodmapLevel = Joi.string().valid('LOW', 'MODERATE', 'HIGH');
const categoryName = Joi.string().valid('Śniadanie', 'Obiad', 'Kolacja', 'Przekąska');

// Pagination schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Category schemas
const categoryCreateSchema = Joi.object({
  name: categoryName.required()
});

const categoryUpdateSchema = Joi.object({
  name: categoryName.required()
});

// Ingredient schemas
const ingredientCreateSchema = Joi.object({
  name: nonEmptyString.max(255).required(),
  quantity_unit: Joi.string().trim().max(50).allow('', null),
  fodmap_level: fodmapLevel.allow(null)
});

const ingredientUpdateSchema = Joi.object({
  name: nonEmptyString.max(255).required(),
  quantity_unit: Joi.string().trim().max(50).allow('', null),
  fodmap_level: fodmapLevel.allow(null)
});

const ingredientQuerySchema = Joi.object({
  ...paginationSchema.describe().keys,
  fodmap_level: fodmapLevel
});

const ingredientSearchSchema = Joi.object({
  ...paginationSchema.describe().keys,
  q: nonEmptyString.required()
});

// Tag schemas
const tagCreateSchema = Joi.object({
  name: nonEmptyString.max(255).required()
});

const tagUpdateSchema = Joi.object({
  name: nonEmptyString.max(255).required()
});

// Recipe ingredient schema
const recipeIngredientSchema = Joi.object({
  ingredient_id: positiveInteger.required(),
  quantity: Joi.number().positive().required()
});

// Recipe schemas
const recipeCreateSchema = Joi.object({
  title: nonEmptyString.max(255).required(),
  description: Joi.string().trim().max(2000).allow('', null),
  preparation_time: positiveInteger.allow(null),
  serving_size: positiveInteger.allow(null),
  image_url: url.allow('', null),
  category_id: positiveInteger.required(),
  created_by: Joi.string().trim().max(255).allow('', null),
  ingredients: Joi.array().items(recipeIngredientSchema).default([]),
  tags: Joi.array().items(positiveInteger).default([])
});

const recipeUpdateSchema = Joi.object({
  title: nonEmptyString.max(255).required(),
  description: Joi.string().trim().max(2000).allow('', null),
  preparation_time: positiveInteger.allow(null),
  serving_size: positiveInteger.allow(null),
  image_url: url.allow('', null),
  category_id: positiveInteger.required(),
  updated_by: Joi.string().trim().max(255).allow('', null),
  ingredients: Joi.array().items(recipeIngredientSchema),
  tags: Joi.array().items(positiveInteger)
});

const recipeQuerySchema = Joi.object({
  ...paginationSchema.describe().keys,
  category: positiveInteger,
  search: Joi.string().trim().min(1),
  tag: Joi.string().trim().min(1),
  prep_time_max: positiveInteger
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: positiveInteger.required()
});

// Advanced query schemas
const popularRecipesSchema = Joi.object({
  ...paginationSchema.describe().keys,
  days: Joi.number().integer().min(1).max(365).default(30)
});

const fodmapSafeRecipesSchema = Joi.object({
  ...paginationSchema.describe().keys,
  max_level: Joi.string().valid('LOW', 'MODERATE').default('LOW'),
  serving_size: positiveInteger
});

const ingredientsByFodmapSchema = Joi.object({
  level: fodmapLevel.required()
});

// Bulk operation schemas
const bulkRecipesSchema = Joi.object({
  recipes: Joi.array().items(recipeCreateSchema).min(1).max(100).required()
});

const bulkIngredientsSchema = Joi.object({
  ingredients: Joi.array().items(ingredientCreateSchema).min(1).max(100).required()
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array().items(positiveInteger).min(1).max(100).required()
});

// Recipe ingredients update schema
const recipeIngredientsUpdateSchema = Joi.object({
  ingredients: Joi.array().items(recipeIngredientSchema).required()
});

module.exports = {
  // Common
  paginationSchema,
  idParamSchema,

  // Categories
  categoryCreateSchema,
  categoryUpdateSchema,

  // Ingredients
  ingredientCreateSchema,
  ingredientUpdateSchema,
  ingredientQuerySchema,
  ingredientSearchSchema,

  // Tags
  tagCreateSchema,
  tagUpdateSchema,

  // Recipes
  recipeCreateSchema,
  recipeUpdateSchema,
  recipeQuerySchema,

  // Advanced queries
  popularRecipesSchema,
  fodmapSafeRecipesSchema,
  ingredientsByFodmapSchema,

  // Bulk operations
  bulkRecipesSchema,
  bulkIngredientsSchema,
  bulkDeleteSchema,
  recipeIngredientsUpdateSchema
};
