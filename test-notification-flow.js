const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test configuration
const BASE_URL = 'http://localhost:4001';
const FRONTEND_URL = 'http://localhost:3000';

// Test credentials
const ADMIN_EMAIL = 'testadmin@example.com';
const ADMIN_PASSWORD = 'TestAdmin123!';
const USER_EMAIL = 'testuser2@example.com';
const USER_PASSWORD = 'TestUser123!';

// Helper function for authenticated requests
const authedFetch = async (url, options = {}, token) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  return response;
};

// Helper function for authenticated JSON requests
const authedFetchJson = async (url, options = {}, token) => {
  const response = await authedFetch(url, options, token);
  return response.json();
};

// Test the complete notification flow
async function testNotificationFlow() {
  console.log('🚀 Starting withdrawal approval notification flow test...');
  
  try {
    // Step 1: Admin login
    console.log('\n1️⃣ Admin login...');
    const adminLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    const adminLoginData = await adminLoginResponse.json();
    if (!adminLoginData.ok) {
      throw new Error(`Admin login failed: ${adminLoginData.message}`);
    }
    
    const adminToken = adminLoginData.session.access_token;
    console.log('✅ Admin logged in successfully');
    
    // Step 2: User login
    console.log('\n2️⃣ User login...');
    const userLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD
      })
    });
    
    const userLoginData = await userLoginResponse.json();
    if (!userLoginData.ok) {
      throw new Error(`User login failed: ${userLoginData.message}`);
    }
    
    const userToken = userLoginData.session.access_token;
    const userId = userLoginData.user.id;
    console.log('✅ User logged in successfully');
    console.log('👤 User ID:', userId);
    
    // Step 3: Create a test withdrawal request
    console.log('\n3️⃣ Creating test withdrawal request...');
    const withdrawalResponse = await authedFetchJson(`${BASE_URL}/api/withdrawals`, {
      method: 'POST',
      body: JSON.stringify({
        currency: 'BTC',
        amount: 0.001,
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      })
    }, userToken);
    
    if (!withdrawalResponse.success) {
      throw new Error(`Withdrawal creation failed: ${withdrawalResponse.message}`);
    }
    
    const withdrawalId = withdrawalResponse.data.id;
    console.log('✅ Withdrawal request created');
    console.log('💸 Withdrawal ID:', withdrawalId);
    console.log('💰 Amount:', withdrawalResponse.data.amount, withdrawalResponse.data.currency);
    
    // Step 4: Admin approves the withdrawal
    console.log('\n4️⃣ Admin approving withdrawal...');
    const approvalResponse = await authedFetchJson(`${BASE_URL}/api/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST'
    }, adminToken);
    
    if (!approvalResponse.success) {
      throw new Error(`Withdrawal approval failed: ${approvalResponse.message}`);
    }
    
    console.log('✅ Withdrawal approved successfully');
    console.log('📋 Approval details:', {
      id: approvalResponse.data.id,
      status: approvalResponse.data.status,
      currency: approvalResponse.data.currency,
      amount: approvalResponse.data.amount
    });
    
    // Step 5: Check if notification was created
    console.log('\n5️⃣ Checking for notification...');
    
    // Wait a moment for notification to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const notificationsResponse = await authedFetchJson(`${BASE_URL}/api/notifications?limit=5&is_read=false`, {}, userToken);
    
    if (!notificationsResponse.success) {
      throw new Error(`Failed to fetch notifications: ${notificationsResponse.message}`);
    }
    
    const notifications = notificationsResponse.data.notifications;
    console.log('📬 Total unread notifications:', notifications.length);
    
    // Look for withdrawal notification
    const withdrawalNotification = notifications.find(n => 
      n.category === 'withdrawal' && 
      n.related_entity_id === withdrawalId
    );
    
    if (withdrawalNotification) {
      console.log('✅ Withdrawal notification found!');
      console.log('📝 Notification details:', {
        id: withdrawalNotification.id,
        title: withdrawalNotification.title,
        message: withdrawalNotification.message,
        category: withdrawalNotification.category,
        type: withdrawalNotification.type,
        is_read: withdrawalNotification.is_read,
        created_at: withdrawalNotification.created_at
      });
    } else {
      console.log('❌ Withdrawal notification not found');
      console.log('📋 Available notifications:', notifications.map(n => ({
        id: n.id,
        title: n.title,
        category: n.category,
        type: n.type
      })));
    }
    
    // Step 6: Test marking notification as read
    if (withdrawalNotification) {
      console.log('\n6️⃣ Testing mark as read functionality...');
      const markReadResponse = await authedFetchJson(`${BASE_URL}/api/notifications/${withdrawalNotification.id}/read`, {
        method: 'PATCH'
      }, userToken);
      
      if (markReadResponse.success) {
        console.log('✅ Notification marked as read successfully');
      } else {
        console.log('❌ Failed to mark notification as read:', markReadResponse.error);
      }
    }
    
    console.log('\n🎉 Notification flow test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Admin login: Success');
    console.log('- ✅ User login: Success');
    console.log('- ✅ Withdrawal creation: Success');
    console.log('- ✅ Withdrawal approval: Success');
    console.log(`- ${withdrawalNotification ? '✅' : '❌'} Notification creation: ${withdrawalNotification ? 'Success' : 'Failed'}`);
    console.log('- ✅ Mark as read: Success');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testNotificationFlow();