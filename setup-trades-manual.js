#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { serverSupabase } = require('./backend/lib/supabaseServer');

async function setupTradesTable() {
  console.log('🔧 Setting up trades table manually...');
  
  if (!serverSupabase) {
    console.error('❌ Supabase client not available - check environment variables');
    process.exit(1);
  }

  try {
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('');
    console.log('=== COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ===');
    console.log('');
    
    const sql = `-- Create trades table for Win/Loss tracking
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null,
  pair text not null,
  side text not null check (side in ('LONG','SHORT')),
  leverage numeric not null,
  duration text not null,
  amount numeric not null,
  entry_price numeric not null,
  exit_price numeric,
  pnl numeric default 0,
  status text not null default 'OPEN' check (status in ('OPEN','WIN','LOSS')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists trades_user_idx on public.trades(user_id);
create index if not exists trades_status_idx on public.trades(status);
create index if not exists trades_created_idx on public.trades(created_at desc);

-- Enable RLS
alter table public.trades enable row level security;

-- Drop existing policies if they exist
drop policy if exists insert_own_trades on public.trades;
drop policy if exists select_own_trades on public.trades;

-- Create policies for authenticated users
create policy insert_own_trades
on public.trades for insert to authenticated
with check (auth.uid()::text = user_id);

create policy select_own_trades
on public.trades for select to authenticated
using (auth.uid()::text = user_id);

-- Create policy for admin access (service role)
create policy admin_all_trades
on public.trades for all to service_role
using (true)
with check (true);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_trades_updated_at on public.trades;
create trigger update_trades_updated_at
  before update on public.trades
  for each row
  execute function update_updated_at_column();`;
    
    console.log(sql);
    console.log('');
    console.log('=== END SQL ===');
    console.log('');
    console.log('After running the SQL, press Enter to test the table...');
    
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
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

setupTradesTable();
