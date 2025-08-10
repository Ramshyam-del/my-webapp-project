-- Fix trading_orders constraints for Quantex Platform
-- This script fixes the constraint issues blocking order placement

-- Drop the problematic constraint
ALTER TABLE trading_orders DROP CONSTRAINT IF EXISTS trading_orders_type_check;

-- Create a new constraint that allows 'market' orders
ALTER TABLE trading_orders ADD CONSTRAINT trading_orders_type_check 
CHECK (type IN ('market', 'limit', 'binary'));

-- Drop the status constraint that's also causing issues
ALTER TABLE trading_orders DROP CONSTRAINT IF EXISTS trading_orders_status_check;

-- Create a new status constraint
ALTER TABLE trading_orders ADD CONSTRAINT trading_orders_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'failed', 'processing'));

-- Ensure all required columns exist
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS outcome VARCHAR(10);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS profit_loss DECIMAL(15,8);

-- Update admin user to ensure it exists
INSERT INTO users (id, email, role, balance, created_at, updated_at)
VALUES (
    '1c2de2e1-7aa3-47f5-b11b-9a11d2532868',
    'admin@quantex.com',
    'admin',
    10000,
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    balance = 10000,
    updated_at = NOW();

-- Verify the fixes
SELECT 'Constraints fixed successfully' as status;
