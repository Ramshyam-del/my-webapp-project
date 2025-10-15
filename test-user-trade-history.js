// Test script to check if trade-history API is working for a specific user
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function testUserTradeHistory() {
  console.log('Testing trade-history API for specific user...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    // First, let's get a user ID from the users table
    console.log('🔍 Getting user IDs...');
    const { data: users, error: usersError } = await serverSupabase
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Failed to get users:', usersError);
      return;
    }
    
    console.log('✅ Users found:', users);
    
    // Test the trade history query for the first user
    if (users && users.length > 0) {
      const userId = users[0].id;
      console.log('🔍 Testing trade history for user:', userId, users[0].email);
      
      const { data: trades, error: tradesError } = await serverSupabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .or('status.in.(CLOSED,completed,SETTLED,COMPLETED),and(trade_result.in.(win,loss),auto_expired.eq.true)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (tradesError) {
        console.log('❌ Query failed:', tradesError);
        return;
      }
      
      console.log('✅ Query successful for user', userId);
      console.log('✅ Number of trades found:', trades.length);
      if (trades.length > 0) {
        console.log('✅ Sample trade:', {
          id: trades[0].id,
          user_id: trades[0].user_id,
          status: trades[0].status,
          trade_result: trades[0].trade_result,
          auto_expired: trades[0].auto_expired
        });
      }
    }
  } catch (error) {
    console.log('❌ Trade history API test failed:', error);
  }
}

testUserTradeHistory();