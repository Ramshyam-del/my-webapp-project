import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { safeWindow, getSafeLocation } from '../utils/safeStorage';

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed top-6 right-6 z-50 bg-red-500 text-white px-4 py-2 rounded shadow-lg animate-bounceIn">
      {message}
      <button onClick={onClose} className="ml-4 text-white font-bold">&times;</button>
    </div>
  );
}

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'done'
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const router = useRouter();
  const { signIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setToast('');
    setLoading(true);
    try {
      // Use AuthContext signIn method for JWT backend authentication
      const result = await signIn(email, password);

      if (!result.success) {
        setError(result.error?.message || 'Login failed');
        setToast(result.error?.message || 'Login failed');
      } else {
        setToast('Login successful!');
        // Redirect to exchange page after successful login
        router.push('/exchange');
      }
    } catch (err) {
      setError('An error occurred during login.');
      setToast('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password flow
  const handleForgotChange = (e) => {
    setForgotForm({ ...forgotForm, [e.target.name]: e.target.value });
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setToast('');
    setError('');
    setLoading(true);
    try {
      if (forgotStep === 'email') {
        // Use Supabase password reset
        const { error } = await supabase.auth.resetPasswordForEmail(forgotForm.email, {
          redirectTo: `${getSafeLocation()?.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
        });
        
        if (error) {
          setError(error.message || 'Failed to send reset email');
        } else {
          setToast('Password reset email sent to your email.');
          setForgotStep('done');
        }
      }
    } catch (err) {
      setError('An error occurred during password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toast message={toast} onClose={() => setToast('')} />
      {!showForgot ? (
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm" htmlFor="login-email">EMAIL</label>
            <input
              id="login-email"
              type="email"
              aria-label="Email address"
              className="w-full bg-gray-800 text-white p-3 mt-1 rounded focus:outline-none"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm" htmlFor="login-password">PASSWORD</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                aria-label="Password"
                className="w-full bg-gray-800 text-white p-3 mt-1 rounded focus:outline-none"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-4 right-4 cursor-pointer text-sm"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                role="button"
                tabIndex={0}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-600"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-cyan-400 hover:underline text-sm"
              onClick={() => setShowForgot(true)}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleForgotSubmit} className="space-y-6">
          {forgotStep === 'email' && (
            <div>
              <label className="text-sm" htmlFor="forgot-email">Enter your email</label>
              <input
                id="forgot-email"
                type="email"
                name="email"
                className="w-full bg-gray-800 text-white p-3 mt-1 rounded focus:outline-none"
                placeholder="Enter your email"
                value={forgotForm.email}
                onChange={handleForgotChange}
                required
              />
            </div>
          )}
          {forgotStep === 'done' && (
            <div className="text-green-500 text-center font-bold">Password reset email sent! Check your email for the reset link.</div>
          )}
          {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
          {forgotStep !== 'done' && (
            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-600"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Processing...' : 'Send Reset Email'}
            </button>
          )}
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-cyan-400 hover:underline text-sm"
              onClick={() => { setShowForgot(false); setForgotStep('email'); setForgotForm({ email: '' }); setError(''); }}
            >
              Back to login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};