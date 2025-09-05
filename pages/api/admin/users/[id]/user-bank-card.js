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
    const { action = 'view' } = req.body

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

    // Get user's bank cards
    const { data: bankCards, error: bankCardsError } = await server
      .from('bank_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (bankCardsError) {
      console.error('Error fetching bank cards:', bankCardsError)
      return res.status(500).json({ ok: false, code: 'database_error', message: 'Failed to fetch bank cards' })
    }

    // Log the admin action
    await server
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: 'bank_card_access',
        target_user_id: userId,
        details: { 
          user_email: user.email, 
          action,
          bank_cards_count: bankCards?.length || 0
        },
        created_at: new Date().toISOString()
      })

    return res.status(200).json({
      ok: true,
      data: {
        message: 'Bank card information accessed successfully',
        user_id: userId,
        user_email: user.email,
        bank_cards: bankCards || [],
        total_cards: bankCards?.length || 0
      }
    })

  } catch (e) {
    console.error('Bank card API error:', e)
    return res.status(500).json({ ok: false, code: 'internal_error', message: 'Internal error' })
  }
}