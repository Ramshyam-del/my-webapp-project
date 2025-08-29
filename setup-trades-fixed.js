#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function setupTradesTable() {
  console.log('🔧 Setting up trades table (FIXED VERSION)...');
  
  if (!serverSupabase) {
    console.error('❌ Supabase client not available - check environment variables');
    process.exit(1);
  }

  try {
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('=== COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ===');
    console.log('');
    
    const sql = `-- Drop existing trades table if it exists
DROP TABLE IF EXISTS public.trades CASCADE;

-- Create trades table for Win/Loss tracking
CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  pair text NOT NULL,
  side text NOT NULL CHECK (side IN ('LONG','SHORT')),
  leverage numeric NOT NULL,
  duration text NOT NULL,
  amount numeric NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  pnl numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','WIN','LOSS')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX trades_user_idx ON public.trades(user_id);
CREATE INDEX trades_status_idx ON public.trades(status);
CREATE INDEX trades_created_idx ON public.trades(created_at DESC);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY insert_own_trades
ON public.trades FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY select_own_trades
ON public.trades FOR SELECT TO authenticated
USING (auth.uid()::text = user_id);

-- Create policy for admin access (service role)
CREATE POLICY admin_all_trades
ON public.trades FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();`;
    
    console.log(sql);
    console.log('');
    console.log('=== END SQL ===');
    console.log('');
    console.log('⚠️  IMPORTANT: This will DROP the existing trades table if it exists!');
    console.log('💡 After running the SQL, press Enter to test the table...');
    
    // Wait for user input
    process.stdin.once('data', async () => {
      await testTradesTable();
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function testTradesTable() {
  try {
    console.log('🧪 Testing trades table...');
    
    // Test inserting a sample trade
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
    
    console.log('📝 Inserting sample trade...');
    const { data: inserted, error: insertError } = await serverSupabase
      .from('trades')
      .insert([sampleTrade])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting sample trade:', insertError);
      console.log('💡 Make sure you ran the SQL in Supabase SQL Editor first');
      process.exit(1);
    }
    
    console.log('✅ Sample trade inserted successfully:', inserted.id);
    
    // Test closing the trade
    console.log('🔒 Testing trade closure...');
    const exitPrice = 51000; // 2% profit
    const entry = Number(inserted.entry_price);
    const exit = exitPrice;
    const lev = Number(inserted.leverage);
    const amt = Number(inserted.amount);
    
    const raw = (exit - entry) / entry;
    const pnl = raw * lev * amt;
    const status = pnl >= 0 ? 'WIN' : 'LOSS';
    
    const { data: updated, error: updateError } = await serverSupabase
      .from('trades')
      .update({
        exit_price: exit,
        pnl,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', inserted.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating trade:', updateError);
      process.exit(1);
    }
    
    console.log('✅ Trade closed successfully!');
    console.log(`📊 PnL: $${pnl.toFixed(2)} (${status})`);
    
    // Clean up the test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await serverSupabase
      .from('trades')
      .delete()
      .eq('user_id', 'test-user-123');
    
    if (deleteError) {
      console.warn('⚠️  Warning: Could not clean up test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 Trades table is working perfectly!');
    console.log('🚀 You can now use the Win/Loss tab in your admin panel');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Run: node add-sample-trades.js (to add sample data)');
    console.log('   2. Go to your admin panel and test the Win/Loss tab');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

setupTradesTable();
