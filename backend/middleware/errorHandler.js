module.exports = function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err && (err.stack || err.message || err));
  const code = err && err.status ? err.status : 500;
  res.status(code).json({ ok:false, error: code === 500 ? 'Internal error' : String(err.message || err) });
};
