require('dotenv').config();
const { serverSupabase } = require('../lib/supabaseServer');

/**
 * Extract JWT token from Authorization header or cookie
 */
function extractToken(req) {
  // Check Authorization header first
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie as fallback
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  
  return null;
}

/**
 * Authenticate user middleware - validates JWT and sets req.user
 */
async function authenticateUser(req, res, next) {
  // Note: Admin routes should be authenticated, not bypassed
  
  try {
    // Check if Supabase is configured
    if (!serverSupabase) {
      return res.status(503).json({ 
        ok: false, 
        code: 'misconfigured', 
        message: 'Database not configured' 
      });
    }

    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    // Validate token with Supabase
    console.log('🔍 Validating token with Supabase...');
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log(`❌ Token validation failed: ${authError?.message || 'No user found'}`);
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'Invalid authentication token' 
      });
    }
    
    console.log(`✅ Token valid for user: ${user.email} (ID: ${user.id})`);

    // Get user profile from database
    console.log(`🔍 Fetching profile for user ID: ${user.id}`);
    const { data: profile, error: profileError } = await serverSupabase
      .from('users')
      .select('id, email, role, status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If table doesn't exist or RLS blocks access, return unauthorized
      console.log(`❌ Profile fetch error: ${profileError.message}`);
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'User profile not found' 
      });
    }
    
    console.log(`✅ Profile found: ${profile.email} (Role: ${profile.role}, Status: ${profile.status})`);

    // Attach user to request
    req.user = profile;
    console.log(`✅ Authentication successful for ${profile.email}`);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      ok: false, 
      code: 'unauthorized', 
      message: 'Authentication failed' 
    });
  }
}

/**
 * Require admin role middleware - must be used after authenticateUser
 */
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      ok: false, 
      code: 'unauthorized', 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      ok: false, 
      code: 'access_denied', 
      message: 'Admin access required' 
    });
  }

  next();
}

module.exports = { 
  authenticateUser,
  requireAdmin 
};
