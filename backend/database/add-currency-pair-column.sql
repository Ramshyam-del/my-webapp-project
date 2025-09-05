-- Add missing currency_pair column to trades table
-- This fixes the "column 'currency_pair' does not exist" error

ALTER TABLE trades ADD COLUMN IF NOT EXISTS currency_pair TEXT;

-- Update existing records to populate currency_pair from pair column
UPDATE trades SET currency_pair = pair WHERE currency_pair IS NULL;

-- Add NOT NULL constraint after populating data
ALTER TABLE trades ALTER COLUMN currency_pair SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_trades_currency_pair ON trades(currency_pair);

-- Verification query
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trades' AND column_name IN ('pair', 'currency_pair');