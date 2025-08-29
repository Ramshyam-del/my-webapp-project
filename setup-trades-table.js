#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { serverSupabase } = require('./backend/lib/supabaseServer');
const fs = require('fs');
const path = require('path');

async function setupTradesTable() {
  console.log('🔧 Setting up trades table...');
  
  if (!serverSupabase) {
    console.error('❌ Supabase client not available - check environment variables');
    process.exit(1);
  }

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'CREATE_TRADES_TABLE.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Execute the SQL
    const { error } = await serverSupabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ Trades table setup completed successfully!');
    
    // Test the table by inserting a sample trade
    console.log('🧪 Testing table with sample data...');
    
    const sampleTrade = {
      user_id: 'test-user-123',
      user_name: 'Test User',
      pair: 'BTC/USDT',
      side: 'LONG',
      leverage: 10,
      duration: '1h',
      amount: 100,
      entry_price: 50000,
      metadata: { test: true }
    };
    
    const { data: inserted, error: insertError } = await serverSupabase
      .from('trades')
      .insert([sampleTrade])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting sample trade:', insertError);
      process.exit(1);
    }
    
    console.log('✅ Sample trade inserted successfully:', inserted.id);
    
    // Clean up the test data
    const { error: deleteError } = await serverSupabase
      .from('trades')
      .delete()
      .eq('user_id', 'test-user-123');
    
    if (deleteError) {
      console.warn('⚠️  Warning: Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 Trades table is ready for use!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupTradesTable();
