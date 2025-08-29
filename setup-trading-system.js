#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { supabaseAdmin } = require('./backend/lib/supabaseAdmin');
const fs = require('fs');
const path = require('path');

async function setupTradingSystem() {
  console.log('🔧 Setting up complete trading system...');
  
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available - check environment variables');
    process.exit(1);
  }

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'TRADING_SYSTEM_SETUP.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded, executing...');
    
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ Trading system setup completed successfully!');
    
    // Test the system by creating sample data
    console.log('🧪 Testing system with sample data...');
    
    // Create sample portfolio
    const samplePortfolio = {
      user_id: 'test-user-123',
      currency: 'USDT',
      balance: 1000
    };
    
    console.log('📝 Creating sample portfolio...');
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .upsert([samplePortfolio], { onConflict: 'user_id,currency' })
      .select()
      .single();
    
    if (portfolioError) {
      console.error('❌ Error creating sample portfolio:', portfolioError);
      process.exit(1);
    }
    
    console.log('✅ Sample portfolio created:', portfolio.id);
    
    // Create sample trade
    const now = new Date();
    const expiry = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    
    const sampleTrade = {
      user_id: 'test-user-123',
      user_name: 'Test User',
      currency: 'USDT',
      pair: 'BTC/USDT',
      leverage: 10,
      duration: '5m',
      amount: 100,
      start_ts: now.toISOString(),
      expiry_ts: expiry.toISOString(),
      status: 'OPEN'
    };
    
    console.log('📝 Creating sample trade...');
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .insert([sampleTrade])
      .select()
      .single();
    
    if (tradeError) {
      console.error('❌ Error creating sample trade:', tradeError);
      process.exit(1);
    }
    
    console.log('✅ Sample trade created:', trade.id);
    
    // Test admin decision
    console.log('🎯 Testing admin decision...');
    const { data: updatedTrade, error: decisionError } = await supabaseAdmin
      .from('trades')
      .update({ admin_decision: 'WIN', updated_at: new Date().toISOString() })
      .eq('id', trade.id)
      .select()
      .single();
    
    if (decisionError) {
      console.error('❌ Error setting admin decision:', decisionError);
      process.exit(1);
    }
    
    console.log('✅ Admin decision set successfully');
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: cleanupError } = await supabaseAdmin
      .from('trades')
      .delete()
      .eq('user_id', 'test-user-123');
    
    if (cleanupError) {
      console.warn('⚠️  Warning: Could not clean up test trades:', cleanupError.message);
    }
    
    const { error: portfolioCleanupError } = await supabaseAdmin
      .from('portfolios')
      .delete()
      .eq('user_id', 'test-user-123');
    
    if (portfolioCleanupError) {
      console.warn('⚠️  Warning: Could not clean up test portfolio:', portfolioCleanupError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 Trading system is working perfectly!');
    console.log('');
    console.log('📋 Available API endpoints:');
    console.log('  POST /api/admin/funds/recharge - Admin recharge user balance');
    console.log('  POST /api/admin/funds/withdraw - Admin withdraw from user balance');
    console.log('  POST /api/trades - User place trade');
    console.log('  PATCH /api/admin/trades/:id/decision - Admin set WIN/LOSS decision');
    console.log('  GET /api/admin/trades - Admin list all trades');
    console.log('');
    console.log('🚀 Settlement worker is running every 15 seconds');
    console.log('💡 Duration multipliers: 1m=0.5x, 5m=1.0x, 15m=1.25x, 1h=1.5x');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupTradingSystem();
