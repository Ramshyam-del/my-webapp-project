import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed top-6 right-6 z-50 bg-red-500 text-white px-4 py-2 rounded shadow-lg animate-bounceIn">
      {message}
      <button onClick={onClose} className="ml-4 text-white font-bold">&times;</button>
    </div>
  );
}

export const RegisterForm = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /.+@.+\..+/.test(email);

  const handleRegister = async (e) => {
    e.preventDefault();
    setToast('');
    
    if (!validateEmail(form.email)) {
      setToast('Invalid email format.');
      return;
    }
    if (form.password.length < 6) {
      setToast('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setToast('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      // Use Supabase authentication directly
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            role: 'user' // Set default role
          }
        }
      });

      if (error) {
        setToast(error.message || 'Registration failed');
      } else {
        setToast('Registration successful! Please check your email to verify your account.');
        // Clear form
        setForm({ email: '', password: '', confirmPassword: '' });
        // Optionally redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setToast('An error occurred during registration.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      <Toast message={toast} onClose={() => setToast('')} />
      <input
        type="email"
        name="email"
        id="register-email"
        aria-label="Email address"
        placeholder="Enter Email"
        className="w-full bg-gray-800 p-3 rounded"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        id="register-password"
        aria-label="Password"
        placeholder="Enter Password"
        className="w-full bg-gray-800 p-3 rounded"
        value={form.password}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="confirmPassword"
        id="register-confirm-password"
        aria-label="Confirm Password"
        placeholder="Confirm Password"
        className="w-full bg-gray-800 p-3 rounded"
        value={form.confirmPassword}
        onChange={handleChange}
        required
      />
      <button
        type="submit"
        className="w-full py-3 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-600"
        disabled={loading}
      >
        {loading ? 'Registering...' : 'SIGN UP'}
      </button>
    </form>
  );
}; 