import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

function Toast({ message, type = 'error', onClose }) {
  if (!message) return null;
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`fixed top-6 right-6 z-50 ${bgColor} text-white px-4 py-2 rounded shadow-lg animate-bounceIn`}>
      {message}
      <button onClick={onClose} className="ml-4 text-white font-bold">&times;</button>
    </div>
  );
}

export const RegisterForm = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('error');
  const router = useRouter();
  const { signUp } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /.+@.+\..+/.test(email);

  const handleRegister = async (e) => {
    e.preventDefault();
    setToast('');
    
    if (!form.firstName.trim()) {
      setToast('First name is required.');
      setToastType('error');
      return;
    }
    if (!form.lastName.trim()) {
      setToast('Last name is required.');
      setToastType('error');
      return;
    }
    if (!form.username.trim()) {
      setToast('Username is required.');
      setToastType('error');
      return;
    }
    if (!validateEmail(form.email)) {
      setToast('Invalid email format.');
      setToastType('error');
      return;
    }
    if (form.password.length < 6) {
      setToast('Password must be at least 6 characters.');
      setToastType('error');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setToast('Passwords do not match.');
      setToastType('error');
      return;
    }
    
    setLoading(true);
    try {
      // Use backend API through AuthContext
      const result = await signUp(form.email, form.password, {
        username: form.username,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone
      });

      if (result.success) {
        setToast('Registration successful! Please check your email to verify your account.');
        setToastType('success');
        // Clear form
        setForm({ firstName: '', lastName: '', username: '', phone: '', email: '', password: '', confirmPassword: '' });
        // Optionally redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setToast(result.error?.message || 'Registration failed');
        setToastType('error');
      }
    } catch (err) {
      setToast('An error occurred during registration.');
      setToastType('error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      <Toast message={toast} type={toastType} onClose={() => setToast('')} />
      <input
        type="text"
        name="firstName"
        id="register-firstName"
        aria-label="First Name"
        placeholder="Enter First Name"
        className="w-full bg-gray-800 p-3 rounded text-white"
        value={form.firstName}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="lastName"
        id="register-lastName"
        aria-label="Last Name"
        placeholder="Enter Last Name"
        className="w-full bg-gray-800 p-3 rounded text-white"
        value={form.lastName}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="username"
        id="register-username"
        aria-label="Username"
        placeholder="Enter Username"
        className="w-full bg-gray-800 p-3 rounded text-white"
        value={form.username}
        onChange={handleChange}
        required
      />
      <input
        type="tel"
        name="phone"
        id="register-phone"
        aria-label="Phone Number"
        placeholder="Enter Phone Number (optional)"
        className="w-full bg-gray-800 p-3 rounded text-white"
        value={form.phone}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        id="register-email"
        aria-label="Email address"
        placeholder="Enter Email"
        className="w-full bg-gray-800 p-3 rounded text-white"
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
        className="w-full bg-gray-800 p-3 rounded text-white"
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
        className="w-full bg-gray-800 p-3 rounded text-white"
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