const { serverSupabase } = require('../lib/supabaseServer');

/**
 * Log user activity to the database
 * @param {Object} params - Activity parameters
 * @param {string} params.user_id - User UUID
 * @param {string} params.user_email - User email
 * @param {string} params.activity_type - Type of activity
 * @param {string} params.activity_description - Description of the activity
 * @param {string} params.ip_address - User's IP address
 * @param {string} params.user_agent - User's browser user agent
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<boolean>} Success status
 */
async function logUserActivity({
  user_id,
  user_email,
  activity_type,
  activity_description,
  ip_address,
  user_agent,
  metadata = {}
}) {
  try {
    const { error } = await serverSupabase
      .from('user_activities')
      .insert({
        user_id,
        user_email,
        activity_type,
        activity_description,
        ip_address,
        user_agent,
        metadata
      });
    
    if (error) {
      console.error('Failed to log user activity:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error logging user activity:', error);
    return false;
  }
}

/**
 * Extract IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Extract user agent from request
 * @param {Object} req - Express request object
 * @returns {string} User agent
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Log user login activity
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {boolean} success - Whether login was successful
 */
async function logLoginActivity(user, req, success = true) {
  await logUserActivity({
    user_id: user.id,
    user_email: user.email,
    activity_type: success ? 'login' : 'login_failed',
    activity_description: success ? 'User logged in successfully' : 'Failed login attempt',
    ip_address: getClientIP(req),
    user_agent: getUserAgent(req),
    metadata: {
      success,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log user logout activity
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 */
async function logLogoutActivity(user, req) {
  await logUserActivity({
    user_id: user.id,
    user_email: user.email,
    activity_type: 'logout',
    activity_description: 'User logged out',
    ip_address: getClientIP(req),
    user_agent: getUserAgent(req),
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log user registration activity
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 */
async function logRegistrationActivity(user, req) {
  await logUserActivity({
    user_id: user.id,
    user_email: user.email,
    activity_type: 'registration',
    activity_description: 'New user registered',
    ip_address: getClientIP(req),
    user_agent: getUserAgent(req),
    metadata: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log trade activity
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {Object} tradeData - Trade information
 * @param {string} action - Trade action (created, completed, cancelled)
 */
async function logTradeActivity(user, req, tradeData, action = 'created') {
  await logUserActivity({
    user_id: user.id,
    user_email: user.email,
    activity_type: `trade_${action}`,
    activity_description: `Trade ${action}: ${tradeData.amount} ${tradeData.currency}`,
    ip_address: getClientIP(req),
    user_agent: getUserAgent(req),
    metadata: {
      trade_id: tradeData.id,
      amount: tradeData.amount,
      currency: tradeData.currency,
      action,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log withdrawal activity
 * @param {Object} user - User object
 * @param {Object} req - Express request object
 * @param {Object} withdrawalData - Withdrawal information
 * @param {string} action - Withdrawal action (requested, completed, cancelled)
 */
async function logWithdrawalActivity(user, req, withdrawalData, action = 'requested') {
  await logUserActivity({
    user_id: user.id,
    user_email: user.email,
    activity_type: `withdrawal_${action}`,
    activity_description: `Withdrawal ${action}: ${withdrawalData.amount} ${withdrawalData.currency}`,
    ip_address: getClientIP(req),
    user_agent: getUserAgent(req),
    metadata: {
      withdrawal_id: withdrawalData.id,
      amount: withdrawalData.amount,
      currency: withdrawalData.currency,
      action,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = {
  logUserActivity,
  getClientIP,
  getUserAgent,
  logLoginActivity,
  logLogoutActivity,
  logRegistrationActivity,
  logTradeActivity,
  logWithdrawalActivity
};