#!/usr/bin/env node

// Test admin authentication endpoints
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
  console.log('🧪 Testing Admin Authentication Endpoints\n');

  // Test 1: Health endpoint
  console.log('1. Testing /api/admin/health...');
  const healthResult = await testEndpoint(`${BASE_URL}/api/admin/health`);
  if (healthResult.data?.ok) {
    console.log('✅ PASS: Health endpoint returns ok: true');
  } else {
    console.log('❌ FAIL: Health endpoint failed:', healthResult);
  }

  // Test 2: /api/admin/me without token
  console.log('\n2. Testing /api/admin/me without token...');
  const meNoTokenResult = await testEndpoint(`${BASE_URL}/api/admin/me`);
  if (meNoTokenResult.status === 401 && meNoTokenResult.data?.ok === false) {
    console.log('✅ PASS: Returns 401 unauthorized without token');
  } else {
    console.log('❌ FAIL: Expected 401, got:', meNoTokenResult);
  }

  // Test 3: /api/admin/me with invalid token
  console.log('\n3. Testing /api/admin/me with invalid token...');
  const meInvalidTokenResult = await testEndpoint(`${BASE_URL}/api/admin/me`, {
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  if (meInvalidTokenResult.status === 401 && meInvalidTokenResult.data?.ok === false) {
    console.log('✅ PASS: Returns 401 unauthorized with invalid token');
  } else {
    console.log('❌ FAIL: Expected 401, got:', meInvalidTokenResult);
  }

  // Test 4: /api/admin/me with valid token (if provided)
  const validToken = process.argv[2];
  if (validToken) {
    console.log('\n4. Testing /api/admin/me with valid token...');
    const meValidTokenResult = await testEndpoint(`${BASE_URL}/api/admin/me`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    if (meValidTokenResult.data?.ok && meValidTokenResult.data?.user?.role === 'admin') {
      console.log('✅ PASS: Returns admin user info with valid token');
    } else {
      console.log('❌ FAIL: Expected admin user, got:', meValidTokenResult);
    }
  } else {
    console.log('\n4. Skipping valid token test (no token provided)');
    console.log('   To test with valid token: node scripts/test-admin-auth.js <your-jwt-token>');
  }

  console.log('\n🎉 Admin authentication tests completed!');
}

runTests().catch(console.error);
