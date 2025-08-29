const { createClient } = require('@supabase/supabase-js');

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

// Authenticate user middleware
async function authenticateUser(req, res, next) {
  // Bypass admin API calls
  if (req.originalUrl && req.originalUrl.startsWith('/api/admin')) return next();
  if (req.isAdminApi === true) return next();
  
  // Optional debug logging
  if (process.env.DEBUG_ADMIN_AUTH === '1' && !res.headersSent) {
    console.warn('[globalAuthBlocked]', req.originalUrl);
  }
  
  try {

    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    // Validate token with Supabase
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

// Require admin role middleware
function requireAdmin(req, res, next) {
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
      code: 'forbidden', 
      message: 'Admin access required' 
    });
  }

  next();
}

module.exports = {
  authenticateUser,
  requireAdmin
}; 