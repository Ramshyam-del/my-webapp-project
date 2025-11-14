/**
 * Monitoring Middleware
 * Tracks request metrics and performance
 */

const monitoringService = require('../services/monitoringService');

/**
 * Request monitoring middleware
 * Records request metrics and response times
 */
const requestMonitoring = (req, res, next) => {
  const startTime = Date.now();

  // Track when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Record the request
    monitoringService.recordRequest(req, responseTime);

    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    }
  });

  next();
};

/**
 * Error monitoring middleware
 * Records errors and creates alerts
 */
const errorMonitoring = (error, req, res, next) => {
  // Record the error
  monitoringService.recordError(error, {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    severity: error.severity || 'error'
  });

  next(error);
};

module.exports = {
  requestMonitoring,
  errorMonitoring
};
