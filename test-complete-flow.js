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
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
};

// Helper function for authenticated JSON requests
const authedFetchJson = async (url, options = {}, token) => {
  const response = await authedFetch(url, options, token);
  return response.json();
};

// Test the complete notification flow
async function testCompleteNotificationFlow() {
  console.log('🔔 Testing complete notification flow...');
  
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
    const adminUserId = adminLoginData.user.id;
    console.log('✅ Admin logged in successfully');
    
    // Step 2: Check for pending withdrawals
    console.log('\n2️⃣ Checking for pending withdrawals...');
    const withdrawalsResponse = await authedFetch(`${BASE_URL}/api/admin/withdrawals?status=pending`, {}, adminToken);
    const withdrawalsData = await withdrawalsResponse.json();
    
    if (withdrawalsResponse.ok && withdrawalsData.withdrawals && withdrawalsData.withdrawals.length > 0) {
      const pendingWithdrawal = withdrawalsData.withdrawals[0];
      console.log(`✅ Found pending withdrawal: ${pendingWithdrawal.id} for ${pendingWithdrawal.amount} ${pendingWithdrawal.currency}`);
      
      // Step 3: Approve the withdrawal
      console.log('\n3️⃣ Approving withdrawal...');
      const approvalResponse = await authedFetch(
        `${BASE_URL}/api/admin/withdrawals/${pendingWithdrawal.id}/approve`,
        { method: 'POST' },
        adminToken
      );
      
      const approvalData = await approvalResponse.json();
      if (approvalResponse.ok && approvalData.success) {
        console.log('✅ Withdrawal approved successfully');
        console.log('📧 Notification should have been created for the user');
        
        // Step 4: Check if notification was created
        console.log('\n4️⃣ Checking if notification was created...');
        
        // Wait a moment for the notification to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get user token to check their notifications
        const userLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: USER_EMAIL,
            password: USER_PASSWORD
          })
        });
        
        const userLoginData = await userLoginResponse.json();
        if (userLoginData.ok) {
          const userToken = userLoginData.session.access_token;
          
          // Check user's notifications via Next.js API
          const notificationsResponse = await fetch(`${FRONTEND_URL}/api/notifications`, {
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          });
          
          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            console.log('✅ Successfully fetched user notifications');
            console.log(`📊 User has ${notificationsData.data?.notifications?.length || 0} notifications`);
            console.log(`🔔 Unread count: ${notificationsData.data?.unreadCount || 0}`);
            
            // Look for withdrawal-related notifications
            const withdrawalNotifications = notificationsData.data?.notifications?.filter(
              n => n.category === 'withdrawal' || n.title?.toLowerCase().includes('withdrawal')
            ) || [];
            
            if (withdrawalNotifications.length > 0) {
              console.log('🎉 Found withdrawal notification(s):');
              withdrawalNotifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.title} - ${notif.message}`);
              });
            } else {
              console.log('⚠️ No withdrawal notifications found');
            }
          } else {
            console.log('❌ Failed to fetch user notifications');
          }
        } else {
          console.log('⚠️ Could not login as user to check notifications');
        }
      } else {
        console.log('❌ Failed to approve withdrawal:', approvalData.message);
      }
    } else {
      console.log('ℹ️ No pending withdrawals found to test with');
      console.log('💡 Create a withdrawal request first to test the complete flow');
    }
    
    // Step 5: Summary
    console.log('\n✅ Complete notification flow test finished!');
    console.log('\n🎯 To test the complete flow:');
    console.log('   1. Visit http://localhost:3000/withdraw to create a withdrawal');
    console.log('   2. Login as admin and approve the withdrawal');
    console.log('   3. Check notifications on http://localhost:3000/exchange');
    console.log('   4. Notifications should update in real-time');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testCompleteNotificationFlow();