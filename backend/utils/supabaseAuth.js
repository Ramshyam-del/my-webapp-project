const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!supabaseJwtSecret) {
  console.error('FATAL: SUPABASE_JWT_SECRET environment variable is required');
  process.exit(1);
}

// Create Supabase client for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Environment-dependent cookie configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Always false for localhost development
  sameSite: 'lax', // Always lax for cross-origin requests in development
  path: '/', // Explicitly set path
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

/**
 * Sign up user with Supabase Auth
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} userData - Additional user data
 * @returns {Object} Supabase auth response
 */
const signUpWithSupabase = async (email, password, userData = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          username: userData.username,
          phone: userData.phone
        }
      }
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Sign in user with Supabase Auth
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} Supabase auth response with session
 */
const signInWithSupabase = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Verify Supabase JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifySupabaseToken = (token) => {
  try {
    return jwt.verify(token, supabaseJwtSecret, {
      algorithms: ['HS256']
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Get user from Supabase token or fallback JWT
 * @param {string} token - JWT token
 * @returns {Object} User data with success flag
 */
const getUserFromToken = async (token) => {
  try {
    const decoded = verifySupabaseToken(token);
    const userId = decoded.sub;
    
    if (!userId) {
      return { success: false, error: 'No user ID in token' };
    }

    // Try to get user by ID first (for Supabase Auth users)
    let { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name, username, phone')
      .eq('id', userId)
      .single();

    // If not found by ID, try by email (for fallback tokens)
    if (error && decoded.email) {
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('id, email, role, status, first_name, last_name, username, phone')
        .eq('email', decoded.email)
        .single();
      
      if (!emailError && emailUser) {
        user = emailUser;
        error = null;
      }
    }

    if (error || !user || user.status !== 'active') {
      return { success: false, error: 'User not found or inactive' };
    }

    return { success: true, data: { user } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Set Supabase session cookies
 * @param {Object} res - Express response object
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
const setSupabaseTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('sb-access-token', accessToken, COOKIE_OPTIONS);
  res.cookie('sb-refresh-token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days for refresh token
  });
};

/**
 * Clear Supabase session cookies
 * @param {Object} res - Express response object
 */
const clearSupabaseTokenCookies = (res) => {
  res.clearCookie('sb-access-token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax'
  });
  res.clearCookie('sb-refresh-token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax'
  });
};

/**
 * Refresh Supabase session
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New session data or error
 */
const refreshSupabaseSession = async (refreshToken) => {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Sign out user from Supabase
 * @param {string} accessToken - Access token
 * @returns {Object} Sign out response
 */
const signOutFromSupabase = async (accessToken) => {
  try {
    // Create a temporary client with the user's token
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });

    const { error } = await userSupabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

module.exports = {
  signUpWithSupabase,
  signInWithSupabase,
  verifySupabaseToken,
  getUserFromToken,
  setSupabaseTokenCookies,
  clearSupabaseTokenCookies,
  refreshSupabaseSession,
  signOutFromSupabase,
  supabase,
  COOKIE_OPTIONS
};