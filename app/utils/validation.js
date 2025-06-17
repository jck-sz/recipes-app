// Validation utilities for API endpoints

const validateRequired = (fields, body) => {
  const missing = fields.filter(field => !body[field]);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
};

const validateCategory = (category) => {
  const validCategories = ['Śniadanie', 'Obiad', 'Kolacja', 'Przekąska'];
  if (!validCategories.includes(category)) {
    return `Invalid category. Must be one of: ${validCategories.join(', ')}`;
  }
  return null;
};

const validateFodmapLevel = (level) => {
  const validLevels = ['LOW', 'MODERATE', 'HIGH'];
  if (level && !validLevels.includes(level)) {
    return `Invalid FODMAP level. Must be one of: ${validLevels.join(', ')}`;
  }
  return null;
};

const validatePositiveInteger = (value, fieldName) => {
  if (value !== undefined && value !== null) {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive integer`;
    }
  }
  return null;
};

const validateUrl = (url, fieldName) => {
  if (url) {
    try {
      new URL(url);
    } catch (e) {
      return `${fieldName} must be a valid URL`;
    }
  }
  return null;
};

const validateIngredients = (ingredients) => {
  if (!Array.isArray(ingredients)) {
    return 'Ingredients must be an array';
  }
  
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    if (!ingredient.ingredient_id || !ingredient.quantity) {
      return `Ingredient at index ${i} must have ingredient_id and quantity`;
    }
    
    const quantityNum = parseFloat(ingredient.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return `Ingredient at index ${i} must have a positive quantity`;
    }
  }
  
  return null;
};

const validateTags = (tags) => {
  if (!Array.isArray(tags)) {
    return 'Tags must be an array';
  }
  
  for (let i = 0; i < tags.length; i++) {
    if (!tags[i] || typeof tags[i] !== 'number') {
      return `Tag at index ${i} must be a valid tag ID (number)`;
    }
  }
  
  return null;
};

module.exports = {
  validateRequired,
  validateCategory,
  validateFodmapLevel,
  validatePositiveInteger,
  validateUrl,
  validateIngredients,
  validateTags
};
