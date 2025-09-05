export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ok: false, 
      code: 'method_not_allowed', 
      message: 'Method not allowed' 
    });
  }

  try {
    // Clear authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    };

    res.setHeader('Set-Cookie', [
      `sb-access-token=; ${Object.entries(cookieOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')}`,
      `sb-refresh-token=; ${Object.entries(cookieOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')}`
    ]);

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
}