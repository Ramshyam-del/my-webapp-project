// Test script to simulate what the frontend is doing
const { supabase } = require('./lib/supabase');

async function simulateFrontendFetch() {
  console.log('Simulating frontend trade history fetch...');
  
  try {
    // Step 1: Get session (like frontend does)
    console.log('🔍 Step 1: Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError);
      return;
    }
    
    console.log('✅ Session data:', {
      hasSession: !!session,
      hasUser: !!(session && session.user),
      userId: session ? session.user?.id : null,
      hasAccessToken: !!(session && session.access_token),
      accessTokenLength: session ? session.access_token?.length : 0
    });
    
    if (!session || !session.user || !session.access_token) {
      console.log('❌ No valid session, user, or access token');
      return;
    }
    
    // Step 2: Fetch trade history (like frontend does)
    console.log('🔍 Step 2: Fetching trade history...');
    const response = await fetch('http://localhost:3000/api/trading/trade-history?limit=5', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Trade history API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Trade history API response data:', {
        success: data.success,
        count: data.count,
        tradesLength: data.trades?.length || 0
      });
      
      if (data.trades && data.trades.length > 0) {
        console.log('✅ Sample trades:');
        data.trades.slice(0, 2).forEach((trade, index) => {
          console.log(`  ${index + 1}. ID: ${trade.id}`);
          console.log(`     Pair: ${trade.pair}`);
          console.log(`     Type: ${trade.type}`);
          console.log(`     Amount: ${trade.amount}`);
          console.log(`     Result Status: ${trade.resultStatus}`);
          console.log(`     Final PnL: ${trade.finalPnl}`);
          console.log('---');
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Trade history API error response:', errorText);
    }
  } catch (error) {
    console.log('❌ Simulation failed:', error);
  }
}

simulateFrontendFetch();