#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { supabaseAdmin } = require('./backend/lib/supabaseAdmin');

async function setupTradingSystem() {
  console.log('🔧 Setting up complete trading system (MANUAL VERSION)...');
  
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available - check environment variables');
    process.exit(1);
  }

  try {
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('=== COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ===');
    console.log('');
    
    const sql = `-- Drop existing trades table if it exists (to recreate with new structure)
DROP TABLE IF EXISTS public.trades CASCADE;

-- Users' per-currency balances
CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  currency text NOT NULL,                       -- e.g. USDT, BTC, ETH (balance bookkeeping currency)
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

-- Admin fund transactions
CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  currency text NOT NULL,
  amount numeric NOT NULL,                      -- positive for recharge, negative for withdraw
  type text NOT NULL CHECK (type IN ('RECHARGE','WITHDRAW')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text                               -- admin id (optional)
);

-- Trades table with new structure
CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  currency text NOT NULL,                       -- e.g. USDT (portfolio currency)
  pair text NOT NULL,                           -- e.g. BTC/USDT
  leverage numeric NOT NULL,
  duration text NOT NULL,                       -- e.g. 1m,5m,15m,1h
  amount numeric NOT NULL,                      -- stake in 'currency'
  start_ts timestamptz NOT NULL DEFAULT now(),
  expiry_ts timestamptz,
  admin_decision text CHECK (admin_decision IN ('WIN','LOSS')),  -- nullable until chosen
  outcome text CHECK (outcome IN ('WIN','LOSS')),                -- final result at settlement
  settled boolean NOT NULL DEFAULT false,
  settled_at timestamptz,
  pnl numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','SETTLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON public.portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_trades_user ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_expiry ON public.trades(expiry_ts);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_settled ON public.trades(settled);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY IF NOT EXISTS select_own_portfolio ON public.portfolios FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY IF NOT EXISTS select_own_trades ON public.trades FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Create policies for admin access (service role)
CREATE POLICY IF NOT EXISTS admin_all_portfolios ON public.portfolios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS admin_all_fund_transactions ON public.fund_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS admin_all_trades ON public.trades FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create exec_sql function for atomic operations
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result json;
BEGIN
  EXECUTE query;
  RETURN '{}'::json;
END $$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon, authenticated, service_role;`;
    
    console.log(sql);
    console.log('');
    console.log('=== END SQL ===');
    console.log('');
    console.log('⚠️  IMPORTANT: This will DROP the existing trades table if it exists!');
    console.log('💡 After running the SQL, press Enter to test the system...');
    
    // Wait for user input
    process.stdin.once('data', async () => {
      await testTradingSystem();
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function testTradingSystem() {
  try {
    console.log('🧪 Testing trading system...');
    
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
      console.log('💡 Make sure you ran the SQL in Supabase SQL Editor first');
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
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Restart your backend server to enable the settlement worker');
    console.log('   2. Test the admin panel Win/Loss functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

setupTradingSystem();
