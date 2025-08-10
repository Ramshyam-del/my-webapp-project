#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' })
const { createClient } = require('@supabase/supabase-js')

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL) {
  console.error('Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL')
  process.exit(1)
}

;(async () => {
  try {
    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: list, error: listErr } = await server.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listErr) throw listErr
    const authUser = list?.users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    if (!authUser) {
      console.error('Admin auth user not found for email:', ADMIN_EMAIL)
      process.exit(2)
    }
    const uid = authUser.id
    const { data: existing, error: selErr } = await server.from('users').select('id,email,role,status').eq('id', uid).single()
    if (selErr && selErr.code !== 'PGRST116') {
      console.error('Select error:', selErr.message)
      process.exit(3)
    }
    if (!existing) {
      const { error: upErr } = await server.from('users').upsert({ id: uid, email: ADMIN_EMAIL.toLowerCase(), role: 'admin', status: 'active', updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (upErr) { console.error('Upsert error:', upErr.message); process.exit(4) }
      console.log('Created admin profile for', ADMIN_EMAIL)
    } else if (existing.role !== 'admin' || existing.status !== 'active') {
      const { error: updErr } = await server.from('users').update({ role: 'admin', status: 'active', updated_at: new Date().toISOString() }).eq('id', uid)
      if (updErr) { console.error('Update error:', updErr.message); process.exit(5) }
      console.log('Updated admin profile for', ADMIN_EMAIL)
    } else {
      console.log('Admin profile already correct for', ADMIN_EMAIL)
    }
    process.exit(0)
  } catch (e) {
    console.error('Error:', e.message)
    process.exit(10)
  }
})()


