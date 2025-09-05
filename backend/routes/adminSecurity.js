/**
 * Admin Security Routes
 * Provides endpoints for security monitoring and management
 */

const express = require('express');
const router = express.Router();
const securityMonitor = require('../services/securityMonitor');
const keyRotationService = require('../services/keyRotation');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const logger = require('../utils/logger');

/**
 * GET /api/admin/security/report
 * Generate security report for specified time period
 */
router.get('/report', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    
    if (hours < 1 || hours > 168) { // Max 1 week
      return res.status(400).json({
        ok: false,
        code: 'invalid_parameter',
        message: 'Hours must be between 1 and 168'
      });
    }

    const report = await securityMonitor.generateSecurityReport(hours);
    
    if (!report) {
      return res.status(500).json({
        ok: false,
        code: 'report_generation_failed',
        message: 'Failed to generate security report'
      });
    }

    res.json({
      ok: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating security report', { error: error.message });
    res.status(500).json({
      ok: false,
      code: 'internal_error',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/admin/security/events
 * Get recent security events with filtering
 */
router.get('/events', async (req, res) => {
  try {
    const {
      severity,
      event_type,
      ip_address,
      limit = 50,
      offset = 0,
      hours = 24
    } = req.query;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    let query = supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (event_type) {
      query = query.eq('event_type', event_type);
    }
    if (ip_address) {
      query = query.eq('ip_address', ip_address);
    }

    const { data: events, error, count } = await query;

    if (error) {
      logger.error('Error fetching security events', { error });
      return res.status(500).json({
        ok: false,
        code: 'database_error',
        message: 'Failed to fetch security events'
      });
    }

    res.json({
      ok: true,
      data: {
        events,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching security events', { error: error.message });
    res.status(500).json({
      ok: false,
      code: 'internal_error',
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/security/rotate-keys
 * Manually trigger API key rotation
 */
router.post('/rotate-keys', async (req, res) => {
  try {
    const { keyType } = req.body;

    if (!keyType || keyType !== 'ADMIN_API_KEY') {
      return res.status(400).json({
        ok: false,
        code: 'invalid_key_type',
        message: 'Invalid or unsupported key type'
      });
    }

    const newKey = await keyRotationService.rotateAdminApiKey();
    
    // Log the manual rotation
    await securityMonitor.logSecurityEvent('MANUAL_KEY_ROTATION', {
      keyType,
      rotatedBy: 'admin',
      newKeyPreview: newKey.substring(0, 10) + '...'
    }, 'medium', req.ip || req.connection.remoteAddress);

    res.json({
      ok: true,
      data: {
        message: 'API key rotated successfully',
        newKeyPreview: newKey.substring(0, 10) + '...',
        rotatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error rotating API key', { error: error.message });
    
    await securityMonitor.logSecurityEvent('KEY_ROTATION_FAILED', {
      keyType: req.body.keyType,
      error: error.message,
      rotatedBy: 'admin'
    }, 'high', req.ip || req.connection.remoteAddress);

    res.status(500).json({
      ok: false,
      code: 'rotation_failed',
      message: 'Failed to rotate API key'
    });
  }
});

/**
 * GET /api/admin/security/stats
 * Get security statistics and metrics
 */
router.get('/stats', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Get event counts by severity
    const { data: severityStats, error: severityError } = await supabaseAdmin
      .from('security_events')
      .select('severity')
      .gte('created_at', since);

    if (severityError) {
      throw severityError;
    }

    // Get event counts by type
    const { data: typeStats, error: typeError } = await supabaseAdmin
      .from('security_events')
      .select('event_type')
      .gte('created_at', since);

    if (typeError) {
      throw typeError;
    }

    // Get top IPs
    const { data: ipStats, error: ipError } = await supabaseAdmin
      .from('security_events')
      .select('ip_address')
      .gte('created_at', since)
      .not('ip_address', 'is', null);

    if (ipError) {
      throw ipError;
    }

    // Process statistics
    const severityCounts = severityStats.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});

    const typeCounts = typeStats.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    const ipCounts = ipStats.reduce((acc, event) => {
      if (event.ip_address) {
        acc[event.ip_address] = (acc[event.ip_address] || 0) + 1;
      }
      return acc;
    }, {});

    // Get top 10 IPs
    const topIPs = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    res.json({
      ok: true,
      data: {
        timeRange: { hours, since },
        totalEvents: severityStats.length,
        severityBreakdown: severityCounts,
        eventTypeBreakdown: typeCounts,
        topIPs,
        criticalEvents: severityCounts.critical || 0,
        highSeverityEvents: (severityCounts.critical || 0) + (severityCounts.high || 0)
      }
    });
  } catch (error) {
    logger.error('Error fetching security stats', { error: error.message });
    res.status(500).json({
      ok: false,
      code: 'internal_error',
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/admin/security/test-alert
 * Test security alert system (development only)
 */
router.post('/test-alert', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        ok: false,
        code: 'forbidden',
        message: 'Test alerts not available in production'
      });
    }

    const { alertType = 'TEST_ALERT' } = req.body;
    
    await securityMonitor.logSecurityEvent(alertType, {
      testAlert: true,
      triggeredBy: 'admin',
      timestamp: new Date().toISOString()
    }, 'low', req.ip || req.connection.remoteAddress);

    res.json({
      ok: true,
      data: {
        message: 'Test alert generated successfully',
        alertType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error generating test alert', { error: error.message });
    res.status(500).json({
      ok: false,
      code: 'internal_error',
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/admin/security/events/cleanup
 * Clean up old security events
 */
router.delete('/events/cleanup', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    if (days < 30 || days > 365) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_parameter',
        message: 'Days must be between 30 and 365'
      });
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { error, count } = await supabaseAdmin
      .from('security_events')
      .delete()
      .lt('created_at', cutoffDate);

    if (error) {
      throw error;
    }

    // Log the cleanup
    await securityMonitor.logSecurityEvent('SECURITY_EVENTS_CLEANUP', {
      deletedEvents: count,
      cutoffDate,
      triggeredBy: 'admin'
    }, 'low', req.ip || req.connection.remoteAddress);

    res.json({
      ok: true,
      data: {
        message: 'Security events cleaned up successfully',
        deletedEvents: count,
        cutoffDate
      }
    });
  } catch (error) {
    logger.error('Error cleaning up security events', { error: error.message });
    res.status(500).json({
      ok: false,
      code: 'internal_error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;