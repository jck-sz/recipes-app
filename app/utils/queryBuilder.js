/**
 * Safe SQL Query Builder Utilities
 * Provides utilities for building dynamic SQL queries safely with proper parameterization
 */

/**
 * Builds a safe WHERE clause with parameterized conditions
 * @param {Array} conditions - Array of condition objects
 * @param {number} startIndex - Starting parameter index (default: 1)
 * @returns {Object} - { whereClause, params, nextIndex }
 */
function buildWhereClause(conditions, startIndex = 1) {
  const validConditions = conditions.filter(condition => 
    condition && condition.field && condition.value !== undefined && condition.value !== null
  );

  if (validConditions.length === 0) {
    return { whereClause: '', params: [], nextIndex: startIndex };
  }

  const params = [];
  const clauses = [];
  let paramIndex = startIndex;

  validConditions.forEach(condition => {
    const { field, operator = '=', value, type = 'exact' } = condition;

    // Validate field name to prevent injection
    // "EXISTS" is a special case used for subqueries
    if (type !== 'exists' && !isValidFieldName(field)) {
      throw new Error(`Invalid field name: ${field}`);
    }

    // Validate operator to prevent injection
    if (!isValidOperator(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    let clause;
    switch (type) {
      case 'like':
        clause = `${field} ILIKE $${paramIndex}`;
        params.push(`%${String(value).trim()}%`);
        break;
      case 'in':
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('IN operator requires non-empty array');
        }
        const placeholders = value.map((_, index) => `$${paramIndex + index}`).join(', ');
        clause = `${field} IN (${placeholders})`;
        params.push(...value);
        paramIndex += value.length - 1;
        break;
      case 'range':
        if (!value.min && !value.max) {
          throw new Error('Range operator requires min or max value');
        }
        if (value.min && value.max) {
          clause = `${field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          params.push(value.min, value.max);
          paramIndex += 1;
        } else if (value.min) {
          clause = `${field} >= $${paramIndex}`;
          params.push(value.min);
        } else {
          clause = `${field} <= $${paramIndex}`;
          params.push(value.max);
        }
        break;
      case 'exists':
        // For EXISTS subqueries - value should be the subquery with proper parameterization
        clause = `EXISTS (${value.query})`;
        params.push(...value.params);
        paramIndex += value.params.length - 1;
        break;
      default: // exact match
        clause = `${field} ${operator} $${paramIndex}`;
        params.push(value);
    }

    clauses.push(clause);
    paramIndex++;
  });

  const whereClause = `WHERE ${clauses.join(' AND ')}`;
  return { whereClause, params, nextIndex: paramIndex };
}

/**
 * Builds safe IN clause placeholders
 * @param {Array} values - Array of values
 * @param {number} startIndex - Starting parameter index
 * @returns {Object} - { placeholders, params, nextIndex }
 */
function buildInClause(values, startIndex = 1) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('buildInClause requires non-empty array');
  }

  const placeholders = values.map((_, index) => `$${startIndex + index}`).join(', ');
  return {
    placeholders,
    params: values,
    nextIndex: startIndex + values.length
  };
}

/**
 * Builds safe ORDER BY clause
 * @param {Array} orderBy - Array of order objects { field, direction }
 * @returns {string} - ORDER BY clause
 */
function buildOrderByClause(orderBy) {
  if (!Array.isArray(orderBy) || orderBy.length === 0) {
    return '';
  }

  const validOrders = orderBy.filter(order => 
    order && order.field && isValidFieldName(order.field)
  );

  if (validOrders.length === 0) {
    return '';
  }

  const orderClauses = validOrders.map(order => {
    const direction = order.direction && order.direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return `${order.field} ${direction}`;
  });

  return `ORDER BY ${orderClauses.join(', ')}`;
}

/**
 * Validates field names to prevent SQL injection
 * @param {string} fieldName - Field name to validate
 * @returns {boolean} - True if valid
 */
function isValidFieldName(fieldName) {
  // Allow alphanumeric, underscore, dot (for table.field), and common SQL functions
  const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
  return validPattern.test(fieldName);
}

/**
 * Validates SQL operators to prevent injection
 * @param {string} operator - Operator to validate
 * @returns {boolean} - True if valid
 */
function isValidOperator(operator) {
  const validOperators = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN', 'NOT IN'];
  return validOperators.includes(operator.toUpperCase());
}

/**
 * Sanitizes string input for LIKE queries
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
function sanitizeLikeInput(input) {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Escape special LIKE characters
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/%/g, '\\%')    // Escape percent signs
    .replace(/_/g, '\\_')    // Escape underscores
    .trim();
}

/**
 * Builds pagination LIMIT and OFFSET clause
 * @param {number} limit - Number of records to return
 * @param {number} offset - Number of records to skip
 * @param {number} startIndex - Starting parameter index
 * @returns {Object} - { clause, params, nextIndex }
 */
function buildPaginationClause(limit, offset, startIndex = 1) {
  const clause = `LIMIT $${startIndex} OFFSET $${startIndex + 1}`;
  return {
    clause,
    params: [limit, offset],
    nextIndex: startIndex + 2
  };
}

module.exports = {
  buildWhereClause,
  buildInClause,
  buildOrderByClause,
  buildPaginationClause,
  isValidFieldName,
  isValidOperator,
  sanitizeLikeInput
};
