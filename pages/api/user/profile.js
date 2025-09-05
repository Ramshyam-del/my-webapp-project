import { serverSupabase } from '../../../lib/supabaseServer';

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      ok: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        message: 'No authentication token provided' 
      });
    }

    // Validate token with Supabase
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        ok: false, 
        message: 'Invalid authentication token' 
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await serverSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(404).json({ 
        ok: false, 
        message: 'User profile not found' 
      });
    }

    return res.status(200).json({ 
      ok: true, 
      user: profile 
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Internal server error' 
    });
  }
}