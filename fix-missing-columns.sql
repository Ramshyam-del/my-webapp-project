-- PRODUCTION FIX: Add missing columns to trading_orders table
-- Run this SQL in your Supabase SQL Editor

BEGIN;

-- Add missing columns to trading_orders table
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS admin_action VARCHAR(20) DEFAULT NULL;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS expiry_ts TIMESTAMP DEFAULT NULL;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) DEFAULT NULL;

-- Update existing records to set entry_price same as price if null
UPDATE trading_orders 
SET entry_price = COALESCE(entry_price, price) 
WHERE entry_price IS NULL AND price IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_orders_expiry_ts ON trading_orders(expiry_ts);
CREATE INDEX IF NOT EXISTS idx_trading_orders_admin_action ON trading_orders(admin_action);
CREATE INDEX IF NOT EXISTS idx_trading_orders_entry_price ON trading_orders(entry_price);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'trading_orders' 
AND table_schema = 'public'
AND column_name IN ('entry_price', 'admin_action', 'expiry_ts', 'user_name')
ORDER BY column_name;

COMMIT;

-- Success message
SELECT 'Missing columns added successfully to trading_orders table!' as status;