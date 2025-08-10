import { createClient } from '@supabase/supabase-js'

function parseIntSafe(value, fallback) {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
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

    const page = parseIntSafe(req.query.page, 1)
    const limit = parseIntSafe(req.query.limit, 20)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: users, error: usersErr } = await server
      .from('users')
      .select('id,email,role,status,created_at')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (usersErr) {
      return res.status(500).json({ ok: false, code: 'QUERY_ERROR', message: 'Failed to fetch users' })
    }

    return res.status(200).json({ ok: true, page, limit, data: users || [] })
  } catch (e) {
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Internal error' })
  }
}


