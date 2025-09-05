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
    const { status } = req.body

    if (!userId || !status) {
      return res.status(400).json({ ok: false, code: 'missing_params', message: 'Missing userId or status' })
    }

    // Update user status
    const { data: updatedUser, error: updateError } = await server
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user status:', updateError)
      return res.status(500).json({ ok: false, code: 'database_error', message: 'Failed to update user status' })
    }

    return res.status(200).json({
      ok: true,
      data: {
        user: updatedUser
      }
    })

  } catch (e) {
    console.error('User status API error:', e)
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}