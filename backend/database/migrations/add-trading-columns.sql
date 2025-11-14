-- Migration script to add missing columns to trades table
-- Run this in your Supabase SQL Editor

-- Add entry_price column (stores the price when trade was opened)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS entry_price DECIMAL(20,8);

-- Add side column (buy/sell direction)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS side VARCHAR(10) CHECK (side IN ('buy', 'sell'));

-- Add comments to explain the columns
COMMENT ON COLUMN trades.entry_price IS 'Price at which the trade was opened';
COMMENT ON COLUMN trades.side IS 'Trade direction: buy or sell';

-- Update existing trades with default values (optional - for existing data)
-- You can skip this if you don't have existing trades or want to handle them differently
UPDATE trades 
SET entry_price = 50000.00000000 
WHERE entry_price IS NULL;

UPDATE trades 
SET side = 'buy' 
WHERE side IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND column_name IN ('entry_price', 'side')
ORDER BY column_name;

-- Show sample of updated trades table structure
SELECT * FROM trades LIMIT 1;