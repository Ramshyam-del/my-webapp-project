-- Add missing columns to trading_orders table
ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS outcome VARCHAR(10);

-- Add index for order_number
CREATE INDEX IF NOT EXISTS idx_trading_orders_order_number ON trading_orders(order_number);

-- Add index for expires_at
CREATE INDEX IF NOT EXISTS idx_trading_orders_expires_at ON trading_orders(expires_at);

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);

-- Update existing records to have order numbers
UPDATE trading_orders 
SET order_number = 'ORD-' || EXTRACT(EPOCH FROM created_at)::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 5)
WHERE order_number IS NULL;

-- Make order_number NOT NULL
ALTER TABLE trading_orders ALTER COLUMN order_number SET NOT NULL;
