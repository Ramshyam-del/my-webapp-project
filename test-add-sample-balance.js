require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use the service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addSampleBalances() {
  try {
    console.log('🔍 Connecting to Supabase...');
    console.log('URL:', supabaseUrl);
    console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
    
    // Get the first user from the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const userId = users[0].id;
    console.log('✅ Found user:', users[0].email, 'ID:', userId);
    
    // Check existing portfolio data
    const { data: existingPortfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);
    
    if (portfolioError) {
      console.error('❌ Error fetching portfolios:', portfolioError);
      return;
    }
    
    console.log('📊 Existing portfolios:', existingPortfolios);
    
    // Sample balances to add
    const sampleBalances = [
      { currency: 'BTC', balance: 0.006 }, // 0.001 locked + 0.005 available
      { currency: 'ETH', balance: 0.6 },   // 0.1 locked + 0.5 available
      { currency: 'USDT', balance: 600 },  // 100 locked + 500 available
      { currency: 'USD', balance: 1000 }   // Changed TRX to USD as per schema
    ];
    
    for (const balance of sampleBalances) {
      const existing = existingPortfolios?.find(p => p.currency === balance.currency);
      
      if (existing) {
        console.log(`⚠️  ${balance.currency} already exists with balance: ${existing.balance}`);
        continue;
      }
      
      console.log(`Adding ${balance.currency} balance...`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          currency: balance.currency,
          balance: balance.balance
        });
      
      if (insertError) {
        console.error(`Error adding ${balance.currency} balance:`, insertError);
      } else {
        console.log(`✅ Successfully added ${balance.currency} balance:`, insertData);
      }
    }
    
    console.log('🎉 Sample balance setup complete!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

addSampleBalances();