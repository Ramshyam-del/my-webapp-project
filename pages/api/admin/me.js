import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
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

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOW_PROFILE_AUTOCREATE } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, code: 'server_misconfig', message: 'Server misconfiguration' })
    }

    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: authData, error: authErr } = await server.auth.getUser(token)
    if (authErr || !authData?.user) {
      return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Unauthorized' })
    }

    const userId = authData.user.id
    let { data: profile } = await server
      .from('users')
      .select('id,email,role,status')
      .eq('id', userId)
      .single()

    if (!profile && ALLOW_PROFILE_AUTOCREATE === 'true') {
      await server
        .from('users')
        .upsert({ id: userId, email: authData.user.email, role: 'user', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'id' })
      const re = await server
        .from('users')
        .select('id,email,role,status')
        .eq('id', userId)
        .single()
      profile = re.data || null
    }

    if (!profile) {
      return res.status(403).json({ ok: false, code: 'not_admin', message: 'Not an admin' })
    }

    if (profile.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'not_admin', message: 'Not an admin' })
    }

    return res.status(200).json({ ok: true, user: profile })
  } catch (e) {
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}


