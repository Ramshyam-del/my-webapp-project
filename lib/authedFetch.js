import { supabase } from './supabase';

// API base URL for direct backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

/**
 * Get Supabase session token
 */
async function getSupabaseToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get Supabase token:', error);
    return null;
  }
}

/**
 * Robust fetch helper with authentication and error handling
 */
export async function authedFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const headers = new Headers(init.headers || {});
  
  // Convert relative URLs to direct backend URLs
  let fullUrl = url;
  if (url.startsWith('/api/') && !url.startsWith('/api/admin')) {
    fullUrl = `${API_BASE_URL}${url}`;
  }
  
  // Set default headers
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // For admin routes, add Supabase token to Authorization header
  if (url.startsWith('/api/admin')) {
    const token = await getSupabaseToken();
    if (!token) {
      console.log('No Supabase session available for admin route');
      const error = new Error('No active session');
      error.code = 'auth';
      error.status = 401;
      throw error;
    }
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(fullUrl, {
      ...init,
      headers,
      credentials: 'include', // Include cookies for authentication
      signal: controller.signal
    });
    
    // Handle auth errors specifically
    if (response.status === 401) {
      // Don't automatically redirect, let the calling code handle it
      const error = new Error('Not authenticated');
      error.code = 'unauthorized';
      error.status = 401;
      throw error;
    }
    
    if (response.status === 403) {
      const error = new Error('Access denied: Not an admin user');
      error.code = 'forbidden';
      error.status = 403;
      throw error;
    }
    
    // Try to parse JSON response
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      
      // For successful responses (200-299), return the JSON as-is
      if (response.ok) {
        return json;
      }
      
      // For error responses, throw an error with consistent shape
      const error = new Error(json.message || json.error || `Request failed (${response.status})`);
      error.code = json.code || 'request_failed';
      error.status = response.status;
      error.payload = json;
      // Ensure consistent error shape for handlers
      if (!error.status) error.status = response.status;
      if (!error.code) error.code = 'request_failed';
      throw error;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      if (!response.ok) {
        const error = new Error(text || `Request failed (${response.status})`);
        error.code = 'non_json_error';
        error.status = response.status;
        error.raw = text;
        throw error;
      }
      
      return { ok: true, data: text };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'timeout';
      timeoutError.status = 408;
      throw timeoutError;
    }
    
    // Re-throw auth errors as-is (they should already have status)
    if (error.code === 'auth' || error.code === 'unauthorized' || error.code === 'forbidden') {
      throw error;
    }
    
    // Wrap other errors
    const wrappedError = new Error(error.message || 'Network error');
    wrappedError.code = error.code || 'network_error';
    wrappedError.status = error.status || 0;
    wrappedError.original = error;
    throw wrappedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convenience wrapper for JSON requests
 */
export async function authedFetchJson(input, init = {}) {
  return authedFetch(input, init);
}

/**
 * Update user data via admin API
 */
export async function updateUserEdit(id, payload) {
  return authedFetchJson(`/api/admin/users/${id}/edit`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}
