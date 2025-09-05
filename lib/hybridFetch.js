import { supabase } from './supabase';

// API base URL for direct backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

/**
 * Hybrid authentication fetch utility
 * Tries JWT cookies first, falls back to Supabase tokens
 */
export async function hybridFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const headers = new Headers(init.headers || {});
  
  // Convert relative URLs to direct backend URLs
  let fullUrl = url;
  if (url.startsWith('/api/')) {
    fullUrl = `${API_BASE_URL}${url}`;
  }
  
  // Set default headers
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // First attempt: Try with JWT cookies
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [HybridFetch] Attempting with JWT cookies:', fullUrl);
    }
    let response = await fetch(fullUrl, {
      ...init,
      headers,
      credentials: 'include', // Include cookies for JWT authentication
      signal: controller.signal
    });
    
    // If JWT cookies work, return the response
    if (response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [HybridFetch] JWT cookies successful');
      }
      return await handleResponse(response);
    }
    
    // If we get 401 with JWT cookies, try Supabase tokens as fallback
    if (response.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [HybridFetch] JWT failed, trying Supabase fallback');
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.access_token) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [HybridFetch] Using Supabase token');
          }
          
          // Add Supabase authorization header
          const supabaseHeaders = new Headers(headers);
          supabaseHeaders.set('Authorization', `Bearer ${session.access_token}`);
          
          // Retry with Supabase token
          response = await fetch(fullUrl, {
            ...init,
            headers: supabaseHeaders,
            credentials: 'include',
            signal: controller.signal
          });
          
          if (response.ok) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [HybridFetch] Supabase token successful');
            }
            return await handleResponse(response);
          }
        }
      } catch (supabaseError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [HybridFetch] Supabase fallback failed:', supabaseError);
        }
      }
    }
    
    // Handle other HTTP errors
    if (response.status === 403) {
      const error = new Error('Access denied');
      error.code = 'forbidden';
      error.status = 403;
      throw error;
    }
    
    // Handle authentication failure
    if (response.status === 401) {
      const error = new Error('Authentication required');
      error.code = 'unauthorized';
      error.status = 401;
      throw error;
    }
    
    // Handle other errors
    return await handleResponse(response);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'timeout';
      timeoutError.status = 408;
      throw timeoutError;
    }
    
    // Re-throw known errors
    if (error.code) {
      throw error;
    }
    
    // Wrap unknown errors
    const wrappedError = new Error(error.message || 'Network error');
    wrappedError.code = 'network_error';
    wrappedError.status = 0;
    wrappedError.original = error;
    throw wrappedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Handle response parsing with consistent error handling
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    const json = await response.json();
    
    // For successful responses, return the response object with json data
    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        json: () => Promise.resolve(json),
        data: json
      };
    }
    
    // For error responses, throw an error
    const error = new Error(json.message || json.error || `Request failed (${response.status})`);
    error.code = json.code || 'request_failed';
    error.status = response.status;
    error.payload = json;
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
    
    return {
      ok: true,
      status: response.status,
      text: () => Promise.resolve(text),
      data: text
    };
  }
}

/**
 * Convenience wrapper for JSON requests
 */
export async function hybridFetchJson(input, init = {}) {
  const response = await hybridFetch(input, init);
  return response.data;
}

/**
 * Check authentication status using hybrid approach
 */
export async function checkHybridAuth() {
  try {
    const response = await hybridFetch('/api/auth/me');
    return response.data && response.data.ok && response.data.user;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Hybrid auth check failed:', error);
    }
    return false;
  }
}