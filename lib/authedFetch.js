import { supabase } from './supabase';

// API base URL for direct backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

/**
 * Get Supabase session token
 */
export async function getSupabaseToken() {
  console.log('🔍 Getting Supabase session...');
  const { data: { session }, error } = await supabase.auth.getSession();
  
  console.log('📋 Session data:', { 
    hasSession: !!session, 
    hasUser: !!session?.user, 
    userEmail: session?.user?.email,
    tokenLength: session?.access_token?.length,
    error: error?.message 
  });
  
  if (error || !session) {
    console.error('❌ No active session:', error?.message || 'Session is null');
    const authError = new Error('No active session: ' + (error?.message || 'Session is null'));
    authError.code = 'auth';
    authError.status = 401;
    throw authError;
  }
  
  console.log('✅ Session found, returning token');
  return session.access_token;
}

/**
 * Robust fetch helper with authentication and error handling
 */
export async function authedFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  console.log('🌐 [authedFetch] Starting request to:', url);
  const headers = new Headers(init.headers || {});
  
  // Convert relative URLs to direct backend URLs (but keep admin routes on Next.js server)
  let fullUrl = url;
  if (url.startsWith('/api/') && !url.startsWith('/api/admin')) {
    fullUrl = `${API_BASE_URL}${url}`;
    console.log('🔗 [authedFetch] Converted to full URL:', fullUrl);
  } else {
    console.log('🔗 [authedFetch] Keeping URL on Next.js server:', fullUrl);
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
    console.log('🔐 [authedFetch] Admin route detected, getting token...');
    const token = await getSupabaseToken();
    if (!token) {
      const error = new Error('No active session');
      error.code = 'auth';
      error.status = 401;
      throw error;
    }
    headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ [authedFetch] Authorization header set');
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    console.log('📡 [authedFetch] Making fetch request to:', fullUrl);
    console.log('📋 [authedFetch] Request headers:', Object.fromEntries(headers.entries()));
    const response = await fetch(fullUrl, {
      ...init,
      headers,
      credentials: 'include', // Include cookies for authentication
      signal: controller.signal
    });
    console.log('📨 [authedFetch] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    // Handle auth errors specifically
    if (response.status === 401) {
      const error = new Error('Not authenticated');
      error.code = 'unauthorized';
      error.status = 401;
      // Redirect to login page for unauthenticated requests
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
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
  // authedFetch already returns parsed JSON for successful responses
  return await authedFetch(input, init);
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
