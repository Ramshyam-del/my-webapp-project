const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Environment validation with graceful fallbacks
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

// Graceful environment validation (no system crash)
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('CRITICAL: Missing Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  console.error('Please check your environment configuration.');
  // Don't crash the system - let it start but log the error
}

if (!supabaseJwtSecret) {
  console.error('CRITICAL: SUPABASE_JWT_SECRET environment variable is missing.');
  console.error('Authentication will not work properly without this variable.');
  console.error('Please add SUPABASE_JWT_SECRET to your environment configuration.');
  // Don't crash the system - graceful degradation
}

// Create Supabase client with error handling
let supabase = null;
try {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error.message);
}

/**
 * Extract token from request (Authorization header or cookie)
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
const extractToken = (req) => {
  // First try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Then try cookies
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  
  // Check for Supabase session cookie
  if (req.cookies && req.cookies['sb-access-token']) {
    return req.cookies['sb-access-token'];
  }
  
  return null;
};

/**
 * Verify Supabase JWT token using the legacy JWT secret
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifySupabaseToken = (token) => {
  try {
    // Check if JWT secret is available
    if (!supabaseJwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET not configured');
    }
    
    return jwt.verify(token, supabaseJwtSecret, {
      algorithms: ['HS256']
    });
  } catch (error) {
    if (error.message === 'SUPABASE_JWT_SECRET not configured') {
      throw new Error('Authentication service not properly configured');
    }
    throw new Error('Invalid or expired token');
  }
};

/**
 * Supabase JWT Authentication middleware
 * Validates Supabase JWT token and attaches user info to request
 */
const authenticateSupabaseJWT = async (req, res, next) => {
  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return res.status(503).json({
        ok: false,
        code: 'service_unavailable',
        message: 'Authentication service not available'
      });
    }

    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        code: 'no_token',
        message: 'Access token required'
      });
    }

    // Verify the Supabase JWT token
    const decoded = verifySupabaseToken(token);
    
    // Extract user ID from token payload
    const userId = decoded.sub;
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        code: 'invalid_token',
        message: 'Invalid token payload'
      });
    }

    // Get fresh user data from database to ensure account is still active
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name, username, phone')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        ok: false,
        code: 'user_not_found',
        message: 'User not found'
      });
    }

    // Check if account is still active
    if (user.status !== 'active') {
      return res.status(401).json({
        ok: false,
        code: 'account_inactive',
        message: 'Account is not active'
      });
    }

    // Attach user info to request
    req.user = user;
    req.tokenPayload = decoded;
    req.supabaseToken = token;
    
    next();
  } catch (error) {
    console.error('Supabase JWT Authentication error:', error);
    
    if (error.message === 'Invalid or expired token') {
      return res.status(401).json({
        ok: false,
        code: 'invalid_token',
        message: 'Invalid or expired token'
      });
    }
    
    if (error.message === 'Authentication service not properly configured') {
      return res.status(503).json({
        ok: false,
        code: 'service_unavailable',
        message: 'Authentication service not properly configured'
      });
    }
    
    return res.status(500).json({
      ok: false,
      code: 'auth_error',
      message: 'Authentication error'
    });
  }
};

/**
 * Optional Supabase JWT Authentication middleware
 * Attaches user info if token is valid, but doesn't require authentication
 */
const optionalAuthenticateSupabaseJWT = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    // Verify the Supabase JWT token
    const decoded = verifySupabaseToken(token);
    const userId = decoded.sub;
    
    if (userId) {
      // Get user data from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role, status, first_name, last_name, username, phone')
        .eq('id', userId)
        .single();

      if (!userError && user && user.status === 'active') {
        // Attach user info to request if valid
        req.user = user;
        req.tokenPayload = decoded;
        req.supabaseToken = token;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without authentication
    console.warn('Optional Supabase JWT Authentication warning:', error.message);
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires specific role(s) to access the route
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        code: 'authentication_required',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        code: 'insufficient_permissions',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin role authorization middleware
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * User ownership authorization middleware
 * Ensures user can only access their own resources
 */
const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        code: 'authentication_required',
        message: 'Authentication required'
      });
    }

    const requestedUserId = req.params[userIdParam] || req.body[userIdParam];
    const currentUserId = req.user.id;
    
    // Admin can access any user's resources
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }
    
    // User can only access their own resources
    if (requestedUserId !== currentUserId) {
      return res.status(403).json({
        ok: false,
        code: 'access_denied',
        message: 'Access denied to this resource'
      });
    }

    next();
  };
};

module.exports = {
  authenticateSupabaseJWT,
  optionalAuthenticateSupabaseJWT,
  requireRole,
  requireAdmin,
  requireOwnership,
  extractToken,
  verifySupabaseToken
};