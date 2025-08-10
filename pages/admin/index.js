'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AdminHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!active) return
      if (!session) {
        router.replace('/admin/login')
        return
      }
      const resp = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!active) return
      if (resp.ok) {
        setIsAdmin(true)
      } else {
        await supabase.auth.signOut()
        router.replace('/admin/login')
      }
      setLoading(false)
    })()
    return () => { active = false }
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>
  }
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <button className="text-sm text-red-600" onClick={async () => { await supabase.auth.signOut(); router.replace('/admin/login') }}>Sign out</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Users" value="—" />
        <Stat title="Orders" value="—" />
        <Stat title="Transactions" value="—" />
      </div>
    </div>
  )
}

function Stat({ title, value }) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

export async function getServerSideProps({ req, res }) {
  try {
    const cookie = req.headers['cookie'] || ''
    const match = cookie.match(/sb-access-token=([^;]+)/)
    const token = match ? decodeURIComponent(match[1]) : null
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!token || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return { redirect: { destination: '/admin/login', permanent: false } }
    }
    const { createClient } = require('@supabase/supabase-js')
    const server = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: authData } = await server.auth.getUser(token)
    const userId = authData?.user?.id
    if (!userId) return { redirect: { destination: '/admin/login', permanent: false } }
    const { data: me } = await server.from('users').select('role').eq('id', userId).single()
    if (me?.role !== 'admin') return { redirect: { destination: '/admin/login', permanent: false } }
    return { props: {} }
  } catch {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
}


