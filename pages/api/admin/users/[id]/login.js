import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, code: 'MISSING_TOKEN', message: 'Missing or invalid token' })
    }
    const token = authHeader.substring(7)

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, code: 'SERVER_MISCONFIG', message: 'Server misconfiguration' })
    }

    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: authData, error: authErr } = await server.auth.getUser(token)
    if (authErr || !authData?.user) {
      return res.status(401).json({ ok: false, code: 'INVALID_TOKEN', message: 'Invalid token' })
    }

    const userId = authData.user.id
    const { data: me, error: meErr } = await server
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    if (meErr) {
      return res.status(500).json({ ok: false, code: 'PROFILE_ERROR', message: 'Failed to load profile' })
    }
    if (me?.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Not an admin' })
    }

    const { id } = req.query

    // Get the target user
    const { data: targetUser, error: userErr } = await server
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single()

    if (userErr || !targetUser) {
      return res.status(404).json({ ok: false, code: 'USER_NOT_FOUND', message: 'User not found' })
    }

    // Generate a temporary login token (in a real implementation, you might use a different approach)
    const { data: loginData, error: loginErr } = await server.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/users`
      }
    })

    if (loginErr) {
      return res.status(500).json({ ok: false, code: 'LOGIN_ERROR', message: 'Failed to generate login link' })
    }

    return res.status(200).json({ 
      ok: true, 
      message: 'One-click login initiated',
      data: { userId: targetUser.id, email: targetUser.email }
    })
  } catch (e) {
    console.error('One-click login error:', e)
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Internal error' })
  }
}
