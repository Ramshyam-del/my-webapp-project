// Test script to create a test trade
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function createTestTrade() {
  console.log('Creating test trade...');
  
  if (!serverSupabase) {
    console.log('❌ Supabase not configured');
    return;
  }
  
  try {
    const now = new Date();
    const expiry = new Date(now.getTime() + 60000); // 1 minute from now
    
    const testTrade = {
      user_id: '1b26c5eb-f775-45ae-9178-62297341ee0f', // Test user ID
      user_name: 'testuser@example.com',
      currency: 'USDT',
      pair: 'BTCUSDT',
      currency_pair: 'BTCUSDT', // Add this field
      leverage: 1,
      duration: '1m',
      amount: 10,
      start_ts: now.toISOString(),
      expiry_ts: expiry.toISOString(),
      entry_price: 43250.75,
      side: 'buy',
      trade_type: 'BUY UP',
      duration_seconds: 60,
      status: 'OPEN',
      trade_result: 'pending',
      admin_action: 'pending',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    console.log('🔍 Creating test trade:', testTrade);
    
    const { data, error } = await serverSupabase
      .from('trades')
      .insert(testTrade)
      .select('*');
    
    if (error) {
      console.log('❌ Failed to create test trade:', error);
      return;
    }
    
    console.log('✅ Test trade created successfully:', data[0].id);
    console.log('✅ Trade will expire at:', expiry.toISOString());
  } catch (error) {
    console.log('❌ Failed to create test trade:', error);
  }
}

createTestTrade();