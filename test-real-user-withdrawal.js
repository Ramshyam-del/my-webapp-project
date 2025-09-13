// Test script to simulate real user withdrawal flow
// This will help identify the exact authentication issue

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (same as frontend)
const supabaseUrl = 'https://ishprhrmvubfzohvqqxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaHByaHJtdnViZnpvaHZxcXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjQyNzQsImV4cCI6MjA2OTcwMDI3NH0.2K80tAGXm2ElODR8_3OawJigieVY6cw77o2NVgUgh9U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealUserWithdrawal() {
  console.log('🧪 Testing Real User Withdrawal Flow...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    // Step 1: Check current session
    console.log('\n=== Step 1: Check Current Session ===');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session Error:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session found');
      console.log('💡 You need to log in first. Try logging in through the web app.');
      return;
    }
    
    console.log('✅ Active session found');
    console.log('User ID:', session.user.id);
    console.log('User Email:', session.user.email);
    console.log('Token expires at:', new Date(session.expires_at * 1000));
    console.log('Token valid:', new Date() < new Date(session.expires_at * 1000));
    
    // Step 2: Test token validity with API
    console.log('\n=== Step 2: Test Token with Withdrawal API ===');
    const response = await fetch('http://localhost:3000/api/withdrawals/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        currency: 'USDT',
        amount: 1,
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        network: 'ethereum',
        user_note: 'Test withdrawal from script'
      })
    });
    
    const result = await response.json();
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 401) {
      console.log('\n🔍 Token validation failed. Let\'s check token details:');
      
      // Step 3: Validate token manually
      console.log('\n=== Step 3: Manual Token Validation ===');
      try {
        const { data: user, error: userError } = await supabase.auth.getUser(session.access_token);
        if (userError) {
          console.error('❌ Token validation error:', userError);
        } else {
          console.log('✅ Token is valid for user:', user.user.email);
        }
      } catch (tokenError) {
        console.error('❌ Token validation exception:', tokenError);
      }
    }
    
    // Step 4: Check user's portfolio balance
    if (response.status !== 401) {
      console.log('\n=== Step 4: Check Portfolio Balance ===');
      const balanceResponse = await fetch(`http://localhost:3000/api/portfolio/balance?userId=${session.user.id}`);
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log('Portfolio Balance:', JSON.stringify(balanceData, null, 2));
      } else {
        console.log('❌ Failed to fetch portfolio balance:', balanceResponse.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Also test with environment variables from .env.local
async function loadEnvAndTest() {
  try {
    // Try to load .env.local
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env.local');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      envLines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && key.startsWith('NEXT_PUBLIC_SUPABASE_')) {
          process.env[key] = value;
        }
      });
      
      console.log('📁 Loaded environment variables from .env.local');
    }
  } catch (error) {
    console.log('⚠️  Could not load .env.local:', error.message);
  }
  
  await testRealUserWithdrawal();
}

loadEnvAndTest().catch(console.error);