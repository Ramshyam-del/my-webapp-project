module.exports = function requestLogger(req, _res, next) {
  const q = Object.fromEntries(Object.entries(req.query || {}).map(([k,v])=>[k, String(v)]));
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} q=`, q);
  next();
};
