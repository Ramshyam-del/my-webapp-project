const express = require('express');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { signUpWithSupabase, signInWithSupabase, setSupabaseTokenCookies, clearSupabaseTokenCookies, getUserFromToken, refreshSupabaseSession, signOutFromSupabase } = require('../utils/supabaseAuth');
const { extractToken } = require('../middleware/supabaseAuth');
const { logLoginActivity, logRegistrationActivity } = require('../utils/activityLogger');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { sendOtp } = require('../utils/sendOtp');
const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const SALT_ROUNDS = 12; // High security salt rounds

// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
};

const isPasswordValid = (password) => {
  const validation = validatePassword(password);
  return validation.length && validation.uppercase && validation.lowercase && 
         validation.number && validation.special;
};

// Register endpoint with password hashing
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, username, phone } = req.body;

    // Input validation
    if (!email || !password || !firstName || !lastName || !username) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'All required fields must be provided'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Invalid email format'
      });
    }

    if (!isPasswordValid(password)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Check if user already exists (email)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        code: 'user_exists',
        message: 'User with this email already exists'
      });
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return res.status(409).json({
        ok: false,
        code: 'username_exists',
        message: 'Username already exists. Please choose a different username.'
      });
    }

    // Create user in Supabase Auth (auto-confirmed for development)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password, // Supabase will handle this securely
      email_confirm: true // Auto-confirm for development
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        ok: false,
        code: 'auth_error',
        message: authError.message || 'Failed to create user account'
      });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Store user profile with hashed password in database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        password_hash: hashedPassword, // Store hashed password
        first_name: firstName,
        last_name: lastName,
        username,
        phone: phone || null,
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, username, role, status')
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({
        ok: false,
        code: 'profile_error',
        message: 'Failed to create user profile'
      });
    }

    // Log registration activity
    await logRegistrationActivity(profile, req);

    res.status(201).json({
      ok: true,
      message: 'User registered successfully. You can now log in with your credentials.',
      user: profile
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error during registration'
    });
  }
});

// Login endpoint with password verification
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Email and password are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Invalid email format'
      });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, role, status, first_name, last_name, username')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        ok: false,
        code: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        ok: false,
        code: 'account_inactive',
        message: 'Account is not active. Please verify your email or contact support.'
      });
    }

    // Verify password with bcrypt or fallback to plain text for existing users
    console.log('Login attempt for:', email);
    console.log('Password provided:', password ? 'Yes' : 'No');
    console.log('Password hash exists:', user.password_hash ? 'Yes' : 'No');
    
    let passwordMatch = false;
    
    // Check if password is already hashed (bcrypt hashes start with $2b$)
    if (user.password_hash && user.password_hash.startsWith('$2b$')) {
      // Use bcrypt for hashed passwords
      passwordMatch = await bcrypt.compare(password, user.password_hash);
      console.log('Bcrypt comparison result:', passwordMatch);
    } else {
      // Fallback to plain text comparison for existing users
      passwordMatch = password === user.password_hash;
      console.log('Plain text comparison result:', passwordMatch);
      
      // If login successful with plain text, upgrade to hashed password
      if (passwordMatch) {
        console.log('Upgrading plain text password to hashed for user:', email);
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await supabase
          .from('users')
          .update({ 
            password_hash: hashedPassword,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    }
    
    if (!passwordMatch) {
      console.log('Password verification failed for user:', email);
      return res.status(401).json({
        ok: false,
        code: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }
    
    console.log('Login successful for user:', email);

    // Try to sign in with Supabase Auth, if fails, create the auth user
    let authResult = await signInWithSupabase(email, password);

    if (!authResult.success) {
      console.log('Supabase auth signin failed, attempting to create auth user:', authResult.error?.message);
      
      // Try to create the user in Supabase Auth if they don't exist
      try {
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });
        
        if (createError) {
          console.error('Failed to create Supabase auth user:', createError);
          // Continue without Supabase Auth session
          authResult = { success: false, error: createError };
        } else {
          console.log('Successfully created Supabase auth user, attempting signin again');
          authResult = await signInWithSupabase(email, password);
        }
      } catch (createErr) {
        console.error('Error creating Supabase auth user:', createErr);
        authResult = { success: false, error: createErr };
      }
    }

    // Set Supabase session cookies if auth was successful
    if (authResult.success && authResult.data.session) {
      setSupabaseTokenCookies(
        res, 
        authResult.data.session.access_token, 
        authResult.data.session.refresh_token
      );
    }

    // Update last login timestamp
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Log login activity
    await logLoginActivity(user, req, true);

    // Generate a fallback JWT token if Supabase Auth failed
    let sessionData = null;
    if (authResult.success && authResult.data.session) {
      sessionData = {
        access_token: authResult.data.session.access_token,
        refresh_token: authResult.data.session.refresh_token,
        expires_at: authResult.data.session.expires_at
      };
    } else {
      // Create a simple JWT token for fallback authentication
      const jwt = require('jsonwebtoken');
      const fallbackToken = jwt.sign(
        { 
          sub: user.id,
          email: user.email,
          role: user.role,
          aud: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        },
        process.env.SUPABASE_JWT_SECRET || (() => {
          console.error('CRITICAL: SUPABASE_JWT_SECRET environment variable is required for JWT signing');
          throw new Error('Missing SUPABASE_JWT_SECRET environment variable');
        })(),
        { algorithm: 'HS256' }
      );
      
      sessionData = {
        access_token: fallbackToken,
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      };
      
      // Set fallback token as cookie using consistent options
      const { COOKIE_OPTIONS } = require('../utils/supabaseAuth');
      res.cookie('sb-access-token', fallbackToken, COOKIE_OPTIONS);
    }

    res.json({
      ok: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role
      },
      session: sessionData
     });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error during login'
    });
  }
});

// Password change endpoint
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        ok: false,
        code: 'unauthorized',
        message: 'Authentication required'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Current password and new password are required'
      });
    }

    if (!isPasswordValid(newPassword)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        ok: false,
        code: 'user_not_found',
        message: 'User not found'
      });
    }

    // Verify current password with bcrypt or fallback to plain text
    let passwordMatch = false;
    
    // Check if password is already hashed (bcrypt hashes start with $2b$)
    if (user.password_hash && user.password_hash.startsWith('$2b$')) {
      // Use bcrypt for hashed passwords
      passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    } else {
      // Fallback to plain text comparison for existing users
      passwordMatch = currentPassword === user.password_hash;
    }
    
    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        code: 'invalid_password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        ok: false,
        code: 'update_error',
        message: 'Failed to update password'
      });
    }

    // Also update in Supabase Auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (authUpdateError) {
      console.error('Auth password update error:', authUpdateError);
      // Don't fail the request as database is already updated
    }

    res.json({
      ok: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error during password change'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // Extract token for Supabase logout
    const token = extractToken(req);
    
    if (token) {
      // Sign out from Supabase
      await signOutFromSupabase(token);
    }
    
    // Clear Supabase token cookies
    clearSupabaseTokenCookies(res);
    
    res.json({
      ok: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error during logout'
    });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.supabase_refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        ok: false,
        code: 'no_refresh_token',
        message: 'Refresh token required'
      });
    }

    // Refresh Supabase session
    const refreshResult = await refreshSupabaseSession(refreshToken);
    
    if (!refreshResult.success) {
      clearSupabaseTokenCookies(res);
      return res.status(401).json({
        ok: false,
        code: 'refresh_failed',
        message: 'Failed to refresh session'
      });
    }

    // Get user data from Supabase session
    const supabaseUser = refreshResult.data.user;
    
    // Get additional user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name, username')
      .eq('email', supabaseUser.email)
      .single();

    if (userError || !user) {
      clearSupabaseTokenCookies(res);
      return res.status(401).json({
        ok: false,
        code: 'user_not_found',
        message: 'User not found'
      });
    }

    // Check if account is still active
    if (user.status !== 'active') {
      clearSupabaseTokenCookies(res);
      return res.status(401).json({
        ok: false,
        code: 'account_inactive',
        message: 'Account is not active'
      });
    }

    // Set new Supabase session cookies
    setSupabaseTokenCookies(
      res,
      refreshResult.data.session.access_token,
      refreshResult.data.session.refresh_token
    );

    res.json({
      ok: true,
      message: 'Session refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role
      },
      session: {
        access_token: refreshResult.data.session.access_token,
        refresh_token: refreshResult.data.session.refresh_token,
        expires_at: refreshResult.data.session.expires_at
      }
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    clearSupabaseTokenCookies(res);
    
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error during session refresh'
    });
  }
});

// Get current user endpoint (protected)
router.get('/me', async (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        code: 'no_token',
        message: 'Access token required'
      });
    }

    // Get user from Supabase token
    const userResult = await getUserFromToken(token);
    
    if (!userResult.success) {
      return res.status(401).json({
        ok: false,
        code: 'invalid_token',
        message: 'Invalid or expired token'
      });
    }

    const supabaseUser = userResult.data.user;
    
    // Get additional user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name, username, phone, created_at, last_login')
      .eq('email', supabaseUser.email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        ok: false,
        code: 'user_not_found',
        message: 'User not found'
      });
    }

    // Check if account is still active
    if (user.status !== 'active') {
      return res.status(401).json({
        ok: false,
        code: 'account_inactive',
        message: 'Account is not active'
      });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        phone: user.phone,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.message === 'Invalid or expired token') {
      return res.status(401).json({
        ok: false,
        code: 'invalid_token',
        message: 'Invalid or expired token'
      });
    }
    
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error'
    });
  }
});

// Forgot password - Send OTP
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Valid email is required'
      });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, status')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return res.json({
        ok: true,
        message: 'If an account with this email exists, you will receive a password reset code.'
      });
    }

    if (user.status !== 'active') {
      return res.json({
        ok: true,
        message: 'If an account with this email exists, you will receive a password reset code.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database (you might want to create a separate table for this)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_otp: otp,
        reset_otp_expires: otpExpires.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to store OTP:', updateError);
      return res.status(500).json({
        ok: false,
        code: 'server_error',
        message: 'Failed to process password reset request'
      });
    }

    // Send OTP via email
    try {
      await sendOtp(email, otp);
      res.json({
        ok: true,
        message: 'Password reset code sent to your email.'
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Clear the OTP from database if email fails
      await supabase
        .from('users')
        .update({
          reset_otp: null,
          reset_otp_expires: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      return res.status(500).json({
        ok: false,
        code: 'email_error',
        message: 'Failed to send password reset email. Please try again.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error'
    });
  }
});

// Verify OTP for password reset
router.post('/verify-reset-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp || !validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Email and OTP are required'
      });
    }

    // Get user with OTP
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, reset_otp, reset_otp_expires, status')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_otp',
        message: 'Invalid or expired OTP'
      });
    }

    if (user.status !== 'active') {
      return res.status(400).json({
        ok: false,
        code: 'account_inactive',
        message: 'Account is not active'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.reset_otp || !user.reset_otp_expires) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_otp',
        message: 'Invalid or expired OTP'
      });
    }

    const otpExpires = new Date(user.reset_otp_expires);
    if (otpExpires < new Date()) {
      // Clear expired OTP
      await supabase
        .from('users')
        .update({
          reset_otp: null,
          reset_otp_expires: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      return res.status(400).json({
        ok: false,
        code: 'expired_otp',
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (user.reset_otp !== otp) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_otp',
        message: 'Invalid OTP'
      });
    }

    // OTP is valid - generate a temporary reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token and clear OTP
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_otp: null,
        reset_otp_expires: null,
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to store reset token:', updateError);
      return res.status(500).json({
        ok: false,
        code: 'server_error',
        message: 'Failed to verify OTP'
      });
    }

    res.json({
      ok: true,
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error'
    });
  }
});

// Reset password with token
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword || !validateEmail(email)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Email, reset token, and new password are required'
      });
    }

    if (!isPasswordValid(newPassword)) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Get user with reset token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, reset_token, reset_token_expires, status')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_token',
        message: 'Invalid or expired reset token'
      });
    }

    if (user.status !== 'active') {
      return res.status(400).json({
        ok: false,
        code: 'account_inactive',
        message: 'Account is not active'
      });
    }

    // Check if reset token exists and is not expired
    if (!user.reset_token || !user.reset_token_expires) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_token',
        message: 'Invalid or expired reset token'
      });
    }

    const tokenExpires = new Date(user.reset_token_expires);
    if (tokenExpires < new Date()) {
      // Clear expired token
      await supabase
        .from('users')
        .update({
          reset_token: null,
          reset_token_expires: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      return res.status(400).json({
        ok: false,
        code: 'expired_token',
        message: 'Reset token has expired. Please start the password reset process again.'
      });
    }

    // Verify reset token
    if (user.reset_token !== resetToken) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_token',
        message: 'Invalid reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return res.status(500).json({
        ok: false,
        code: 'server_error',
        message: 'Failed to reset password'
      });
    }

    // Also update Supabase Auth password if user exists there
    try {
      await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
      });
    } catch (authError) {
      console.log('Supabase auth password update failed (user may not exist in auth):', authError.message);
      // This is not critical - the database password is updated
    }

    res.json({
      ok: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;