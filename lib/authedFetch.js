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
    try {
      const authError = new Error('No active session: ' + (error?.message || 'Session is null'));
      authError.code = 'auth';
      authError.status = 401;
      throw authError;
    } catch (errorConstructorError) {
      console.error('Failed to create auth Error object:', errorConstructorError);
      // Fallback
      const fallbackError = new Error('No active session');
      fallbackError.code = 'auth';
      fallbackError.status = 401;
      throw fallbackError;
    }
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
    try {
      const token = await getSupabaseToken();
      if (!token) {
        const error = new Error('No active session');
        error.code = 'auth';
        error.status = 401;
        throw error;
      }
      headers.set('Authorization', `Bearer ${token}`);
      console.log('✅ [authedFetch] Authorization header set');
    } catch (tokenError) {
      console.error('❌ [authedFetch] Failed to get token:', tokenError);
      throw tokenError;
    }
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
      try {
        const error = new Error('Not authenticated');
        error.code = 'unauthorized';
        error.status = 401;
        // Redirect to login page for unauthenticated requests
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        throw error;
      } catch (errorConstructorError) {
        console.error('Failed to create 401 Error object:', errorConstructorError);
        // Fallback
        const fallbackError = new Error('Not authenticated');
        fallbackError.code = 'unauthorized';
        fallbackError.status = 401;
        throw fallbackError;
      }
    }
    
    if (response.status === 403) {
      try {
        const error = new Error('Access denied: Not an admin user');
        error.code = 'forbidden';
        error.status = 403;
        throw error;
      } catch (errorConstructorError) {
        console.error('Failed to create 403 Error object:', errorConstructorError);
        // Fallback
        const fallbackError = new Error('Access denied: Not an admin user');
        fallbackError.code = 'forbidden';
        fallbackError.status = 403;
        throw fallbackError;
      }
    }
    
    // Handle network errors
    if (!response.ok && response.status >= 500) {
      let errorMessage = 'Server error';
      try {
        // Safely construct the error message
        const statusText = response.statusText || 'Internal Server Error';
        errorMessage = `Server error (${response.status}): ${statusText}`;
      } catch (e) {
        console.error('Error constructing server error message:', e);
        errorMessage = `Server error (${response.status})`;
      }
      
      // Ensure we have a valid string with multiple safety checks
      if (typeof errorMessage !== 'string' || errorMessage.length === 0 || errorMessage === 'undefined' || errorMessage === 'null') {
        errorMessage = 'Server error';
      }
      
      // Final safety check - ensure we can create an Error object
      try {
        const error = new Error(errorMessage);
        error.code = 'server_error';
        error.status = response.status;
        throw error;
      } catch (errorConstructorError) {
        console.error('Failed to create Error object:', errorConstructorError);
        // Fallback to a simple error
        const fallbackError = new Error('Server error (500)');
        fallbackError.code = 'server_error';
        fallbackError.status = response.status;
        throw fallbackError;
      }
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
      let errorMessage = `Request failed (${response.status})`;
      try {
        errorMessage = json.message || json.error || `Request failed (${response.status})`;
      } catch (e) {
        console.error('Error extracting message from JSON response:', e);
        errorMessage = `Request failed (${response.status})`;
      }
      
      // Ensure we have a valid string with multiple safety checks
      if (typeof errorMessage !== 'string' || errorMessage.length === 0 || errorMessage === 'undefined' || errorMessage === 'null') {
        errorMessage = `Request failed (${response.status})`;
      }
      
      // Final safety check - ensure we can create an Error object
      try {
        const error = new Error(errorMessage);
        error.code = json.code || 'request_failed';
        error.status = response.status;
        error.payload = json;
        // Ensure consistent error shape for handlers
        if (!error.status) error.status = response.status;
        if (!error.code) error.code = 'request_failed';
        throw error;
      } catch (errorConstructorError) {
        console.error('Failed to create JSON error Error object:', errorConstructorError);
        // Fallback
        const fallbackError = new Error(`Request failed (${response.status})`);
        fallbackError.code = 'request_failed';
        fallbackError.status = response.status;
        fallbackError.payload = json;
        throw fallbackError;
      }
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;
        try {
          errorMessage = text || `Request failed (${response.status})`;
        } catch (e) {
          console.error('Error processing text response:', e);
          errorMessage = `Request failed (${response.status})`;
        }
        
        // Ensure we have a valid string with multiple safety checks
        if (typeof errorMessage !== 'string' || errorMessage.length === 0 || errorMessage === 'undefined' || errorMessage === 'null') {
          errorMessage = `Request failed (${response.status})`;
        }
        
        // Final safety check - ensure we can create an Error object
        try {
          const error = new Error(errorMessage);
          error.code = 'non_json_error';
          error.status = response.status;
          error.raw = text;
          throw error;
        } catch (errorConstructorError) {
          console.error('Failed to create non-JSON error Error object:', errorConstructorError);
          // Fallback
          const fallbackError = new Error(`Request failed (${response.status})`);
          fallbackError.code = 'non_json_error';
          fallbackError.status = response.status;
          fallbackError.raw = text;
          throw fallbackError;
        }
      }
      
      return { ok: true, data: text };
    }
  } catch (error) {
    if (error && error.name === 'AbortError') {
      let errorMessage = 'Request timeout';
      try {
        errorMessage = 'Request timeout';
      } catch (e) {
        console.error('Error constructing timeout error message:', e);
        errorMessage = 'Request timeout';
      }
      
      // Ensure we have a valid string with multiple safety checks
      if (typeof errorMessage !== 'string' || errorMessage.length === 0 || errorMessage === 'undefined' || errorMessage === 'null') {
        errorMessage = 'Request timeout';
      }
      
      // Final safety check - ensure we can create an Error object
      try {
        const timeoutError = new Error(errorMessage);
        timeoutError.code = 'timeout';
        timeoutError.status = 408;
        throw timeoutError;
      } catch (errorConstructorError) {
        console.error('Failed to create timeout Error object:', errorConstructorError);
        // Fallback
        const fallbackError = new Error('Request timeout');
        fallbackError.code = 'timeout';
        fallbackError.status = 408;
        throw fallbackError;
      }
    }
    
    // Re-throw auth errors as-is (they should already have status)
    if (error && (error.code === 'auth' || error.code === 'unauthorized' || error.code === 'forbidden')) {
      throw error;
    }
    
    // Handle case where error is null or undefined
    if (!error) {
      let errorMessage = 'Unknown network error';
      try {
        errorMessage = 'Unknown network error';
      } catch (e) {
        console.error('Error constructing unknown error message:', e);
        errorMessage = 'Unknown network error';
      }
      
      // Ensure we have a valid string with multiple safety checks
      if (typeof errorMessage !== 'string' || errorMessage.length === 0 || errorMessage === 'undefined' || errorMessage === 'null') {
        errorMessage = 'Unknown network error';
      }
      
      // Final safety check - ensure we can create an Error object
      try {
        const wrappedError = new Error(errorMessage);
        wrappedError.code = 'network_error';
        wrappedError.status = 0;
        throw wrappedError;
      } catch (errorConstructorError) {
        console.error('Failed to create null/undefined error Error object:', errorConstructorError);
        // Fallback - this is our last resort
        const fallbackError = new Error('Network error');
        fallbackError.code = 'network_error';
        fallbackError.status = 0;
        throw fallbackError;
      }
    }
    
    // Wrap other errors with more context
    let errorMessage = 'Network error';
    try {
      if (error && error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error && error.toString && typeof error.toString === 'function') {
        const stringified = error.toString();
        if (typeof stringified === 'string' && stringified.length > 0) {
          errorMessage = stringified;
        }
      }
    } catch (e) {
      console.error('Error processing error message:', e);
      errorMessage = 'Network error';
    }
    
    // Ensure we have a valid error message with multiple safety checks
    if (typeof errorMessage !== 'string' || errorMessage.length === 0 || errorMessage === 'undefined' || errorMessage === 'null') {
      errorMessage = 'Network error';
    }
    
    // Additional safety check to ensure we don't pass invalid values to Error constructor
    if (errorMessage === '[object Object]') {
      try {
        errorMessage = JSON.stringify(error) || 'Network error';
      } catch (stringifyError) {
        errorMessage = 'Network error';
      }
    }
    
    // Final safety check - ensure we can create an Error object
    try {
      const wrappedError = new Error(errorMessage);
      wrappedError.code = (error && error.code && typeof error.code === 'string') ? error.code : 'network_error';
      wrappedError.status = (error && error.status && typeof error.status === 'number') ? error.status : 0;
      wrappedError.original = error;
      wrappedError.url = fullUrl;
      throw wrappedError;
    } catch (errorConstructorError) {
      console.error('Failed to create wrapped Error object:', errorConstructorError);
      // Fallback to a simple error
      const fallbackError = new Error('Network error');
      fallbackError.code = 'network_error';
      fallbackError.status = 0;
      fallbackError.original = error;
      fallbackError.url = fullUrl;
      throw fallbackError;
    }
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