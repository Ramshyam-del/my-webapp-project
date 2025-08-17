// Frontend Security Utilities

import { safeLocalStorage, safeWindow, getSafeDocument, getSafeLocation } from './safeStorage';

// Input validation functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, message: 'Email is required' };
  if (!emailRegex.test(email)) return { valid: false, message: 'Invalid email format' };
  if (email.length > 254) return { valid: false, message: 'Email is too long' };
  return { valid: true, message: 'Email is valid' };
};

export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (password.length > 128) return { valid: false, message: 'Password is too long' };
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  if (!hasUpperCase) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!hasLowerCase) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!hasNumbers) return { valid: false, message: 'Password must contain at least one number' };
  if (!hasSpecialChar) return { valid: false, message: 'Password must contain at least one special character' };
  
  return { valid: true, message: 'Password is valid' };
};

export const validateAmount = (amount) => {
  if (!amount) return { valid: false, message: 'Amount is required' };
  if (isNaN(amount) || parseFloat(amount) <= 0) return { valid: false, message: 'Amount must be a positive number' };
  if (parseFloat(amount) > 999999999) return { valid: false, message: 'Amount is too large' };
  return { valid: true, message: 'Amount is valid' };
};

// Token management
export const getAuthToken = () => {
  return safeLocalStorage.getItem('token');
};

export const setAuthToken = (token) => {
  safeLocalStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  safeLocalStorage.removeItem('token');
};

export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Secure API call function
export const secureApiCall = async (url, options = {}) => {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'include'
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error codes
      if (response.status === 401) {
        removeAuthToken();
        const location = getSafeLocation();
        if (location) {
          location.href = '/login';
        }
        throw new Error('Authentication required');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// CSRF token management
export const getCSRFToken = () => {
  const document = getSafeDocument();
  if (!document) return null;
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
};

// Rate limiting for frontend
const rateLimitMap = new Map();

export const checkRateLimit = (key, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const attempts = rateLimitMap.get(key) || [];
  
  // Remove old attempts outside the window
  const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return false;
  }
  
  validAttempts.push(now);
  rateLimitMap.set(key, validAttempts);
  
  return true;
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  let score = 0;
  let feedback = [];
  
  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('One uppercase letter');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('One lowercase letter');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('One number');
  
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('One special character');
  
  if (password.length >= 12) score += 1;
  
  let strength = 'weak';
  if (score >= 4) strength = 'medium';
  if (score >= 5) strength = 'strong';
  if (score >= 6) strength = 'very strong';
  
  return {
    score,
    strength,
    feedback: feedback.length > 0 ? feedback : ['Password meets requirements']
  };
};

// Secure storage utilities
export const secureStorage = {
  set: (key, value) => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      safeLocalStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  
  get: (key) => {
    try {
      const encrypted = safeLocalStorage.getItem(key);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    safeLocalStorage.removeItem(key);
  }
};

// Session timeout management
export const sessionManager = {
  timeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000, // 5 minutes
  
  start: () => {
    const document = getSafeDocument();
    if (!document) return;
    
    const token = getAuthToken();
    if (!token) return;
    
    sessionManager.reset();
    
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, sessionManager.reset);
    });
  },
  
  reset: () => {
    const document = getSafeDocument();
    if (!document) return;
    
    clearTimeout(sessionManager.timeoutId);
    clearTimeout(sessionManager.warningId);
    
    sessionManager.timeoutId = setTimeout(() => {
      sessionManager.warn();
    }, sessionManager.timeout - sessionManager.warningTime);
    
    sessionManager.warningId = setTimeout(() => {
      sessionManager.logout();
    }, sessionManager.timeout);
  },
  
  warn: () => {
    const document = getSafeDocument();
    const confirm = document?.confirm;
    if (!confirm) return;
    
    const warning = confirm('Your session will expire in 5 minutes. Do you want to stay logged in?');
    if (warning) {
      sessionManager.reset();
    } else {
      sessionManager.logout();
    }
  },
  
  logout: () => {
    removeAuthToken();
      const location = getSafeLocation();
  if (location) {
    location.href = '/login';
  }
  }
};

export default {
  validateEmail,
  validatePassword,
  validateAmount,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isTokenValid,
  secureApiCall,
  sanitizeInput,
  getCSRFToken,
  checkRateLimit,
  checkPasswordStrength,
  secureStorage,
  sessionManager
}; 