-- Direct SQL to add pair_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pair_id UUID REFERENCES crypto_pairs(id);

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_orders_pair_id ON orders(pair_id);

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public' 
AND column_name = 'pair_id';