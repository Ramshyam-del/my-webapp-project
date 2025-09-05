require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function findUserAndBalance() {
  try {
    console.log('🔍 Looking for user: mohanpoudel@gmail.com');
    
    // Find user by email
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at, status, role')
      .eq('email', 'mohanpoudel@gmail.com');
    
    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ User not found in users table');
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
      created_at: user.created_at
    });
    
    // Check portfolio balances for this user
    const { data: portfolios, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id);
    
    if (portfolioError) {
      console.error('❌ Error fetching portfolios:', portfolioError);
      return;
    }
    
    console.log('💰 Portfolio balances:');
    if (!portfolios || portfolios.length === 0) {
      console.log('   No portfolio records found');
    } else {
      portfolios.forEach(p => {
        console.log(`   ${p.currency}: ${p.balance} (updated: ${p.updated_at})`);
      });
      
      const totalBalance = portfolios.reduce((sum, p) => sum + Number(p.balance), 0);
      console.log(`   Total Balance: $${totalBalance}`);
    }
    
    // Also check with the hardcoded user ID we've been using
    console.log('\n🔍 Checking hardcoded user ID: 1b26c5eb-f775-45ae-9178-62297341ee0f');
    const { data: hardcodedPortfolios, error: hardcodedError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', '1b26c5eb-f775-45ae-9178-62297341ee0f');
    
    if (hardcodedError) {
      console.error('❌ Error fetching hardcoded user portfolios:', hardcodedError);
    } else {
      console.log('💰 Hardcoded user portfolio balances:');
      if (!hardcodedPortfolios || hardcodedPortfolios.length === 0) {
        console.log('   No portfolio records found for hardcoded user ID');
      } else {
        hardcodedPortfolios.forEach(p => {
          console.log(`   ${p.currency}: ${p.balance} (updated: ${p.updated_at})`);
        });
      }
    }

    // Check the actual logged-in user ID from the API logs
    console.log('\n🔍 Checking actual logged-in user ID: 304f0a68-b009-4199-80bc-6ba99dc7ffc7');
    const loggedInUserId = '304f0a68-b009-4199-80bc-6ba99dc7ffc7';
    
    // Check if this user exists in users table
    const { data: loggedInUser, error: loggedInUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', loggedInUserId)
      .single();

    if (loggedInUserError) {
      console.error('❌ Error fetching logged-in user:', loggedInUserError);
    } else {
      console.log('✅ Logged-in user details:', loggedInUser);
    }

    // Check portfolios for the logged-in user
    const { data: loggedInPortfolios, error: loggedInPortfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', loggedInUserId);

    if (loggedInPortfolioError) {
      console.error('❌ Error fetching logged-in user portfolios:', loggedInPortfolioError);
    } else {
      console.log('💰 Logged-in user portfolio balances:');
      if (!loggedInPortfolios || loggedInPortfolios.length === 0) {
        console.log('   No portfolio records found for logged-in user - this explains the 0 balance!');
      } else {
        loggedInPortfolios.forEach(p => {
          console.log(`   ${p.currency}: ${p.balance} (updated: ${p.updated_at})`);
        });
        const totalBalance = loggedInPortfolios.reduce((sum, p) => sum + parseFloat(p.balance), 0);
        console.log(`   Total balance for logged-in user: $${totalBalance}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

findUserAndBalance().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});