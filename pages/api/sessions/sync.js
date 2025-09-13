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

    // Verify session exists and is valid
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
      return res.status(401).json({ error: 'Session expired' });
    }

    const { sessionData } = req.body;
    
    // Update session data
    const { error: updateError } = await supabaseAdmin
      .from('user_sessions')
      .update({ 
        session_data: sessionData || {},
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_token', sessionToken);

    if (updateError) {
      console.error('Error syncing session:', updateError);
      return res.status(500).json({ error: 'Failed to sync session' });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Session synced successfully'
    });
  } catch (error) {
    console.error('Session sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}