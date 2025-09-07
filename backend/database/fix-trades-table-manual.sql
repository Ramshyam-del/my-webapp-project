-- Fix trades table schema - Run this in Supabase SQL Editor
-- This adds the missing entry_price and trade_type columns

-- Add entry_price column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_price' AND table_schema = 'public') THEN
        ALTER TABLE trades ADD COLUMN entry_price NUMERIC(20,8);
        RAISE NOTICE 'Added entry_price column';
    ELSE
        RAISE NOTICE 'entry_price column already exists';
    END IF;
END $$;

-- Add trade_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_type' AND table_schema = 'public') THEN
        ALTER TABLE trades ADD COLUMN trade_type TEXT;
        RAISE NOTICE 'Added trade_type column';
    ELSE
        RAISE NOTICE 'trade_type column already exists';
    END IF;
END $$;

-- Update existing records with default values
UPDATE trades SET 
    entry_price = COALESCE(entry_price, 50000),
    trade_type = COALESCE(trade_type, 'buy')
WHERE entry_price IS NULL OR trade_type IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND table_schema = 'public'
ORDER BY ordinal_position;