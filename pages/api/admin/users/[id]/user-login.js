import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, code: 'method_not_allowed', message: 'Method not allowed' })
    }

    // Accept Authorization header or Supabase cookie
    let token = null
    const authHeader = req.headers.authorization || ''
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      const cookie = req.headers.cookie || ''
      const m = cookie.match(/sb-access-token=([^;]+)/)
      if (m) token = decodeURIComponent(m[1])
    }

    if (!token) {
      return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Unauthorized' })
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, code: 'server_misconfig', message: 'Server misconfiguration' })
    }

    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: authData, error: authErr } = await server.auth.getUser(token)
    if (authErr || !authData?.user) {
      return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Unauthorized' })
    }

    const adminId = authData.user.id
    let { data: profile } = await server
      .from('users')
      .select('id,email,role,status')
      .eq('id', adminId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'not_admin', message: 'Not an admin' })
    }

    const { id: userId } = req.query

    if (!userId) {
      return res.status(400).json({ ok: false, code: 'missing_params', message: 'Missing userId' })
    }

    // Get user details
    const { data: user, error: userError } = await server
      .from('users')
      .select('id,email,status')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(404).json({ ok: false, code: 'user_not_found', message: 'User not found' })
    }

    if (user.status !== 'active') {
      return res.status(400).json({ ok: false, code: 'user_inactive', message: 'User is not active' })
    }

    // Generate a temporary login token (in a real implementation, you'd create a secure token)
    // For now, we'll just log the action and return success
    console.log(`Admin ${adminId} initiated one-click login for user ${userId}`)

    // Log the admin action
    await server
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'one_click_login',
        target_user_id: userId,
        details: { user_email: user.email },
        created_at: new Date().toISOString()
      })

    return res.status(200).json({
      ok: true,
      data: {
        message: 'One-click login initiated successfully',
        user_id: userId,
        user_email: user.email
      }
    })

  } catch (e) {
    console.error('One-click login API error:', e)
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}