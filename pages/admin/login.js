'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { authedFetchJson } from '../../lib/authedFetch';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../component/ui/card';
import { TooltipProvider } from '../../component/ui/tooltip';
import { ThemeProvider } from '../../providers/ThemeProvider';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Verify admin access
      try {
        const data = await authedFetchJson('/api/admin/me');
        
        if (data.ok && data.user && data.user.role === 'admin') {
          // Success - redirect to admin dashboard
          router.push('/admin');
        } else {
          setError('Access denied: This account is not an admin user');
          await supabase.auth.signOut();
        }
      } catch (fetchError) {
        console.error('Admin verification error:', fetchError);
        
        if (fetchError.code === 'unauthorized') {
          setError('Authentication failed. Please try again.');
        } else if (fetchError.code === 'forbidden') {
          setError('Access denied: This account is not an admin user');
          await supabase.auth.signOut();
        } else {
          setError('Failed to verify admin access. Please try again.');
        }
      }
    } catch (e) {
      console.error('Login error:', e);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex items-center justify-center min-h-screen bg-background">
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
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}


