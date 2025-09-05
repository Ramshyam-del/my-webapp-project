import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
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
    const { email, password, first_name, last_name, username, phone } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !username) {
      return res.status(400).json({
        ok: false,
        code: 'missing_fields',
        message: 'Email, password, first name, last name, and username are required'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        code: 'invalid_email',
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({
        ok: false,
        code: 'weak_password',
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmail) {
      return res.status(409).json({
        ok: false,
        code: 'email_exists',
        message: 'Email already exists. Please use a different email or try logging in.'
      });
    }

    // Check if username already exists
    const { data: existingUsername } = await supabaseAdmin
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

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = randomUUID();

    // Create user in database
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        password_hash,
        first_name,
        last_name,
        username,
        phone: phone || null,
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, first_name, last_name, username, phone, role, status')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json({
        ok: false,
        code: 'registration_failed',
        message: 'Failed to create user account'
      });
    }

    // Try to create Supabase Auth user (optional)
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        user_metadata: {
          first_name,
          last_name,
          username
        }
      });
    } catch (authError) {
      console.log('Supabase auth user creation failed (non-critical):', authError.message);
    }

    res.status(201).json({
      ok: true,
      message: 'Registration successful',
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Internal server error during registration'
    });
  }
}