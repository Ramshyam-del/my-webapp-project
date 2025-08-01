import { useState } from 'react';
import { useRouter } from 'next/router';

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
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp' | 'reset' | 'done'
  const [forgotForm, setForgotForm] = useState({ email: '', otp: '', newPassword: '' });
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setToast('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast('Login successful!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', email);
        router.push('/exchange');
      } else {
        setError(data.message || 'Login failed');
        setToast(data.message || 'Login failed');
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
        const res = await fetch('http://localhost:4001/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotForm.email }),
        });
        const data = await res.json();
        if (res.ok) {
          setToast('OTP sent to your email.');
          setForgotStep('otp');
        } else {
          setError(data.message || 'Failed to send OTP');
        }
      } else if (forgotStep === 'otp') {
        if (!forgotForm.otp || forgotForm.otp.length !== 6) {
          setError('Enter the 6-digit OTP sent to your email.');
          setLoading(false);
          return;
        }
        setForgotStep('reset');
      } else if (forgotStep === 'reset') {
        if (forgotForm.newPassword.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const res = await fetch('http://localhost:4001/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: forgotForm.email,
            otp: forgotForm.otp,
            newPassword: forgotForm.newPassword,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setToast('Password reset successful! You can now log in.');
          setForgotStep('done');
        } else {
          setError(data.message || 'Failed to reset password');
        }
      }
    } catch (err) {
      setError('An error occurred.');
    }
    setLoading(false);
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
          {forgotStep === 'otp' && (
            <div>
              <label className="text-sm" htmlFor="forgot-otp">Enter OTP sent to your email</label>
              <input
                id="forgot-otp"
                type="text"
                name="otp"
                className="w-full bg-gray-800 text-white p-3 mt-1 rounded focus:outline-none text-center tracking-widest text-lg"
                placeholder="Enter OTP"
                value={forgotForm.otp}
                onChange={handleForgotChange}
                required
                maxLength={6}
              />
            </div>
          )}
          {forgotStep === 'reset' && (
            <div>
              <label className="text-sm" htmlFor="forgot-new-password">Enter new password</label>
              <input
                id="forgot-new-password"
                type="password"
                name="newPassword"
                className="w-full bg-gray-800 text-white p-3 mt-1 rounded focus:outline-none"
                placeholder="Enter new password"
                value={forgotForm.newPassword}
                onChange={handleForgotChange}
                required
              />
            </div>
          )}
          {forgotStep === 'done' && (
            <div className="text-green-500 text-center font-bold">Password reset successful! You can now log in.</div>
          )}
          {error && <div className="text-red-500 text-sm" role="alert">{error}</div>}
          {forgotStep !== 'done' && (
            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-600"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Processing...' : forgotStep === 'email' ? 'Send OTP' : forgotStep === 'otp' ? 'Verify OTP' : 'Reset Password'}
            </button>
          )}
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-cyan-400 hover:underline text-sm"
              onClick={() => { setShowForgot(false); setForgotStep('email'); setForgotForm({ email: '', otp: '', newPassword: '' }); setError(''); }}
            >
              Back to login
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 