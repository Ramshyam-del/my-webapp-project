import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SessionService {
  generateSessionToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  generateBrowserFingerprint(deviceInfo, userAgent) {
    const fingerprint = {
      userAgent: userAgent || '',
      platform: deviceInfo.platform || '',
      language: deviceInfo.language || '',
      timestamp: deviceInfo.timestamp || Date.now()
    };
    return Buffer.from(JSON.stringify(fingerprint)).toString('base64');
  }

  async createSession(userId, deviceInfo = {}, ipAddress = null, userAgent = null) {
    try {
      console.log('SessionService: Creating session for user:', userId);
      
      const sessionToken = this.generateSessionToken();
      console.log('SessionService: Generated session token');
      
      const browserFingerprint = this.generateBrowserFingerprint(deviceInfo, userAgent);
      console.log('SessionService: Generated browser fingerprint');
      
      const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
      console.log('SessionService: Set expiration time:', expiresAt);

      console.log('SessionService: Inserting session into database...');
      const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          browser_fingerprint: browserFingerprint,
          device_info: deviceInfo,
          ip_address: ipAddress,
          user_agent: userAgent,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          session_data: {}
        })
        .select()
        .single();

      if (error) {
        console.error('SessionService: Database error:', error);
        console.error('SessionService: Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('SessionService: Session created successfully:', data.id);
      
      return {
        sessionId: data.id,
        sessionToken: sessionToken,
        expiresAt: expiresAt
      };
    } catch (error) {
      console.error('SessionService: Session creation error:', error);
      console.error('SessionService: Error stack:', error.stack);
      throw error;
    }
  }

  async getSession(sessionToken) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if session is expired
      if (new Date(data.expires_at) < new Date()) {
        await this.invalidateSession(sessionToken);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async invalidateSession(sessionToken) {
    try {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Error invalidating session:', error);
      }
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  async getUserSessions(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }
}

const sessionService = new SessionService();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'POST':
        return await handleCreateSession(req, res);
      case 'GET':
        return await handleGetSessions(req, res);
      case 'PUT':
        return await handleUpdateSession(req, res);
      case 'DELETE':
        return await handleDeleteSession(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sessions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateSession(req, res) {
  try {
    console.log('Session creation request received');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    console.log('Token received, verifying with Supabase...');
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Authentication failed', details: authError.message });
    }
    
    if (!user) {
      console.log('No user found for token');
      return res.status(401).json({ error: 'Invalid token - no user found' });
    }

    console.log('User authenticated:', user.id);
    
    const { deviceInfo } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log('Creating session for user:', user.id);
    
    const sessionResult = await sessionService.createSession(
      user.id,
      deviceInfo,
      ipAddress,
      userAgent
    );

    console.log('Session created successfully:', sessionResult.sessionId);
    
    return res.status(200).json({
      success: true,
      sessionToken: sessionResult.sessionToken,
      sessionId: sessionResult.sessionId,
      expiresAt: sessionResult.expiresAt
    });
  } catch (error) {
    console.error('Error creating session:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function handleGetSessions(req, res) {
  try {
    const sessionToken = req.headers['x-session-token'];
    if (!sessionToken) {
      return res.status(401).json({ error: 'Missing session token' });
    }

    const session = await sessionService.getSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const sessions = await sessionService.getUserSessions(session.user_id);
    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Error getting sessions:', error);
    return res.status(500).json({ error: 'Failed to get sessions' });
  }
}

async function handleUpdateSession(req, res) {
  try {
    const sessionToken = req.headers['x-session-token'];
    if (!sessionToken) {
      return res.status(401).json({ error: 'Missing session token' });
    }

    const session = await sessionService.getSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { sessionData } = req.body;
    
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ 
        session_data: sessionData,
        last_activity: new Date().toISOString()
      })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Error updating session:', error);
      return res.status(500).json({ error: 'Failed to update session' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
}

async function handleDeleteSession(req, res) {
  try {
    const sessionToken = req.headers['x-session-token'];
    if (!sessionToken) {
      return res.status(401).json({ error: 'Missing session token' });
    }

    await sessionService.invalidateSession(sessionToken);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
}