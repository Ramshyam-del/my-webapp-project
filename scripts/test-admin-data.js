#!/usr/bin/env node

// Test admin data endpoints
const BASE_URL = 'http://localhost:4001';

// Polyfill fetch for Node.js
if (typeof globalThis.fetch === 'undefined') {
  try {
    globalThis.fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ node-fetch not available. Install with: npm install node-fetch');
    process.exit(1);
  }
}

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Admin Data Endpoints\n');

  // Test 1: /api/admin/withdrawals without auth
  console.log('1. Testing /api/admin/withdrawals without auth...');
  const withdrawalsNoAuthResult = await testEndpoint(`${BASE_URL}/api/admin/withdrawals`);
  if (withdrawalsNoAuthResult.status === 401 && withdrawalsNoAuthResult.data?.ok === false) {
    console.log('✅ PASS: Returns 401 unauthorized without auth');
  } else {
    console.log('❌ FAIL: Expected 401, got:', withdrawalsNoAuthResult);
  }

  // Test 2: /api/admin/trades without auth
  console.log('\n2. Testing /api/admin/trades without auth...');
  const tradesNoAuthResult = await testEndpoint(`${BASE_URL}/api/admin/trades`);
  if (tradesNoAuthResult.status === 401 && tradesNoAuthResult.data?.ok === false) {
    console.log('✅ PASS: Returns 401 unauthorized without auth');
  } else {
    console.log('❌ FAIL: Expected 401, got:', tradesNoAuthResult);
  }

  // Test 3: /api/admin/withdrawals with invalid token
  console.log('\n3. Testing /api/admin/withdrawals with invalid token...');
  const withdrawalsInvalidTokenResult = await testEndpoint(`${BASE_URL}/api/admin/withdrawals`, {
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  if (withdrawalsInvalidTokenResult.status === 401 && withdrawalsInvalidTokenResult.data?.ok === false) {
    console.log('✅ PASS: Returns 401 unauthorized with invalid token');
  } else {
    console.log('❌ FAIL: Expected 401, got:', withdrawalsInvalidTokenResult);
  }

  // Test 4: /api/admin/trades with invalid token
  console.log('\n4. Testing /api/admin/trades with invalid token...');
  const tradesInvalidTokenResult = await testEndpoint(`${BASE_URL}/api/admin/trades`, {
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  if (tradesInvalidTokenResult.status === 401 && tradesInvalidTokenResult.data?.ok === false) {
    console.log('✅ PASS: Returns 401 unauthorized with invalid token');
  } else {
    console.log('❌ FAIL: Expected 401, got:', tradesInvalidTokenResult);
  }

  // Test 5: /api/admin/withdrawals with valid admin token (if provided)
  const validToken = process.argv[2];
  if (validToken) {
    console.log('\n5. Testing /api/admin/withdrawals with valid admin token...');
    const withdrawalsValidTokenResult = await testEndpoint(`${BASE_URL}/api/admin/withdrawals`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    if (withdrawalsValidTokenResult.data?.ok && Array.isArray(withdrawalsValidTokenResult.data?.data?.items)) {
      console.log('✅ PASS: Returns valid response with empty array');
      console.log(`   Items: ${withdrawalsValidTokenResult.data.data.items.length}`);
    } else {
      console.log('❌ FAIL: Expected valid response with items array, got:', withdrawalsValidTokenResult);
    }

    // Test 6: /api/admin/trades with valid admin token
    console.log('\n6. Testing /api/admin/trades with valid admin token...');
    const tradesValidTokenResult = await testEndpoint(`${BASE_URL}/api/admin/trades`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    if (tradesValidTokenResult.data?.ok && Array.isArray(tradesValidTokenResult.data?.data?.items)) {
      console.log('✅ PASS: Returns valid response with empty array');
      console.log(`   Items: ${tradesValidTokenResult.data.data.items.length}`);
    } else {
      console.log('❌ FAIL: Expected valid response with items array, got:', tradesValidTokenResult);
    }
  } else {
    console.log('\n5-6. Skipping valid token tests (no token provided)');
    console.log('   To test with valid token: node scripts/test-admin-data.js <your-jwt-token>');
  }

  console.log('\n🎉 Admin data tests completed!');
  console.log('\n📝 Note: These endpoints should return empty arrays when tables are missing');
  console.log('   rather than throwing 500 errors.');
}

runTests().catch(console.error);
