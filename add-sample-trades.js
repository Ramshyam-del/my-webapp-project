#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function addSampleTrades() {
  console.log('🎯 Adding sample trades for testing...');
  
  if (!serverSupabase) {
    console.error('❌ Supabase client not available - check environment variables');
    process.exit(1);
  }

  try {
    const sampleTrades = [
      {
        user_id: 'user-001',
        user_name: 'John Doe',
        pair: 'BTC/USDT',
        side: 'LONG',
        leverage: 10,
        duration: '1h',
        amount: 100,
        entry_price: 50000,
        status: 'OPEN'
      },
      {
        user_id: 'user-002',
        user_name: 'Jane Smith',
        pair: 'ETH/USDT',
        side: 'SHORT',
        leverage: 5,
        duration: '30m',
        amount: 200,
        entry_price: 3000,
        status: 'OPEN'
      },
      {
        user_id: 'user-003',
        user_name: 'Bob Johnson',
        pair: 'BTC/USDT',
        side: 'LONG',
        leverage: 20,
        duration: '2h',
        amount: 50,
        entry_price: 48000,
        exit_price: 52000,
        pnl: 416.67,
        status: 'WIN'
      },
      {
        user_id: 'user-004',
        user_name: 'Alice Brown',
        pair: 'ETH/USDT',
        side: 'SHORT',
        leverage: 15,
        duration: '1h',
        amount: 150,
        entry_price: 3200,
        exit_price: 3400,
        pnl: -937.5,
        status: 'LOSS'
      },
      {
        user_id: 'user-005',
        user_name: 'Charlie Wilson',
        pair: 'ADA/USDT',
        side: 'LONG',
        leverage: 8,
        duration: '45m',
        amount: 300,
        entry_price: 0.5,
        exit_price: 0.55,
        pnl: 240,
        status: 'WIN'
      },
      {
        user_id: 'user-001',
        user_name: 'John Doe',
        pair: 'SOL/USDT',
        side: 'SHORT',
        leverage: 12,
        duration: '1h',
        amount: 75,
        entry_price: 100,
        status: 'OPEN'
      },
      {
        user_id: 'user-002',
        user_name: 'Jane Smith',
        pair: 'DOT/USDT',
        side: 'LONG',
        leverage: 6,
        duration: '2h',
        amount: 250,
        entry_price: 7.5,
        exit_price: 7.2,
        pnl: -200,
        status: 'LOSS'
      }
    ];

    console.log(`📝 Inserting ${sampleTrades.length} sample trades...`);
    
    const { data: inserted, error } = await serverSupabase
      .from('trades')
      .insert(sampleTrades)
      .select();

    if (error) {
      console.error('❌ Error inserting sample trades:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully inserted ${inserted.length} sample trades!`);
    
    // Show summary
    const openCount = inserted.filter(t => t.status === 'OPEN').length;
    const winCount = inserted.filter(t => t.status === 'WIN').length;
    const lossCount = inserted.filter(t => t.status === 'LOSS').length;
    
    console.log('');
    console.log('📊 Sample Data Summary:');
    console.log(`   Open trades: ${openCount}`);
    console.log(`   Win trades: ${winCount}`);
    console.log(`   Loss trades: ${lossCount}`);
    console.log(`   Total trades: ${inserted.length}`);
    console.log('');
    console.log('🎉 Sample trades are ready! You can now test the Win/Loss tab.');
    console.log('💡 Go to your admin panel and click on the "Win/Loss" tab to see the trades.');
    
  } catch (error) {
    console.error('❌ Failed to add sample trades:', error);
    process.exit(1);
  }
}

addSampleTrades();
