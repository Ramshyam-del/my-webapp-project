/**
 * Safely converts a value to an array
 * @param {any} value - The value to convert
 * @returns {Array} - Always returns an array
 */
export function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
}

/**
 * Safely gets the total count from API response
 * @param {any} value - The API response
 * @returns {number} - Returns 0 if no count found
 */
export function asCount(value) {
  if (typeof value?.total === 'number') return value.total;
  if (typeof value?.data?.total === 'number') return value.data.total;
  return 0;
}

/**
 * Safely gets pagination info from API response
 * @param {any} value - The API response
 * @returns {Object} - Returns default pagination info
 */
export function asPagination(value) {
  return {
    page: value?.data?.page || value?.page || 1,
    pageSize: value?.data?.pageSize || value?.pageSize || 20,
    total: asCount(value)
  };
}
