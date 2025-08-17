/**
 * Response helpers for consistent JSON API responses
 */
module.exports = {
  /**
   * Send successful JSON response
   * @param {Response} res - Express response object
   * @param {Object} data - Response data
   * @param {number} status - HTTP status code (default: 200)
   */
  sendOk(res, data = {}, status = 200) {
    res.status(status).json({ ok: true, ...data });
  },

  /**
   * Send error JSON response
   * @param {Response} res - Express response object
   * @param {Object} options - Error options
   * @param {string} options.code - Error code (default: 'server_error')
   * @param {string} options.message - Error message (default: 'Internal Server Error')
   * @param {number} options.status - HTTP status code (default: 500)
   * @param {*} options.details - Additional error details (optional)
   */
  sendErr(res, { code = 'server_error', message = 'Internal Server Error', status = 500, details = undefined } = {}) {
    const body = { ok: false, code, message };
    if (details !== undefined) body.details = details;
    res.status(status).json(body);
  }
};
