// Using built-in fetch in Node.js 22

async function testWithdrawalAPI() {
    console.log('Testing Withdrawal API...');
    
    // Test 1: Without authentication
    console.log('\n=== Test 1: Without Authentication ===');
    try {
        const response = await fetch('http://localhost:3000/api/withdrawals/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currency: 'USDT',
                amount: 10,
                wallet_address: '0x1234567890abcdef',
                network: 'ethereum',
                note: 'Test withdrawal'
            })
        });
        
        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    // Test 2: With mock token
    console.log('\n=== Test 2: With Mock Token ===');
    try {
        const response = await fetch('http://localhost:3000/api/withdrawals/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-token-123'
            },
            body: JSON.stringify({
                currency: 'USDT',
                amount: 10,
                wallet_address: '0x1234567890abcdef',
                network: 'ethereum',
                note: 'Test withdrawal with mock token'
            })
        });
        
        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    // Test 3: Check if API endpoint exists
    console.log('\n=== Test 3: Check API Endpoint ===');
    try {
        const response = await fetch('http://localhost:3000/api/withdrawals/create', {
            method: 'GET'
        });
        
        console.log('GET Status:', response.status);
        if (response.status !== 404) {
            const result = await response.text();
            console.log('GET Response:', result);
        }
    } catch (error) {
        console.error('GET Error:', error.message);
    }
}

testWithdrawalAPI().catch(console.error);