#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { supabaseAdmin } = require('./backend/lib/supabaseAdmin');

async function addSamplePortfolio() {
  console.log('💰 Adding sample portfolio data...');
  
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available - check environment variables');
    process.exit(1);
  }

  try {
    // Sample user ID (replace with actual user ID in production)
    const userId = 'user123';
    
    // Sample portfolio data
    const samplePortfolios = [
      {
        user_id: userId,
        currency: 'USDT',
        balance: 5000.00
      },
      {
        user_id: userId,
        currency: 'BTC',
        balance: 0.25
      },
      {
        user_id: userId,
        currency: 'ETH',
        balance: 2.5
      }
    ];

    console.log('📊 Adding sample portfolio balances...');
    
    // Insert sample portfolio data
    const { data, error } = await supabaseAdmin
      .from('portfolios')
      .upsert(samplePortfolios, { 
        onConflict: 'user_id,currency',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Error adding sample portfolio data:', error);
      process.exit(1);
    }

    console.log('✅ Sample portfolio data added successfully!');
    console.log('📋 Added portfolios:', data);
    
    // Fetch and display the total balance
    const { data: portfolios } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);

    const totalBalance = portfolios.reduce((sum, p) => sum + Number(p.balance), 0);
    
    console.log('💰 Total portfolio balance:', totalBalance);
    console.log('📊 Portfolio breakdown:');
    portfolios.forEach(p => {
      console.log(`   ${p.currency}: ${p.balance}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSamplePortfolio();
