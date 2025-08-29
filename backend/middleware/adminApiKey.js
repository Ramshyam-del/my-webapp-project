// backend/middleware/adminApiKey.js
module.exports = function adminApiKey(req, res, next) {
  const keyFromHeader =
    req.headers['x-api-key'] ||
    (req.headers['authorization']?.startsWith('Bearer ')
      ? req.headers['authorization'].slice(7).trim()
      : undefined);

  if (!keyFromHeader) {
    return res.status(401).json({ ok: false, code: 'unauthorized', message: 'No authentication token provided' });
  }
  if (keyFromHeader !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Invalid authentication token' });
  }

  req.isAdminApi = true; // flag so other auth middlewares can bypass
  if (process.env.DEBUG_ADMIN_AUTH === '1') {
    console.log('🔑 adminApiKey OK for', req.method, req.originalUrl);
  }
  return next();
};

