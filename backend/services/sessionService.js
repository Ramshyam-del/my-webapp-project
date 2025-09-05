const { serverSupabase } = require('../lib/supabaseServer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class SessionService {
  constructor() {
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour
    this.startCleanupTimer();
  }

  /**
   * Create a new session for cross-browser synchronization
   */
  async createSession(userId, deviceInfo = {}, ipAddress = null, userAgent = null) {
    try {
      const sessionToken = this.generateSessionToken();
      const browserFingerprint = this.generateBrowserFingerprint(deviceInfo, userAgent);
      const expiresAt = new Date(Date.now() + this.sessionTimeout);

      const { data, error } = await serverSupabase
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
        console.error('Error creating session:', error);
        throw new Error('Failed to create session');
      }

      // Log session creation activity
      await this.logSessionActivity(userId, 'session_created', {
        session_id: data.id,
        device_info: deviceInfo,
        ip_address: ipAddress
      });

      return {
        sessionId: data.id,
        sessionToken: sessionToken,
        expiresAt: expiresAt
      };
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  }

  /**
   * Validate and refresh a session
   */
  async validateSession(sessionToken) {
    try {
      const { data, error } = await serverSupabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Update last activity
      await serverSupabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', data.id);

      return {
        sessionId: data.id,
        userId: data.user_id,
        sessionData: data.session_data,
        deviceInfo: data.device_info,
        lastActivity: data.last_activity
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Update session data for cross-browser state sync
   */
  async updateSessionData(sessionToken, sessionData) {
    try {
      const { error } = await serverSupabase
        .from('user_sessions')
        .update({
          session_data: sessionData,
          last_activity: new Date().toISOString()
        })
        .eq('session_token', sessionToken)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating session data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session data update error:', error);
      return false;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserActiveSessions(userId) {
    try {
      const { data, error } = await serverSupabase
        .rpc('get_user_active_sessions', { target_user_id: userId });

      if (error) {
        console.error('Error getting user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }

  /**
   * Invalidate a specific session
   */
  async invalidateSession(sessionToken, userId = null) {
    try {
      const { error } = await serverSupabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Error invalidating session:', error);
        return false;
      }

      if (userId) {
        await this.logSessionActivity(userId, 'session_invalidated', {
          session_token: sessionToken
        });
      }

      return true;
    } catch (error) {
      console.error('Session invalidation error:', error);
      return false;
    }
  }

  /**
   * Invalidate all sessions except the current one
   */
  async invalidateOtherSessions(userId, currentSessionToken) {
    try {
      const { data, error } = await serverSupabase
        .rpc('invalidate_other_sessions', {
          target_user_id: userId,
          current_session_token: currentSessionToken
        });

      if (error) {
        console.error('Error invalidating other sessions:', error);
        return false;
      }

      return data || 0;
    } catch (error) {
      console.error('Invalidate other sessions error:', error);
      return false;
    }
  }

  /**
   * Get session data for cross-browser synchronization
   */
  async getSessionData(sessionToken) {
    try {
      const { data, error } = await serverSupabase
        .from('user_sessions')
        .select('session_data, user_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.user_id,
        sessionData: data.session_data
      };
    } catch (error) {
      console.error('Get session data error:', error);
      return null;
    }
  }

  /**
   * Broadcast session update to all user sessions
   */
  async broadcastSessionUpdate(userId, updateData, excludeSessionToken = null) {
    try {
      let query = serverSupabase
        .from('user_sessions')
        .update({
          session_data: updateData,
          last_activity: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (excludeSessionToken) {
        query = query.neq('session_token', excludeSessionToken);
      }

      const { error } = await query;

      if (error) {
        console.error('Error broadcasting session update:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Broadcast session update error:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const { data, error } = await serverSupabase
        .rpc('cleanup_expired_sessions');

      if (error) {
        console.error('Error cleaning up sessions:', error);
        return 0;
      }

      if (data > 0) {
        console.log(`Cleaned up ${data} expired sessions`);
      }

      return data || 0;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  }

  /**
   * Generate a secure session token
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate browser fingerprint for device identification
   */
  generateBrowserFingerprint(deviceInfo, userAgent) {
    const fingerprint = {
      userAgent: userAgent || '',
      screen: deviceInfo.screen || '',
      timezone: deviceInfo.timezone || '',
      language: deviceInfo.language || '',
      platform: deviceInfo.platform || ''
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprint))
      .digest('hex');
  }

  /**
   * Log session activity
   */
  async logSessionActivity(userId, activityType, metadata = {}) {
    try {
      await serverSupabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          description: `Session ${activityType.replace('_', ' ')}`,
          metadata: metadata
        });
    } catch (error) {
      console.error('Error logging session activity:', error);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupInterval);

    // Run initial cleanup
    setTimeout(() => {
      this.cleanupExpiredSessions();
    }, 5000);
  }

  /**
   * Create JWT token with session information
   */
  createJWTWithSession(userId, sessionToken, additionalPayload = {}) {
    const payload = {
      userId,
      sessionToken,
      ...additionalPayload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.sessionTimeout) / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
  }

  /**
   * Verify JWT and validate session
   */
  async verifyJWTAndSession(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const session = await this.validateSession(decoded.sessionToken);
      
      if (!session || session.userId !== decoded.userId) {
        return null;
      }

      return {
        userId: decoded.userId,
        sessionToken: decoded.sessionToken,
        session: session
      };
    } catch (error) {
      console.error('JWT verification error:', error);
      return null;
    }
  }
}

module.exports = new SessionService();