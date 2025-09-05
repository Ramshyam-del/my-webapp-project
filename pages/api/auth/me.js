import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      ok: false, 
      code: 'method_not_allowed', 
      message: 'Method not allowed' 
    });
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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        ok: false, 
        code: 'unauthorized', 
        message: 'Invalid authentication token' 
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, first_name, last_name, username, phone')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Create user profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, email, role, status, first_name, last_name, username, phone')
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        return res.status(500).json({ 
          ok: false, 
          code: 'profile_creation_failed', 
          message: 'Failed to create user profile' 
        });
      }

      return res.json({ 
        ok: true, 
        user: newProfile 
      });
    }

    if (profile.status !== 'active') {
      return res.status(403).json({ 
        ok: false, 
        code: 'account_inactive', 
        message: 'Account is not active' 
      });
    }

    res.json({ 
      ok: true, 
      user: profile 
    });

  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ 
      ok: false, 
      code: 'server_error', 
      message: 'Internal server error' 
    });
  }
}