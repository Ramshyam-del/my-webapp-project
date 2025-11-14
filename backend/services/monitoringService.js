/**
 * Application Monitoring Service
 * Provides health checks, performance metrics, and error tracking
 */

const os = require('os');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requests: 0,
      errors: 0,
      apiCalls: 0,
      dbQueries: 0,
      lastError: null,
      performance: {
        avgResponseTime: 0,
        responseTimes: []
      }
    };
    this.healthChecks = new Map();
    this.alerts = [];
  }

  /**
   * Initialize monitoring service
   */
  initialize() {
    console.log('🔍 Monitoring service initialized');
    
    // Start periodic health checks
    this.startHealthChecks();
    
    // Clean up old metrics every hour
    setInterval(() => this.cleanupMetrics(), 3600000);
  }

  /**
   * Record a request
   */
  recordRequest(req, responseTime) {
    this.metrics.requests++;
    
    // Track response time
    if (responseTime) {
      this.metrics.performance.responseTimes.push(responseTime);
      
      // Keep only last 1000 response times
      if (this.metrics.performance.responseTimes.length > 1000) {
        this.metrics.performance.responseTimes.shift();
      }
      
      // Calculate average
      this.metrics.performance.avgResponseTime = 
        this.metrics.performance.responseTimes.reduce((a, b) => a + b, 0) / 
        this.metrics.performance.responseTimes.length;
    }
  }

  /**
   * Record an error
   */
  recordError(error, context = {}) {
    this.metrics.errors++;
    this.metrics.lastError = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error recorded:', error.message, context);
    }

    // Create alert for critical errors
    if (context.severity === 'critical') {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        message: error.message,
        details: context
      });
    }
  }

  /**
   * Record API call
   */
  recordApiCall(service, endpoint) {
    this.metrics.apiCalls++;
  }

  /**
   * Record database query
   */
  recordDbQuery(table, operation) {
    this.metrics.dbQueries++;
  }

  /**
   * Get system health
   */
  async getHealth() {
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptime / 1000);

    return {
      status: this.calculateHealthStatus(),
      timestamp: new Date().toISOString(),
      uptime: {
        ms: uptime,
        seconds: uptimeSeconds,
        formatted: this.formatUptime(uptimeSeconds)
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || 'unknown',
          loadAvg: os.loadavg()
        }
      },
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      metrics: {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        errorRate: this.metrics.requests > 0 
          ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
          : '0%',
        apiCalls: this.metrics.apiCalls,
        dbQueries: this.metrics.dbQueries,
        avgResponseTime: this.metrics.performance.avgResponseTime.toFixed(2) + 'ms'
      },
      healthChecks: await this.runHealthChecks(),
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
  }

  /**
   * Calculate overall health status
   */
  calculateHealthStatus() {
    const memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
    const errorRate = this.metrics.requests > 0 
      ? this.metrics.errors / this.metrics.requests 
      : 0;

    if (memUsage > 0.9 || errorRate > 0.1) {
      return 'critical';
    } else if (memUsage > 0.8 || errorRate > 0.05) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const checks = {};

    // Database health check
    try {
      const start = Date.now();
      const { error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);
      
      checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - start,
        error: error?.message
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Memory check
    const memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
    checks.memory = {
      status: memUsage < 0.9 ? 'healthy' : 'critical',
      usage: (memUsage * 100).toFixed(2) + '%'
    };

    // CPU check
    const loadAvg = os.loadavg()[0];
    const cpuCores = os.cpus().length;
    checks.cpu = {
      status: loadAvg < cpuCores * 0.8 ? 'healthy' : 'warning',
      loadAverage: loadAvg.toFixed(2),
      cores: cpuCores
    };

    return checks;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    // Check health every 5 minutes
    setInterval(async () => {
      const health = await this.getHealth();
      
      if (health.status === 'critical') {
        this.createAlert({
          type: 'system',
          severity: 'critical',
          message: 'System health critical',
          details: health
        });
      }
    }, 300000); // 5 minutes
  }

  /**
   * Create an alert
   */
  createAlert(alert) {
    const fullAlert = {
      ...alert,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    this.alerts.push(fullAlert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('🚨 CRITICAL ALERT:', alert.message);
    }
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 
        ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
        : '0%',
      apiCalls: this.metrics.apiCalls,
      dbQueries: this.metrics.dbQueries,
      performance: {
        avgResponseTime: this.metrics.performance.avgResponseTime.toFixed(2) + 'ms',
        sampleSize: this.metrics.performance.responseTimes.length
      },
      lastError: this.metrics.lastError
    };
  }

  /**
   * Clean up old metrics
   */
  cleanupMetrics() {
    // Reset response times if too many
    if (this.metrics.performance.responseTimes.length > 1000) {
      this.metrics.performance.responseTimes = 
        this.metrics.performance.responseTimes.slice(-500);
    }

    // Remove old alerts
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneWeekAgo
    );
  }

  /**
   * Format uptime in human readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      apiCalls: 0,
      dbQueries: 0,
      lastError: null,
      performance: {
        avgResponseTime: 0,
        responseTimes: []
      }
    };
    this.alerts = [];
  }
}

// Export singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;
