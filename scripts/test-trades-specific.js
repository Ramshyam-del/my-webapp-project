#!/usr/bin/env node

// Test trades endpoint specifically
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

async function testTradesEndpoint() {
  console.log('🧪 Testing Trades Endpoint Specifically\n');

  try {
    // Test without auth
    console.log('1. Testing /api/admin/trades without auth...');
    const response = await fetch(`${BASE_URL}/api/admin/trades`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401 && data.ok === false) {
      console.log('✅ PASS: Correctly returns 401 for unauthorized access');
    } else {
      console.log('❌ FAIL: Expected 401, got:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTradesEndpoint().catch(console.error);
