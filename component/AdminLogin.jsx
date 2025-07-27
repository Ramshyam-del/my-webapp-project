import { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://quantex.online/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('adminToken', data.token);
      if (rememberMe) {
        localStorage.setItem('adminRememberMe', 'true');
      } else {
        localStorage.removeItem('adminRememberMe');
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-200 relative overflow-hidden">
      {/* Decorative background graphic */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="700" cy="100" r="120" fill="#38bdf8" fillOpacity="0.15" />
          <circle cx="100" cy="500" r="180" fill="#2563eb" fillOpacity="0.10" />
        </svg>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white/90 p-8 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col items-center animate-fade-in"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {/* Logo */}
        <img src="/quantex-logo.png.jpg" alt="Quantex Logo" className="w-20 h-20 mb-4 rounded-full shadow-lg border-4 border-blue-200" />
        <h2 className="text-3xl font-extrabold mb-2 text-blue-700 tracking-tight">Admin Login</h2>
        <p className="mb-6 text-gray-500 text-sm text-center">Welcome back! Please sign in to your admin dashboard.</p>
        <div className="mb-4 w-full">
          <label className="block mb-1 font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="admin@quantex.online"
          />
        </div>
        <div className="mb-4 w-full relative">
          <label className="block mb-1 font-medium text-gray-700">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition pr-10"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="absolute right-2 top-8 text-gray-400 hover:text-blue-500 focus:outline-none"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.875-4.575A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.575-1.125" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.828-2.828A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.21.714-4.254 1.928-5.928M4.222 4.222l15.556 15.556" /></svg>
            )}
          </button>
        </div>
        <div className="mb-4 w-full flex items-center justify-between">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              className="mr-2 accent-blue-600"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <a href="#" className="text-xs text-blue-500 hover:underline">Forgot password?</a>
        </div>
        {error && <div className="text-red-500 mb-2 w-full text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-lg font-semibold shadow-md hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
} 