'use client'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // Attempt sign-in
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        if (process.env.NODE_ENV !== 'production') console.error('Admin login sign-in error:', signInErr)
        setError(signInErr.message || 'Login failed')
        return
      }

      // Validate admin role
      const token = data.session?.access_token
      if (!token) {
        if (process.env.NODE_ENV !== 'production') console.error('Admin login error: missing session token')
        setError('Login failed')
        return
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      let resp
      try {
        resp = await fetch('/api/admin/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      } catch (netErr) {
        if (process.env.NODE_ENV !== 'production') console.error('Admin /api/admin/me network error:', netErr)
        setError('Network error, please try again.')
        return
      } finally {
        clearTimeout(timeout)
      }
      const json = await resp.json()
      if (!resp.ok || !json.ok) {
        await supabase.auth.signOut()
        if (process.env.NODE_ENV !== 'production') console.error('Admin role check failed:', json)
        setError(json?.error || json?.message || 'Not an admin')
        return
      }

      // Success
      router.replace('/admin')
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Admin login unexpected error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}


