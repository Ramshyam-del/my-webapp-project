-- Fix trades table schema to match expected structure
-- This will update the existing trades table to include missing columns

BEGIN;

-- First, let's check if we need to backup existing data
DO $$
BEGIN
    -- Check if trades table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades' AND table_schema = 'public') THEN
        RAISE NOTICE 'Trades table exists, proceeding with schema update';
        
        -- Add missing columns if they don't exist
        
        -- Add entry_price column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_price' AND table_schema = 'public') THEN
            ALTER TABLE trades ADD COLUMN entry_price NUMERIC(20,8);
            RAISE NOTICE 'Added entry_price column';
        END IF;
        
        -- Add exit_price column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'exit_price' AND table_schema = 'public') THEN
            ALTER TABLE trades ADD COLUMN exit_price NUMERIC(20,8);
            RAISE NOTICE 'Added exit_price column';
        END IF;
        
        -- Add trade_type column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_type' AND table_schema = 'public') THEN
            ALTER TABLE trades ADD COLUMN trade_type TEXT;
            RAISE NOTICE 'Added trade_type column';
        END IF;
        
        -- Add duration_seconds column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'duration_seconds' AND table_schema = 'public') THEN
            ALTER TABLE trades ADD COLUMN duration_seconds INTEGER;
            RAISE NOTICE 'Added duration_seconds column';
        END IF;
        
        -- Add stop_loss column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'stop_loss' AND table_schema = 'public') THEN
            ALTER TABLE trades ADD COLUMN stop_loss NUMERIC(20,8);
            RAISE NOTICE 'Added stop_loss column';
        END IF;
        
        -- Add take_profit column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'take_profit' AND table_schema = 'public') THEN
            ALTER TABLE trades ADD COLUMN take_profit NUMERIC(20,8);
            RAISE NOTICE 'Added take_profit column';
        END IF;
        
        -- Add fee column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee' AND column_name = 'fee' AND table_schema = 'public') THEN
            ALTER TABLE trades ADD COLUMN fee NUMERIC(20,8) DEFAULT 0.00000000;
            RAISE NOTICE 'Added fee column';
        END IF;
        
        -- Update existing records to have default values for new columns
        UPDATE trades SET 
            entry_price = COALESCE(entry_price, 0),
            trade_type = COALESCE(trade_type, 'buy'),
            fee = COALESCE(fee, 0)
        WHERE entry_price IS NULL OR trade_type IS NULL OR fee IS NULL;
        
        -- Add constraints after data is updated
        ALTER TABLE trades ALTER COLUMN entry_price SET NOT NULL;
        ALTER TABLE trades ALTER COLUMN trade_type SET NOT NULL;
        
        -- Add check constraints
        ALTER TABLE trades ADD CONSTRAINT check_entry_price_positive CHECK (entry_price > 0);
        ALTER TABLE trades ADD CONSTRAINT check_trade_type_valid CHECK (trade_type IN ('buy', 'sell', 'buy_up', 'buy_down', 'long', 'short'));
        ALTER TABLE trades ADD CONSTRAINT check_leverage_range CHECK (leverage >= 1 AND leverage <= 100);
        
        RAISE NOTICE 'Trades table schema updated successfully';
    ELSE
        RAISE NOTICE 'Trades table does not exist';
    END IF;
END $$;

-- Verify the updated structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;