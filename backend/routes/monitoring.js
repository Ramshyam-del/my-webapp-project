/**
 * Monitoring Routes
 * Provides endpoints for health checks and metrics
 */

const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const adminApiKey = require('../middleware/adminApiKey');

/**
 * Public health check endpoint
 * GET /api/monitoring/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await monitoringService.getHealth();
    
    // Return appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json({
      ok: health.status !== 'critical',
      ...health
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Simple ping endpoint
 * GET /api/monitoring/ping
 */
router.get('/ping', (req, res) => {
  res.json({
    ok: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get metrics (admin only)
 * GET /api/monitoring/metrics
 */
router.get('/metrics', adminApiKey, (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.json({
      ok: true,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

/**
 * Get detailed health report (admin only)
 * GET /api/monitoring/report
 */
router.get('/report', adminApiKey, async (req, res) => {
  try {
    const health = await monitoringService.getHealth();
    res.json({
      ok: true,
      report: health
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

/**
 * Get alerts (admin only)
 * GET /api/monitoring/alerts
 */
router.get('/alerts', adminApiKey, (req, res) => {
  try {
    const health = monitoringService.getHealth();
    res.json({
      ok: true,
      alerts: health.alerts || []
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

/**
 * Reset metrics (admin only, for testing)
 * POST /api/monitoring/reset
 */
router.post('/reset', adminApiKey, (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        ok: false,
        message: 'Metric reset disabled in production'
      });
    }

    monitoringService.resetMetrics();
    res.json({
      ok: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

module.exports = router;
