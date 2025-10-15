const fetch = require('node-fetch');

async function testTradeEndpoint() {
  try {
    console.log('Testing trade outcome endpoint...');
    
    const response = await fetch('http://localhost:4001/api/admin/trade-outcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tradeId: 'test-id',
        outcome: 'win'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTradeEndpoint();