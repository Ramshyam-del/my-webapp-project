// Test script to verify frontend APIs are working
const axios = require('axios');

async function testFrontendAPIs() {
  console.log('🔍 Testing frontend APIs...');
  
  try {
    // Test the trade history API (this would normally be called with an auth token)
    console.log('\n--- Testing trade history API ---');
    try {
      const historyResponse = await axios.get('http://localhost:3000/api/trading/trade-history?limit=5');
      console.log('❌ Trade history API should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Trade history API correctly requires authentication');
      } else {
        console.log('❌ Trade history API error:', error.message);
      }
    }
    
    // Test the active trades API (this would normally be called with an auth token)
    console.log('\n--- Testing active trades API ---');
    try {
      const activeResponse = await axios.get('http://localhost:3000/api/trading/active-trades');
      console.log('❌ Active trades API should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Active trades API correctly requires authentication');
      } else {
        console.log('❌ Active trades API error:', error.message);
      }
    }
    
    console.log('\n✅ API tests completed');
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testFrontendAPIs();