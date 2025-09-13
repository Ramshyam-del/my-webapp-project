import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.headers['x-session-token'];
    if (!sessionToken) {
      return res.status(401).json({ error: 'Missing session token' });
    }

    // Invalidate the session
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Error invalidating session:', error);
      return res.status(500).json({ error: 'Failed to invalidate session' });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Session invalidated successfully'
    });
  } catch (error) {
    console.error('Session invalidation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}