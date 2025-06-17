// Response utilities for consistent API responses

// Success responses
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    error: false,
    message,
    data
  });
};

const created = (res, data, message = 'Created successfully') => {
  return res.status(201).json({
    error: false,
    message,
    data
  });
};

const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    error: false,
    message,
    data,
    pagination
  });
};

// Error responses with new format
const error = (res, message = 'Internal server error', statusCode = 500, details = null, code = null) => {
  const response = {
    error: true,
    message,
    details: details || [],
    code: code || getErrorCode(statusCode)
  };

  return res.status(statusCode).json(response);
};

const validationError = (res, message, details = [], code = 'VALIDATION_ERROR') => {
  return error(res, message, 400, details, code);
};

const notFound = (res, resource = 'Resource', code = 'NOT_FOUND') => {
  return error(res, `${resource} not found`, 404, [], code);
};

const conflict = (res, message, code = 'CONFLICT') => {
  return error(res, message, 409, [], code);
};

const unauthorized = (res, message = 'Unauthorized', code = 'UNAUTHORIZED') => {
  return error(res, message, 401, [], code);
};

const forbidden = (res, message = 'Forbidden', code = 'FORBIDDEN') => {
  return error(res, message, 403, [], code);
};

const internalError = (res, message = 'Internal server error', details = [], code = 'INTERNAL_ERROR') => {
  return error(res, message, 500, details, code);
};

// Helper function to get default error codes
const getErrorCode = (statusCode) => {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    500: 'INTERNAL_ERROR'
  };
  return codes[statusCode] || 'UNKNOWN_ERROR';
};

module.exports = {
  success,
  created,
  paginated,
  error,
  validationError,
  notFound,
  conflict,
  unauthorized,
  forbidden,
  internalError,
  getErrorCode
};
