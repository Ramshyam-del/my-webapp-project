const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const { 
  authenticateUserWithSession, 
  syncSessionData, 
  updateSessionData,
  broadcastToUserSessions,
  getUserSessions,
  invalidateSession,
  invalidateOtherSessions,
  getDeviceInfo
} = require('../middleware/sessionAuth');
const { respond } = require('../middleware/respond');

// Get current session info
router.get('/current', authenticateUserWithSession, syncSessionData, async (req, res) => {
  try {
    if (!req.session) {
      return respond(res, 404, false, 'No active session found');
    }

    const sessionInfo = {
      sessionId: req.session.sessionId,
      userId: req.session.userId,
      deviceInfo: req.session.deviceInfo,
      lastActivity: req.session.lastActivity,
      sessionData: req.sessionData || {}
    };

    respond(res, 200, true, 'Session info retrieved', sessionInfo);
  } catch (error) {
    console.error('Get current session error:', error);
    respond(res, 500, false, 'Failed to get session info');
  }
});

// Get all active sessions for current user
router.get('/all', authenticateUserWithSession, async (req, res) => {
  try {
    const sessions = await getUserSessions(req.user.id);
    
    const sessionList = sessions.map(session => ({
      sessionId: session.session_id,
      deviceInfo: session.device_info,
      ipAddress: session.ip_address,
      lastActivity: session.last_activity,
      createdAt: session.created_at,
      isCurrent: session.session_token === req.session?.sessionToken
    }));

    respond(res, 200, true, 'User sessions retrieved', { sessions: sessionList });
  } catch (error) {
    console.error('Get user sessions error:', error);
    respond(res, 500, false, 'Failed to get user sessions');
  }
});

// Update session data for cross-browser sync
router.put('/data', authenticateUserWithSession, async (req, res) => {
  try {
    const { sessionData } = req.body;
    
    if (!sessionData || typeof sessionData !== 'object') {
      return respond(res, 400, false, 'Invalid session data');
    }

    if (!req.session?.sessionToken) {
      return respond(res, 400, false, 'No active session');
    }

    const success = await updateSessionData(req.session.sessionToken, sessionData);
    
    if (!success) {
      return respond(res, 500, false, 'Failed to update session data');
    }

    respond(res, 200, true, 'Session data updated successfully');
  } catch (error) {
    console.error('Update session data error:', error);
    respond(res, 500, false, 'Failed to update session data');
  }
});

// Broadcast update to all user sessions
router.post('/broadcast', authenticateUserWithSession, async (req, res) => {
  try {
    const { updateData, excludeCurrent = true } = req.body;
    
    if (!updateData || typeof updateData !== 'object') {
      return respond(res, 400, false, 'Invalid update data');
    }

    const excludeToken = excludeCurrent ? req.session?.sessionToken : null;
    const success = await broadcastToUserSessions(req.user.id, updateData, excludeToken);
    
    if (!success) {
      return respond(res, 500, false, 'Failed to broadcast update');
    }

    respond(res, 200, true, 'Update broadcasted successfully');
  } catch (error) {
    console.error('Broadcast session update error:', error);
    respond(res, 500, false, 'Failed to broadcast update');
  }
});

// Sync session data from other browsers
router.get('/sync', authenticateUserWithSession, syncSessionData, async (req, res) => {
  try {
    const syncData = {
      sessionData: req.sessionData || {},
      lastSync: new Date().toISOString()
    };

    respond(res, 200, true, 'Session data synced', syncData);
  } catch (error) {
    console.error('Sync session data error:', error);
    respond(res, 500, false, 'Failed to sync session data');
  }
});

// Create new session (for manual session creation)
router.post('/create', authenticateUserWithSession, async (req, res) => {
  try {
    const deviceInfo = getDeviceInfo(req);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const newSession = await sessionService.createSession(
      req.user.id, 
      deviceInfo, 
      ipAddress, 
      userAgent
    );

    if (!newSession) {
      return respond(res, 500, false, 'Failed to create session');
    }

    // Set session cookie
    res.cookie('session-token', newSession.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    respond(res, 201, true, 'Session created successfully', {
      sessionId: newSession.sessionId,
      expiresAt: newSession.expiresAt
    });
  } catch (error) {
    console.error('Create session error:', error);
    respond(res, 500, false, 'Failed to create session');
  }
});

// Invalidate current session (logout)
router.delete('/current', authenticateUserWithSession, async (req, res) => {
  try {
    if (!req.session?.sessionToken) {
      return respond(res, 400, false, 'No active session to invalidate');
    }

    const success = await invalidateSession(req.session.sessionToken, req.user.id);
    
    if (!success) {
      return respond(res, 500, false, 'Failed to invalidate session');
    }

    // Clear session cookie
    res.clearCookie('session-token');

    respond(res, 200, true, 'Session invalidated successfully');
  } catch (error) {
    console.error('Invalidate session error:', error);
    respond(res, 500, false, 'Failed to invalidate session');
  }
});

// Invalidate specific session by ID
router.delete('/:sessionId', authenticateUserWithSession, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session details to verify ownership
    const sessions = await getUserSessions(req.user.id);
    const targetSession = sessions.find(s => s.session_id === sessionId);
    
    if (!targetSession) {
      return respond(res, 404, false, 'Session not found or not owned by user');
    }

    const success = await invalidateSession(targetSession.session_token, req.user.id);
    
    if (!success) {
      return respond(res, 500, false, 'Failed to invalidate session');
    }

    respond(res, 200, true, 'Session invalidated successfully');
  } catch (error) {
    console.error('Invalidate specific session error:', error);
    respond(res, 500, false, 'Failed to invalidate session');
  }
});

// Invalidate all other sessions (keep current)
router.delete('/others/all', authenticateUserWithSession, async (req, res) => {
  try {
    if (!req.session?.sessionToken) {
      return respond(res, 400, false, 'No current session found');
    }

    const invalidatedCount = await invalidateOtherSessions(req.user.id, req.session.sessionToken);
    
    if (invalidatedCount === false) {
      return respond(res, 500, false, 'Failed to invalidate other sessions');
    }

    respond(res, 200, true, `${invalidatedCount} sessions invalidated successfully`, {
      invalidatedCount
    });
  } catch (error) {
    console.error('Invalidate other sessions error:', error);
    respond(res, 500, false, 'Failed to invalidate other sessions');
  }
});

// Get session statistics
router.get('/stats', authenticateUserWithSession, async (req, res) => {
  try {
    const sessions = await getUserSessions(req.user.id);
    
    const stats = {
      totalActiveSessions: sessions.length,
      currentSessionId: req.session?.sessionId,
      oldestSession: sessions.length > 0 ? Math.min(...sessions.map(s => new Date(s.created_at).getTime())) : null,
      newestSession: sessions.length > 0 ? Math.max(...sessions.map(s => new Date(s.created_at).getTime())) : null,
      deviceTypes: sessions.reduce((acc, session) => {
        const isMobile = session.device_info?.mobile === 'true' || session.device_info?.mobile === true;
        acc[isMobile ? 'mobile' : 'desktop'] = (acc[isMobile ? 'mobile' : 'desktop'] || 0) + 1;
        return acc;
      }, {})
    };

    respond(res, 200, true, 'Session statistics retrieved', stats);
  } catch (error) {
    console.error('Get session stats error:', error);
    respond(res, 500, false, 'Failed to get session statistics');
  }
});

// Health check for session service
router.get('/health', async (req, res) => {
  try {
    // Test session service connectivity
    const testResult = await sessionService.cleanupExpiredSessions();
    
    respond(res, 200, true, 'Session service is healthy', {
      timestamp: new Date().toISOString(),
      cleanupResult: testResult
    });
  } catch (error) {
    console.error('Session service health check error:', error);
    respond(res, 500, false, 'Session service health check failed');
  }
});

module.exports = router;