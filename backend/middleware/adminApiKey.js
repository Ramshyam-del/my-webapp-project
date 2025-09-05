// backend/middleware/adminApiKey.js
const crypto = require('crypto');
const securityMonitor = require('../services/securityMonitor');

module.exports = function adminApiKey(req, res, next) {
  const keyFromHeader =
    req.headers['x-api-key'] ||
    (req.headers['authorization']?.startsWith('Bearer ')
      ? req.headers['authorization'].slice(7).trim()
      : undefined);

  if (!keyFromHeader) {
    // Track missing authentication attempt
    securityMonitor.trackFailedAuth(
      req.ip || req.connection.remoteAddress,
      'admin_api',
      'missing_token'
    );
    return res.status(401).json({ ok: false, code: 'unauthorized', message: 'No authentication token provided' });
  }
  
  // Check if ADMIN_API_KEY is configured
  if (!process.env.ADMIN_API_KEY) {
    console.error('ADMIN_API_KEY environment variable is not configured');
    return res.status(503).json({ ok: false, code: 'service_unavailable', message: 'Authentication service not configured' });
  }
  
  // Use timing-safe comparison to prevent timing attacks
  const expectedKey = Buffer.from(process.env.ADMIN_API_KEY, 'utf8');
  const providedKey = Buffer.from(keyFromHeader, 'utf8');
  
  // Ensure both keys have the same length for comparison
  if (expectedKey.length !== providedKey.length) {
    // Track invalid key length attempt
    securityMonitor.trackFailedAuth(
      req.ip || req.connection.remoteAddress,
      'admin_api',
      'invalid_key_length'
    );
    return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Invalid authentication token' });
  }
  
  if (!crypto.timingSafeEqual(expectedKey, providedKey)) {
    // Track invalid key attempt
    securityMonitor.trackFailedAuth(
      req.ip || req.connection.remoteAddress,
      'admin_api',
      'invalid_key'
    );
    return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Invalid authentication token' });
  }

  req.isAdminApi = true; // flag so other auth middlewares can bypass
  
  // Track successful admin API access
  securityMonitor.trackAdminApiUsage(
    req.ip || req.connection.remoteAddress,
    req.originalUrl,
    true
  );
  
  if (process.env.DEBUG_ADMIN_AUTH === '1') {
    console.log('🔑 adminApiKey OK for', req.method, req.originalUrl);
  }
  return next();
};

