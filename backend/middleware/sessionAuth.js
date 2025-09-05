const { createClient } = require('@supabase/supabase-js');
const sessionService = require('../services/sessionService');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extract token from Authorization header or cookie
function extractToken(req) {
  // Check Authorization header
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  
  return null;
}

// Extract session token from headers or cookies
function extractSessionToken(req) {
  // Check custom session header
  const sessionHeader = req.headers['x-session-token'];
  if (sessionHeader) {
    return sessionHeader;
  }
  
  // Check session cookie
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session-token=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  
  return null;
}

// Get device info from request
function getDeviceInfo(req) {
  return {
    userAgent: req.headers['user-agent'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    platform: req.headers['sec-ch-ua-platform'] || '',
    mobile: req.headers['sec-ch-ua-mobile'] || 'false'
  };
}

// Enhanced authenticate user middleware with session management
async function authenticateUserWithSession(req, res, next) {
  // Bypass admin API calls
  if (req.originalUrl && req.originalUrl.startsWith('/api/admin')) return next();
  if (req.isAdminApi === true) return next();
  
  try {
    const token = extractToken(req);
    const sessionToken = extractSessionToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    // Validate Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'Invalid authentication token' 
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Create user profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, email, role, status')
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return res.status(500).json({ 
          ok: false, 
          code: 'server_error', 
          message: 'Failed to create user profile' 
        });
      }

      req.user = newProfile;
    } else {
      req.user = profile;
    }

    // Handle session management
    let sessionData = null;
    
    if (sessionToken) {
      // Validate existing session
      sessionData = await sessionService.validateSession(sessionToken);
      
      if (!sessionData || sessionData.userId !== user.id) {
        // Invalid session, create new one
        sessionData = await createNewSession(user.id, req);
      }
    } else {
      // No session token, create new session
      sessionData = await createNewSession(user.id, req);
    }

    // Attach session info to request
    req.session = sessionData;
    req.sessionToken = sessionData ? sessionData.sessionId : null;

    // Set session cookie if new session was created
    if (sessionData && !sessionToken) {
      res.cookie('session-token', sessionData.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      ok: false, 
      code: 'server_error', 
      message: 'Authentication failed' 
    });
  }
}

// Create new session helper
async function createNewSession(userId, req) {
  try {
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return await sessionService.createSession(userId, deviceInfo, ipAddress, userAgent);
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

// Middleware to sync session data across browsers
async function syncSessionData(req, res, next) {
  if (!req.session || !req.sessionToken) {
    return next();
  }

  try {
    // Get latest session data
    const sessionData = await sessionService.getSessionData(req.session.sessionToken);
    
    if (sessionData) {
      req.sessionData = sessionData.sessionData;
    }

    next();
  } catch (error) {
    console.error('Session sync error:', error);
    next();
  }
}

// Middleware to update session data
async function updateSessionData(sessionToken, data) {
  try {
    return await sessionService.updateSessionData(sessionToken, data);
  } catch (error) {
    console.error('Error updating session data:', error);
    return false;
  }
}

// Middleware to broadcast updates to all user sessions
async function broadcastToUserSessions(userId, updateData, excludeSessionToken = null) {
  try {
    return await sessionService.broadcastSessionUpdate(userId, updateData, excludeSessionToken);
  } catch (error) {
    console.error('Error broadcasting session update:', error);
    return false;
  }
}

// Get all active sessions for a user
async function getUserSessions(userId) {
  try {
    return await sessionService.getUserActiveSessions(userId);
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
}

// Invalidate specific session
async function invalidateSession(sessionToken, userId = null) {
  try {
    return await sessionService.invalidateSession(sessionToken, userId);
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
}

// Invalidate all other sessions except current
async function invalidateOtherSessions(userId, currentSessionToken) {
  try {
    return await sessionService.invalidateOtherSessions(userId, currentSessionToken);
  } catch (error) {
    console.error('Error invalidating other sessions:', error);
    return false;
  }
}

// Require admin role middleware (enhanced with session)
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      ok: false, 
      code: 'unauthorized', 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      ok: false, 
      code: 'forbidden', 
      message: 'Admin access required' 
    });
  }

  next();
}

// Session-aware JWT middleware
async function authenticateJWTWithSession(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    // Verify JWT and validate session
    const authData = await sessionService.verifyJWTAndSession(token);
    
    if (!authData) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'Invalid token or session' 
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', authData.userId)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'User not found' 
      });
    }

    req.user = profile;
    req.session = authData.session;
    req.sessionToken = authData.sessionToken;

    next();
  } catch (error) {
    console.error('JWT session authentication error:', error);
    return res.status(500).json({ 
      ok: false, 
      code: 'server_error', 
      message: 'Authentication failed' 
    });
  }
}

module.exports = {
  authenticateUserWithSession,
  syncSessionData,
  updateSessionData,
  broadcastToUserSessions,
  getUserSessions,
  invalidateSession,
  invalidateOtherSessions,
  requireAdmin,
  authenticateJWTWithSession,
  extractToken,
  extractSessionToken,
  getDeviceInfo
};