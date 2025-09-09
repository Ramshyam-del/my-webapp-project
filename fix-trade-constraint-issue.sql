-- Fix trade constraint issue that's preventing admin win/loss actions
-- The issue is with trade_type constraint being too restrictive

-- Drop the existing constraint if it exists
ALTER TABLE trades DROP CONSTRAINT IF EXISTS check_trade_type_valid;

-- Add a more permissive constraint that handles all current trade_type values
ALTER TABLE trades ADD CONSTRAINT check_trade_type_valid 
CHECK (trade_type IN ('BUY UP', 'BUY FALL', 'buy', 'sell', 'long', 'short', 'buy_up', 'buy_down', '1', 'BUY', 'SELL'));

-- Also ensure status constraint is correct
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_status_check;
ALTER TABLE trades ADD CONSTRAINT trades_status_check 
CHECK (status IN ('active', 'completed', 'cancelled', 'expired', 'liquidated', 'OPEN', 'CLOSED'));

-- Verify the constraints
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name IN ('check_trade_type_valid', 'trades_status_check');