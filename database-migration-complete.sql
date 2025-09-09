-- Complete Database Migration for Trading System
-- Run this SQL script in your Supabase SQL Editor

BEGIN;

-- Add missing columns to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price NUMERIC(20,8);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_type TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS start_ts TIMESTAMPTZ;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS expiry_ts TIMESTAMPTZ;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS admin_action TEXT CHECK (admin_action IN ('win', 'loss', 'pending'));
ALTER TABLE trades ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMPTZ;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_result TEXT CHECK (trade_result IN ('win', 'loss', 'pending'));
ALTER TABLE trades ADD COLUMN IF NOT EXISTS result_determined_at TIMESTAMPTZ;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS auto_expired BOOLEAN DEFAULT FALSE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS final_pnl NUMERIC(20,8);

-- Update existing records with default values
UPDATE trades SET 
    entry_price = COALESCE(entry_price, 50000),
    trade_type = COALESCE(trade_type, 'BUY UP'),
    admin_action = COALESCE(admin_action, 'pending'),
    trade_result = COALESCE(trade_result, 'pending'),
    auto_expired = COALESCE(auto_expired, FALSE),
    start_ts = COALESCE(start_ts, created_at),
    expiry_ts = COALESCE(expiry_ts, created_at + INTERVAL '6 minutes')
WHERE entry_price IS NULL OR trade_type IS NULL OR admin_action IS NULL OR trade_result IS NULL;

-- Add constraints
ALTER TABLE trades ALTER COLUMN entry_price SET NOT NULL;
ALTER TABLE trades ALTER COLUMN trade_type SET NOT NULL;
ALTER TABLE trades ALTER COLUMN admin_action SET NOT NULL;
ALTER TABLE trades ALTER COLUMN trade_result SET NOT NULL;

-- Add check constraints (using DO block to handle existing constraints)
DO $$
BEGIN
    -- Add entry_price check constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_entry_price_positive' 
                   AND table_name = 'trades') THEN
        ALTER TABLE trades ADD CONSTRAINT check_entry_price_positive CHECK (entry_price > 0);
    END IF;
    
    -- Add trade_type check constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_trade_type_valid' 
                   AND table_name = 'trades') THEN
        ALTER TABLE trades ADD CONSTRAINT check_trade_type_valid CHECK (trade_type IN ('BUY UP', 'BUY FALL', 'buy', 'sell', 'long', 'short'));
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_admin_action ON trades(admin_action);
CREATE INDEX IF NOT EXISTS idx_trades_trade_result ON trades(trade_result);
CREATE INDEX IF NOT EXISTS idx_trades_expiry_ts ON trades(expiry_ts);
CREATE INDEX IF NOT EXISTS idx_trades_start_ts ON trades(start_ts);
CREATE INDEX IF NOT EXISTS idx_trades_auto_expired ON trades(auto_expired);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;

-- Test query to ensure everything works
SELECT COUNT(*) as total_trades, 
       COUNT(CASE WHEN trade_result = 'pending' THEN 1 END) as pending_trades,
       COUNT(CASE WHEN admin_action = 'pending' THEN 1 END) as pending_admin_actions
FROM trades;