// Test script to check if trade history API is accessible
async function testTradeHistoryAPI() {
  console.log('Testing trade history API access...');
  
  try {
    // First, we need to get a valid session token
    // For this test, let's just try to access the API without authentication
    // to see if there are any CORS or network issues
    
    console.log('🔍 Testing API access without auth...');
    const response = await fetch('http://localhost:4001/api/trading/trade-history?limit=5');
    
    console.log('✅ API response status:', response.status);
    console.log('✅ API response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API response data:', data);
    } else {
      const text = await response.text();
      console.log('❌ API error response:', text);
    }
  } catch (error) {
    console.log('❌ API access failed:', error.message);
  }
}

testTradeHistoryAPI();