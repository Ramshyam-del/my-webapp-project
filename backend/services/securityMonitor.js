/**
 * Security Monitoring Service
 * Monitors and logs security events, detects potential intrusions
 */

const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

class SecurityMonitorService {
  constructor() {
    this.suspiciousIPs = new Map();
    this.failedAttempts = new Map();
    this.alertThresholds = {
      failedLogins: 5,
      suspiciousRequests: 10,
      timeWindow: 15 * 60 * 1000 // 15 minutes
    };
  }

  /**
   * Log security event to database and console
   * @param {string} eventType - Type of security event
   * @param {Object} details - Event details
   * @param {string} severity - Event severity (low, medium, high, critical)
   * @param {string} ipAddress - Source IP address
   */
  async logSecurityEvent(eventType, details, severity = 'medium', ipAddress = null) {
    const event = {
      event_type: eventType,
      severity,
      ip_address: ipAddress,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: details.userAgent || 'unknown'
      },
      created_at: new Date().toISOString()
    };

    try {
      // Log to database
      const { error } = await supabaseAdmin
        .from('security_events')
        .insert(event);

      if (error) {
        logger.error('Failed to log security event to database', { error, event });
      }

      // Log to console with appropriate level
      const logLevel = this.getLogLevel(severity);
      logger[logLevel](`Security Event: ${eventType}`, {
        severity,
        ipAddress,
        details: details
      });

      // Check if this triggers an alert
      await this.checkForAlerts(eventType, ipAddress, details);

    } catch (error) {
      logger.error('Error in security event logging', { error: error.message, event });
    }
  }

  /**
   * Track failed authentication attempts
   * @param {string} ipAddress - Source IP
   * @param {string} identifier - User identifier (email, username, etc.)
   * @param {string} reason - Failure reason
   */
  async trackFailedAuth(ipAddress, identifier, reason = 'invalid_credentials') {
    const key = `${ipAddress}:${identifier}`;
    const now = Date.now();
    
    if (!this.failedAttempts.has(key)) {
      this.failedAttempts.set(key, []);
    }
    
    const attempts = this.failedAttempts.get(key);
    attempts.push({ timestamp: now, reason });
    
    // Clean old attempts outside time window
    const validAttempts = attempts.filter(
      attempt => now - attempt.timestamp < this.alertThresholds.timeWindow
    );
    this.failedAttempts.set(key, validAttempts);
    
    await this.logSecurityEvent('FAILED_AUTHENTICATION', {
      identifier,
      reason,
      attemptCount: validAttempts.length
    }, 'medium', ipAddress);
    
    // Check for brute force attack
    if (validAttempts.length >= this.alertThresholds.failedLogins) {
      await this.triggerBruteForceAlert(ipAddress, identifier, validAttempts.length);
    }
  }

  /**
   * Track suspicious requests
   * @param {string} ipAddress - Source IP
   * @param {string} endpoint - Requested endpoint
   * @param {Object} details - Request details
   */
  async trackSuspiciousRequest(ipAddress, endpoint, details = {}) {
    const now = Date.now();
    
    if (!this.suspiciousIPs.has(ipAddress)) {
      this.suspiciousIPs.set(ipAddress, []);
    }
    
    const requests = this.suspiciousIPs.get(ipAddress);
    requests.push({ timestamp: now, endpoint, ...details });
    
    // Clean old requests
    const validRequests = requests.filter(
      req => now - req.timestamp < this.alertThresholds.timeWindow
    );
    this.suspiciousIPs.set(ipAddress, validRequests);
    
    await this.logSecurityEvent('SUSPICIOUS_REQUEST', {
      endpoint,
      requestCount: validRequests.length,
      ...details
    }, 'low', ipAddress);
    
    // Check for potential attack
    if (validRequests.length >= this.alertThresholds.suspiciousRequests) {
      await this.triggerSuspiciousActivityAlert(ipAddress, validRequests.length);
    }
  }

  /**
   * Track admin API key usage
   * @param {string} ipAddress - Source IP
   * @param {string} endpoint - Accessed endpoint
   * @param {boolean} success - Whether request was successful
   */
  async trackAdminApiUsage(ipAddress, endpoint, success = true) {
    await this.logSecurityEvent('ADMIN_API_ACCESS', {
      endpoint,
      success
    }, success ? 'low' : 'high', ipAddress);
  }

  /**
   * Trigger brute force attack alert
   * @param {string} ipAddress - Attacking IP
   * @param {string} identifier - Target identifier
   * @param {number} attemptCount - Number of failed attempts
   */
  async triggerBruteForceAlert(ipAddress, identifier, attemptCount) {
    await this.logSecurityEvent('BRUTE_FORCE_DETECTED', {
      targetIdentifier: identifier,
      attemptCount,
      action: 'ALERT_TRIGGERED'
    }, 'critical', ipAddress);
    
    // Here you could implement additional actions like:
    // - Temporary IP blocking
    // - Email notifications
    // - Slack/Discord alerts
    logger.error(`🚨 BRUTE FORCE ATTACK DETECTED from ${ipAddress} targeting ${identifier} (${attemptCount} attempts)`);
  }

  /**
   * Trigger suspicious activity alert
   * @param {string} ipAddress - Suspicious IP
   * @param {number} requestCount - Number of suspicious requests
   */
  async triggerSuspiciousActivityAlert(ipAddress, requestCount) {
    await this.logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', {
      requestCount,
      action: 'ALERT_TRIGGERED'
    }, 'high', ipAddress);
    
    logger.warn(`⚠️ SUSPICIOUS ACTIVITY from ${ipAddress} (${requestCount} requests in ${this.alertThresholds.timeWindow / 60000} minutes)`);
  }

  /**
   * Check for security alerts based on event patterns
   * @param {string} eventType - Type of event
   * @param {string} ipAddress - Source IP
   * @param {Object} details - Event details
   */
  async checkForAlerts(eventType, ipAddress, details) {
    // Check for multiple failed admin authentications
    if (eventType === 'FAILED_AUTHENTICATION' && details.identifier === 'admin') {
      const adminFailures = this.failedAttempts.get(`${ipAddress}:admin`) || [];
      if (adminFailures.length >= 3) {
        await this.logSecurityEvent('ADMIN_ACCOUNT_ATTACK', {
          failureCount: adminFailures.length
        }, 'critical', ipAddress);
      }
    }
    
    // Check for SQL injection attempts
    if (details.query && this.detectSQLInjection(details.query)) {
      await this.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
        query: details.query.substring(0, 200) // Limit logged query length
      }, 'critical', ipAddress);
    }
  }

  /**
   * Detect potential SQL injection in query strings
   * @param {string} query - Query string to analyze
   * @returns {boolean} True if potential SQL injection detected
   */
  detectSQLInjection(query) {
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get appropriate log level for severity
   * @param {string} severity - Event severity
   * @returns {string} Log level
   */
  getLogLevel(severity) {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warn';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  /**
   * Generate security report for the last N hours
   * @param {number} hours - Number of hours to include in report
   * @returns {Object} Security report
   */
  async generateSecurityReport(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    try {
      const { data: events, error } = await supabaseAdmin
        .from('security_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to generate security report', { error });
        return null;
      }

      const report = {
        timeRange: { since, hours },
        totalEvents: events.length,
        eventsBySeverity: {
          critical: events.filter(e => e.severity === 'critical').length,
          high: events.filter(e => e.severity === 'high').length,
          medium: events.filter(e => e.severity === 'medium').length,
          low: events.filter(e => e.severity === 'low').length
        },
        eventsByType: {},
        topIPs: {},
        recentCriticalEvents: events.filter(e => e.severity === 'critical').slice(0, 10)
      };

      // Count events by type
      events.forEach(event => {
        report.eventsByType[event.event_type] = (report.eventsByType[event.event_type] || 0) + 1;
        if (event.ip_address) {
          report.topIPs[event.ip_address] = (report.topIPs[event.ip_address] || 0) + 1;
        }
      });

      return report;
    } catch (error) {
      logger.error('Error generating security report', { error: error.message });
      return null;
    }
  }

  /**
   * Initialize security monitoring
   */
  initialize() {
    // Clean up old tracking data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    console.log('Security monitoring service initialized');
  }

  /**
   * Clean up old tracking data from memory
   */
  cleanupOldData() {
    const now = Date.now();
    const cutoff = now - this.alertThresholds.timeWindow;

    // Clean failed attempts
    for (const [key, attempts] of this.failedAttempts.entries()) {
      const validAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
      if (validAttempts.length === 0) {
        this.failedAttempts.delete(key);
      } else {
        this.failedAttempts.set(key, validAttempts);
      }
    }

    // Clean suspicious IPs
    for (const [ip, requests] of this.suspiciousIPs.entries()) {
      const validRequests = requests.filter(req => req.timestamp > cutoff);
      if (validRequests.length === 0) {
        this.suspiciousIPs.delete(ip);
      } else {
        this.suspiciousIPs.set(ip, validRequests);
      }
    }
  }
}

module.exports = new SecurityMonitorService();