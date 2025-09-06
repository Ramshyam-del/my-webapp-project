import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { hybridFetch } from '../lib/hybridFetch';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

function AuthModal({ isOpen, onClose, mode: initialMode = 'login' }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('email');
  const [forgotForm, setForgotForm] = useState({
    email: '',
    otp: '',
    newPassword: '',
    resetToken: ''
  });

  const { signIn } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleForgotInputChange = (e) => {
    const { name, value } = e.target;
    setForgotForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!validatePassword(formData.password)) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (mode === 'register') {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          throw new Error('First name and last name are required');
        }
        if (!formData.username.trim()) {
          throw new Error('Username is required');
        }
        if (!validatePhone(formData.phone)) {
          throw new Error('Please enter a valid phone number');
        }
      }

      if (mode === 'login') {
        // Use AuthContext signIn function for login
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          setSuccess('Login successful! Redirecting...');
          onClose();
          // Give authentication state time to settle before redirecting
          setTimeout(async () => {
            console.log('AuthModal: Redirecting to exchange after login');
            await router.push('/exchange');
          }, 500);
        } else {
          throw new Error(result.error?.message || 'Login failed');
        }
      } else {
        // Handle registration with direct API call
        const endpoint = '/api/auth/register';
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        setSuccess('Registration successful! Please log in.');
        setTimeout(() => {
          setMode('login');
          setFormData({
            email: formData.email,
            password: '',
            firstName: '',
            lastName: '',
            username: '',
            phone: ''
          });
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (forgotStep === 'email') {
        if (!validateEmail(forgotForm.email)) {
          throw new Error('Please enter a valid email address');
        }

        const response = await hybridFetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: forgotForm.email }),
        });

        if (!response.data || !response.data.ok) {
          throw new Error(response.data?.message || 'Failed to send reset email');
        }

        setSuccess('Reset code sent to your email!');
        setForgotStep('otp');
      } else if (forgotStep === 'otp') {
        if (!forgotForm.otp.trim()) {
          throw new Error('Please enter the verification code');
        }

        const response = await hybridFetch('/api/auth/verify-reset-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: forgotForm.email, 
            otp: forgotForm.otp 
          }),
        });

        if (!response.data || !response.data.ok) {
          throw new Error(response.data?.message || 'Invalid verification code');
        }

        setForgotForm(prev => ({ ...prev, resetToken: response.data.resetToken }));
        setSuccess('Code verified! Enter your new password.');
        setForgotStep('newPassword');
      } else if (forgotStep === 'newPassword') {
        if (!validatePassword(forgotForm.newPassword)) {
          throw new Error('Password must be at least 6 characters long');
        }

        const response = await hybridFetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            resetToken: forgotForm.resetToken,
            newPassword: forgotForm.newPassword 
          }),
        });

        if (!response.data || !response.data.ok) {
          throw new Error(response.data?.message || 'Failed to reset password');
        }

        setSuccess('Password reset successful! You can now log in.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotStep('email');
          setForgotForm({ email: '', otp: '', newPassword: '', resetToken: '' });
          setMode('login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {showForgotPassword ? 'Reset Password' : (mode === 'login' ? 'Log In' : 'Create Account')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded text-green-200 text-sm">
            {success}
          </div>
        )}

        {showForgotPassword ? (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotStep('email');
                  setForgotForm({ email: '', otp: '', newPassword: '', resetToken: '' });
                  setError('');
                  setSuccess('');
                }}
                className="text-gray-400 hover:text-white transition-colors mr-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-white">
                {forgotStep === 'email' && 'Reset Password'}
                {forgotStep === 'otp' && 'Enter Verification Code'}
                {forgotStep === 'newPassword' && 'Set New Password'}
              </h3>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              {forgotStep === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={forgotForm.email}
                    onChange={handleForgotInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              )}

              {forgotStep === 'otp' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={forgotForm.otp}
                    onChange={handleForgotInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Check your email for the verification code
                  </p>
                </div>
              )}

              {forgotStep === 'newPassword' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={forgotForm.newPassword}
                    onChange={handleForgotInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : (
                  forgotStep === 'email' ? 'Send Reset Code' :
                  forgotStep === 'otp' ? 'Verify Code' :
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>

            {mode === 'login' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>
        )}

        {!showForgotPassword && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Log in"
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;