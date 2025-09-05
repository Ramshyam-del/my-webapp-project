-- =====================================================
-- FIX ORDERS TABLE - ADD MISSING PAIR_ID COLUMN
-- This script adds the missing pair_id column to existing orders table
-- =====================================================

-- First, ensure crypto_pairs table exists
CREATE TABLE IF NOT EXISTS crypto_pairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    min_trade_amount NUMERIC(20,8) DEFAULT 0.00000001,
    max_trade_amount NUMERIC(20,8) DEFAULT 1000000.00000000,
    price_precision INTEGER DEFAULT 8,
    quantity_precision INTEGER DEFAULT 8,
    maker_fee NUMERIC(5,4) DEFAULT 0.0010,
    taker_fee NUMERIC(5,4) DEFAULT 0.0010,
    current_price NUMERIC(20,8),
    price_change_24h NUMERIC(10,4),
    volume_24h NUMERIC(20,8),
    high_24h NUMERIC(20,8),
    low_24h NUMERIC(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add pair_id column to orders table if it doesn't exist
DO $$
BEGIN
    -- Check if pair_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'pair_id' 
        AND table_schema = 'public'
    ) THEN
        -- Add the pair_id column
        ALTER TABLE orders ADD COLUMN pair_id UUID REFERENCES crypto_pairs(id);
        
        -- Add index for the new column
        CREATE INDEX IF NOT EXISTS idx_orders_pair_id ON orders(pair_id);
        
        RAISE NOTICE 'Added pair_id column to orders table';
    ELSE
        RAISE NOTICE 'pair_id column already exists in orders table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;