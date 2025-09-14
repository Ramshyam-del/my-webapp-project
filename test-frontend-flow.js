require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Initialize Supabase client (same as frontend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Simulate the getSupabaseToken function from frontend
async function getSupabaseToken() {
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
    return null;
  }
  
  console.log('✅ Session found, returning token');
  return session.access_token;
}

// Simulate the authedFetchJson function from frontend
async function authedFetchJson(url, options = {}) {
  console.log('🌐 [authedFetchJson] Starting request to:', url);
  
  // For admin routes, add Supabase token to Authorization header
  if (url.startsWith('/api/admin')) {
    console.log('🔐 [authedFetchJson] Admin route detected, getting token...');
    const token = await getSupabaseToken();
    if (!token) {
      throw new Error('No active session');
    }
    
    if (!options.headers) {
      options.headers = {};
    }
    options.headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ [authedFetchJson] Authorization header set');
  }
  
  // Set default headers
  if (!options.headers) {
    options.headers = {};
  }
  if (!options.headers['Accept']) {
    options.headers['Accept'] = 'application/json';
  }
  if (!options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  
  // Convert to full URL (frontend proxy)
  const fullUrl = `http://localhost:3000${url}`;
  console.log('🔗 [authedFetchJson] Full URL:', fullUrl);
  console.log('📋 [authedFetchJson] Request headers:', options.headers);
  
  const response = await fetch(fullUrl, options);
  console.log('📨 [authedFetchJson] Response received:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });
  
  const result = await response.json();
  console.log('📋 [authedFetchJson] Response data:', result);
  
  return result;
}

// Test the exact frontend flow
async function testFrontendWithdrawalFlow() {
  try {
    console.log('🚀 Testing frontend withdrawal approval flow...');
    
    // Step 1: Sign in as admin (same as frontend)
    console.log('\n1. Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ramshyamgopalhari@gmail.com',
      password: '@Million2026'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Admin signed in successfully');
    
    // Step 2: Get withdrawals list (same as frontend)
    console.log('\n2. Getting withdrawals list...');
    const withdrawalsResponse = await authedFetchJson('/api/admin/withdrawals');
    
    if (!withdrawalsResponse?.ok || !withdrawalsResponse?.data?.items?.length) {
      console.log('❌ No withdrawals found or error:', withdrawalsResponse);
      return;
    }
    
    const withdrawals = withdrawalsResponse.data.items;
    const pendingWithdrawal = withdrawals.find(w => w.status === 'pending');
    
    if (!pendingWithdrawal) {
      console.log('❌ No pending withdrawals found');
      console.log('Available withdrawals:', withdrawals.map(w => ({ id: w.id, status: w.status })));
      return;
    }
    
    console.log('✅ Found pending withdrawal:', pendingWithdrawal.id);
    
    // Step 3: Approve withdrawal (exact same as frontend component)
    console.log('\n3. Approving withdrawal...');
    const approvalResponse = await authedFetchJson(`/api/admin/withdrawals/${pendingWithdrawal.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ admin_note: 'Test approval from frontend flow script' })
    });
    
    console.log('✅ Approval response:', approvalResponse);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('❌ Stack trace:', error.stack);
  }
}

// Run the test
testFrontendWithdrawalFlow();