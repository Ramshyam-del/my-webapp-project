const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test the frontend proxy for withdrawal approval
async function testWithdrawalApproval() {
  try {
    console.log('Testing withdrawal approval via frontend proxy...');
    
    // First, let's see what withdrawals exist
    const listOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/withdrawals',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    };
    
    const listResponse = await makeRequest(listOptions);
    console.log('List withdrawals status:', listResponse.status);
    console.log('Withdrawals response:', JSON.stringify(listResponse.data, null, 2));
    
    // If we have withdrawals, try to approve the first one
    if (listResponse.data && listResponse.data.data && listResponse.data.data.length > 0) {
      const withdrawalId = listResponse.data.data[0].id;
      console.log(`\nTrying to approve withdrawal ${withdrawalId}...`);
      
      const approveOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/withdrawals/${withdrawalId}/approve`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      };
      
      const postData = JSON.stringify({
        admin_note: 'Test approval from script'
      });
      
      const approveResponse = await makeRequest(approveOptions, postData);
      console.log('Approval response status:', approveResponse.status);
      console.log('Approval response:', JSON.stringify(approveResponse.data, null, 2));
    } else {
      console.log('No withdrawals found to approve');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testWithdrawalApproval();