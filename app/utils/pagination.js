// Pagination utilities

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parsePagination = (query) => {
  let page = parseInt(query.page) || DEFAULT_PAGE;
  let limit = parseInt(query.limit) || DEFAULT_LIMIT;
  
  // Ensure positive values
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(limit, MAX_LIMIT));
  
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

const buildPaginationResponse = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNext,
    hasPrev
  };
};

const addPaginationToQuery = (baseQuery, { limit, offset }) => {
  return `${baseQuery} LIMIT $${baseQuery.split('$').length} OFFSET $${baseQuery.split('$').length + 1}`;
};

module.exports = {
  parsePagination,
  buildPaginationResponse,
  addPaginationToQuery,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT
};
