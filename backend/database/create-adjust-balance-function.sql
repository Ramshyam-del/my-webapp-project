-- Execute this SQL in your Supabase SQL Editor to fix the settlement errors
-- This creates the missing adjust_balance function that prevents "user_id is ambiguous" errors

-- First, create the portfolios table if it doesn't exist
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance NUMERIC DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON portfolios(currency);

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Admins can view all portfolios" ON portfolios;
DROP POLICY IF EXISTS "Service role can manage portfolios" ON portfolios;

-- Create RLS policies for portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can update own portfolios" ON portfolios
  FOR UPDATE USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can insert own portfolios" ON portfolios
  FOR INSERT WITH CHECK (user_id::uuid = auth.uid()::uuid);

-- Allow admins to view all portfolios
CREATE POLICY "Admins can view all portfolios" ON portfolios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::uuid = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

-- Allow service role to manage all portfolios (for system operations)
CREATE POLICY "Service role can manage portfolios" ON portfolios
  FOR ALL USING (auth.role() = 'service_role');

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS adjust_balance(TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS adjust_balance(UUID, TEXT, NUMERIC);

-- Now create the adjust_balance function with proper table aliasing
-- Handle both text and UUID input for user_id to avoid function signature conflicts
CREATE OR REPLACE FUNCTION adjust_balance(
  p_user_id TEXT,
  p_currency TEXT,
  p_delta NUMERIC
)
RETURNS TABLE(user_id TEXT, currency TEXT, balance NUMERIC, updated_at TIMESTAMPTZ) AS $$
DECLARE
  current_balance NUMERIC := 0;
  new_balance NUMERIC;
BEGIN
  -- Get current balance or create portfolio entry if it doesn't exist
  -- Use explicit table alias to avoid "user_id is ambiguous" error
  SELECT p.balance INTO current_balance
  FROM portfolios p
  WHERE p.user_id = p_user_id AND p.currency = p_currency;
  
  -- If no portfolio exists, create one with 0 balance
  IF NOT FOUND THEN
    INSERT INTO portfolios (user_id, currency, balance, updated_at)
    VALUES (p_user_id, p_currency, 0, NOW());
    current_balance := 0;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance + p_delta;
  
  -- Check for insufficient funds (only for negative deltas)
  IF p_delta < 0 AND new_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Current balance % + delta % = %', current_balance, p_delta, new_balance;
  END IF;
  
  -- Update the balance with explicit table alias
  UPDATE portfolios p
  SET 
    balance = new_balance,
    updated_at = NOW()
  WHERE p.user_id = p_user_id AND p.currency = p_currency;
  
  -- Return the updated portfolio record with explicit table alias
  RETURN QUERY
  SELECT p.user_id, p.currency, p.balance, p.updated_at
  FROM portfolios p
  WHERE p.user_id = p_user_id AND p.currency = p_currency;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION adjust_balance(TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_balance(TEXT, TEXT, NUMERIC) TO service_role;

-- Test the function (optional - you can remove this)
-- SELECT * FROM adjust_balance('00000000-0000-0000-0000-000000000000'::UUID, 'USDT', 100);

COMMIT;