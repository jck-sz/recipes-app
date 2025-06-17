const { validationError } = require('../utils/responses');

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : 
                 source === 'query' ? req.query : 
                 source === 'params' ? req.params : req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return validationError(
        res,
        'Validation failed',
        details,
        'VALIDATION_ERROR'
      );
    }

    // Replace the original data with validated and sanitized data
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req[source] = value;
    }

    next();
  };
};

// Specific validation middleware functions
const validateBody = (schema) => validate(schema, 'body');
const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams
};
