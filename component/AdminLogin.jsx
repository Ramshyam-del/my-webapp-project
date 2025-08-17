'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { authedFetchJson } from '../lib/authedFetch';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from './ui/utils';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    
    try {
      // Sign in with Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        setErr(authError.message);
        return;
      }

      // Verify admin access using authedFetchJson
      try {
        const data = await authedFetchJson('/api/admin/me');
        
        if (data.ok && data.user) {
          // Success - call onLogin callback
          if (onLogin) {
            await onLogin();
          }
        } else {
          setErr('Access denied: Not an admin user');
        }
      } catch (fetchError) {
        console.error('Admin verification error:', fetchError);
        
        if (fetchError.code === 'unauthorized') {
          setErr('Authentication failed. Please try again.');
        } else if (fetchError.code === 'forbidden') {
          setErr('Access denied: Not an admin user');
        } else {
          setErr('Failed to verify admin access. Please try again.');
        }
      }
    } catch (e2) {
      console.error('Login error:', e2);
      setErr('Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Q</span>
          </div>
          <CardTitle className="text-xl">Admin Login</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {err && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {err}
            </div>
          )}
          
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </div>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}   