const jwt = require('jsonwebtoken');
const { securityConfig, sanitizeInput } = require('../config/security');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, securityConfig.jwt.secret);
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      vipLevel: decoded.vipLevel
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

// VIP level authentication middleware
const requireVIPLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const vipLevels = ['VIP0', 'VIP1', 'VIP2', 'VIP3'];
    const userLevel = req.user.vipLevel || 'VIP0';
    const userLevelIndex = vipLevels.indexOf(userLevel);
    const requiredLevelIndex = vipLevels.indexOf(minLevel);

    if (userLevelIndex < requiredLevelIndex) {
      return res.status(403).json({ 
        error: `VIP level ${minLevel} required`,
        code: 'VIP_LEVEL_REQUIRED',
        requiredLevel: minLevel,
        currentLevel: userLevel
      });
    }

    next();
  };
};

// Rate limiting middleware for authentication endpoints
const authRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const key = `auth_${clientIP}`;
  
  // Simple in-memory rate limiting (replace with Redis in production)
  if (!req.app.locals.authAttempts) {
    req.app.locals.authAttempts = new Map();
  }

  const attempts = req.app.locals.authAttempts.get(key) || 0;
  const windowMs = securityConfig.authRateLimit.windowMs;
  const maxAttempts = securityConfig.authRateLimit.max;

  if (attempts >= maxAttempts) {
    return res.status(429).json({
      error: 'Too many authentication attempts',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }

  req.app.locals.authAttempts.set(key, attempts + 1);
  
  // Clear attempts after window
  setTimeout(() => {
    req.app.locals.authAttempts.delete(key);
  }, windowMs);

  next();
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const sanitizedBody = {};
    
    for (const [key, value] of Object.entries(req.body)) {
      if (schema[key]) {
        const validation = schema[key](value);
        if (!validation.valid) {
          return res.status(400).json({
            error: validation.message,
            field: key,
            code: 'VALIDATION_ERROR'
          });
        }
        sanitizedBody[key] = sanitizeInput(value);
      }
    }

    req.body = sanitizedBody;
    next();
  };
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  
  if (!csrfToken) {
    return res.status(403).json({
      error: 'CSRF token required',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // Validate CSRF token (implement proper validation)
  // For now, we'll just check if it exists
  next();
};

// Security headers middleware - simplified for development
const securityHeaders = (req, res, next) => {
  // Basic security headers for development
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Only add strict headers in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Log security events
    if (res.statusCode >= 400) {
      console.warn('Security Event:', logData);
    } else {
      console.log('Request:', logData);
    }
  });

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }

  res.status(500).json({
    error: err.message,
    stack: err.stack,
    code: 'INTERNAL_ERROR'
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireVIPLevel,
  authRateLimit,
  validateInput,
  csrfProtection,
  securityHeaders,
  requestLogger,
  errorHandler
}; 