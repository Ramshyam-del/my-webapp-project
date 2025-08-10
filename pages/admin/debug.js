'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDebug() {
  const [session, setSession] = useState(null)
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session?.access_token) {
        try {
          const r = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
          const j = await r.json()
          setMe(j)
        } catch (e) {
          setError('Failed to call /api/admin/me')
        }
      }
    })()
  }, [])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const masked = (() => {
    try {
      const u = new URL(url)
      const h = u.host
      return h.replace(/[^.]/g, '*')
    } catch { return 'invalid' }
  })()

  return (
    <div className="p-6 space-y-3">
      <div>Supabase URL host (masked): {masked}</div>
      <div>Session email: {session?.user?.email || 'none'}</div>
      <div>Has token: {session?.access_token ? 'yes' : 'no'}</div>
      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">{JSON.stringify(me, null, 2)}</pre>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  )
}


