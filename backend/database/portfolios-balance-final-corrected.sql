-- =====================================================
-- PORTFOLIOS AND BALANCE ADJUSTMENT - FINAL CORRECTED VERSION
-- Fixes all identified issues for production deployment
-- =====================================================

-- Drop existing policies and functions for clean setup
DROP POLICY IF EXISTS "Users can view own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Admins can view all portfolios" ON portfolios;
DROP POLICY IF EXISTS "Service role can manage portfolios" ON portfolios;
DROP FUNCTION IF EXISTS adjust_balance(TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS adjust_balance(UUID, TEXT, NUMERIC);

-- Create portfolios table with proper precision for cryptocurrency
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR')),
    balance NUMERIC(20,8) DEFAULT 0 CHECK (balance >= 0), -- High precision for crypto
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON portfolios(currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_balance ON portfolios(balance) WHERE balance > 0;

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create NON-RECURSIVE RLS policies (CRITICAL FIX)

-- Users can view their own portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own portfolios  
CREATE POLICY "Users can update own portfolios" ON portfolios
    FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own portfolios
CREATE POLICY "Users can insert own portfolios" ON portfolios
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- CRITICAL FIX: Admin policy using direct UUID comparison (prevents recursion)
CREATE POLICY "Admins can view all portfolios" ON portfolios
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Service role can manage all portfolios
CREATE POLICY "Service role can manage portfolios" ON portfolios
    FOR ALL USING (auth.role() = 'service_role');

-- Create atomic adjust_balance function with consistent data types
CREATE OR REPLACE FUNCTION adjust_balance(
    p_user_id UUID,  -- FIXED: Use UUID consistently
    p_currency TEXT,
    p_delta NUMERIC
)
RETURNS TABLE(user_id UUID, currency TEXT, balance NUMERIC, updated_at TIMESTAMPTZ) AS $$
DECLARE
    current_balance NUMERIC := 0;
    new_balance NUMERIC;
BEGIN
    -- Get current balance with row-level lock for atomic operation (CRITICAL FIX)
    SELECT p.balance INTO current_balance
    FROM portfolios p
    WHERE p.user_id = p_user_id AND p.currency = p_currency
    FOR UPDATE; -- Prevents race conditions during concurrent operations
    
    -- If no portfolio exists, create one with 0 balance
    IF NOT FOUND THEN
        INSERT INTO portfolios (user_id, currency, balance, created_at, updated_at)
        VALUES (p_user_id, p_currency, 0, NOW(), NOW());
        current_balance := 0;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance + p_delta;
    
    -- Check for insufficient funds (only for negative deltas)
    IF p_delta < 0 AND new_balance < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Current balance %.8f + delta %.8f = %.8f', 
                       current_balance, p_delta, new_balance;
    END IF;
    
    -- Update the balance with explicit table alias
    UPDATE portfolios p
    SET 
        balance = new_balance,
        updated_at = NOW()
    WHERE p.user_id = p_user_id AND p.currency = p_currency;
    
    -- Log the operation for audit trail
    RAISE LOG 'Balance adjusted for user % currency %: %.8f -> %.8f (delta: %.8f)', 
             p_user_id, p_currency, current_balance, new_balance, p_delta;
    
    -- Return the updated portfolio record (FIXED: Consistent UUID return type)
    RETURN QUERY
    SELECT p.user_id, p.currency, p.balance, p.updated_at
    FROM portfolios p
    WHERE p.user_id = p_user_id AND p.currency = p_currency;
    
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'INVALID_USER: User ID % does not exist', p_user_id;
    WHEN check_violation THEN
        RAISE EXCEPTION 'CONSTRAINT_VIOLATION: Balance adjustment violates table constraints';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'BALANCE_ADJUSTMENT_ERROR: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create overloaded function to handle TEXT input (for backward compatibility)
CREATE OR REPLACE FUNCTION adjust_balance(
    p_user_id TEXT,
    p_currency TEXT,
    p_delta NUMERIC
)
RETURNS TABLE(user_id UUID, currency TEXT, balance NUMERIC, updated_at TIMESTAMPTZ) AS $$
BEGIN
    -- Convert TEXT to UUID and call the main function
    RETURN QUERY
    SELECT * FROM adjust_balance(p_user_id::UUID, p_currency, p_delta);
EXCEPTION
    WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'INVALID_USER_ID: Cannot convert % to UUID', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION adjust_balance(UUID, TEXT, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION adjust_balance(TEXT, TEXT, NUMERIC) TO authenticated, service_role;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON portfolios TO authenticated;
GRANT ALL ON portfolios TO service_role;

-- Comprehensive verification
DO $$
DECLARE
    table_exists BOOLEAN;
    policy_count INTEGER;
    function_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check table exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'portfolios' AND table_schema = 'public'
    ) INTO table_exists;
    
    -- Count policies  
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies WHERE tablename = 'portfolios';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name = 'adjust_balance' AND routine_schema = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes WHERE tablename = 'portfolios';
    
    -- Report status
    IF table_exists AND policy_count = 5 AND function_count = 2 AND index_count >= 4 THEN
        RAISE NOTICE 'SUCCESS: Portfolios system is production-ready';
        RAISE NOTICE 'Table: ✓ | Policies: % | Functions: % | Indexes: %', policy_count, function_count, index_count;
        RAISE NOTICE 'FIXES APPLIED: Non-recursive RLS, atomic operations, consistent data types';
    ELSE
        RAISE WARNING 'SETUP INCOMPLETE - Table: % | Policies: % | Functions: % | Indexes: %', 
                     CASE WHEN table_exists THEN '✓' ELSE '✗' END,
                     policy_count, function_count, index_count;
    END IF;
END $$;

-- Show the corrected structure
SELECT 
    'portfolios' as table_name,
    column_name, 
    data_type,
    CASE column_name
        WHEN 'user_id' THEN 'UUID (Fixed from TEXT)'
        WHEN 'balance' THEN 'NUMERIC(20,8) (High precision)'
        ELSE 'Standard'
    END as enhancement
FROM information_schema.columns 
WHERE table_name = 'portfolios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test example (uncomment to test)
-- SELECT * FROM adjust_balance('00000000-0000-0000-0000-000000000000'::UUID, 'USDT', 100);

COMMIT;