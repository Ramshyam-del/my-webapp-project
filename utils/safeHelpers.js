/**
 * Defensive helper functions for null-safe operations
 * Used by Edit User Modal and other components that handle partial API responses
 */

/**
 * Normalize API response shape to an object
 * @param {any} val - Value to normalize
 * @returns {object} - Always returns an object, never undefined
 */
export const asObj = (val) => (val && typeof val === 'object' ? val : {});

/**
 * Safely pick a key from an object only if the key exists (even if value is null/empty)
 * @param {object} obj - Source object
 * @param {string} key - Key to check
 * @returns {object} - Returns { [key]: value } if key exists, {} otherwise
 */
export const pickIfHas = (obj, key) =>
  obj && Object.prototype.hasOwnProperty.call(obj, key) ? { [key]: obj[key] } : {};

/**
 * Create an immutable snapshot of an array for rollback operations
 * @param {Array} arr - Array to snapshot
 * @returns {Array} - Deep copy of the array
 */
export const snapshotArray = (arr) => (arr || []).map(item => ({ ...item }));

/**
 * Safely merge API response data into existing user object
 * @param {object} existingUser - Current user data
 * @param {object} responseData - API response data (may be partial)
 * @returns {object} - Merged user object with only present fields updated
 */
export const safeMergeUserData = (existingUser, responseData) => {
  if (!existingUser || !responseData) return existingUser || {};
  
  const data = asObj(responseData);
  
  return {
    ...existingUser,
    // Only update fields that are present in the response
    ...pickIfHas(data, 'id'),
    ...pickIfHas(data, 'email'),
    ...pickIfHas(data, 'usdt_withdraw_address'),
    ...pickIfHas(data, 'btc_withdraw_address'),
    ...pickIfHas(data, 'eth_withdraw_address'),
    ...pickIfHas(data, 'trx_withdraw_address'),
    ...pickIfHas(data, 'xrp_withdraw_address'),
  };
};

/**
 * Validate API response shape for consistency
 * @param {any} response - API response to validate
 * @returns {boolean} - True if response has expected shape
 */
export const isValidApiResponse = (response) => {
  return !!(response && 
         typeof response === 'object' && 
         response.ok === true && 
         typeof response.data === 'object');
};
