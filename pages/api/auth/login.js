import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

/**
 * Set Supabase token cookies
 */
function setSupabaseTokenCookies(res, accessToken, refreshToken) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };

  res.setHeader('Set-Cookie', [
    `sb-access-token=${accessToken}; ${Object.entries(cookieOptions)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')}`,
    refreshToken ? `sb-refresh-token=${refreshToken}; ${Object.entries(cookieOptions)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')}` : null
  ].filter(Boolean));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ok: false, 
      code: 'method_not_allowed', 
      message: 'Method not allowed' 
    });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        code: 'missing_fields',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, role, status, first_name, last_name, username, phone')
      .eq('email', email.toLowerCase())
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
      return res.status(403).json({
        ok: false,
        code: 'account_inactive',
        message: 'Account is not active'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        ok: false,
        code: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    }

    // Try to sign in with Supabase Auth
    let authResult = { success: false };
    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (!error && data.session) {
        authResult = { success: true, data };
      }
    } catch (authError) {
      console.log('Supabase auth failed, using fallback JWT:', authError.message);
    }

    // Set Supabase session cookies if auth was successful
    if (authResult.success && authResult.data.session) {
      setSupabaseTokenCookies(
        res, 
        authResult.data.session.access_token, 
        authResult.data.session.refresh_token
      );
    } else {
      // Create a fallback JWT token
      const jwt = require('jsonwebtoken');
      const fallbackToken = jwt.sign(
        { 
          sub: user.id,
          email: user.email,
          role: user.role,
          aud: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        },
        process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET,
        { algorithm: 'HS256' }
      );
      
      // Set fallback token as cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      };
      
      res.setHeader('Set-Cookie', 
        `sb-access-token=${fallbackToken}; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`
      );
    }

    // Update last login timestamp
    await supabaseAdmin
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      ok: true,
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error during login'
    });
  }
}