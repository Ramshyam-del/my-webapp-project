-- =====================================================
-- PORTFOLIOS TABLE AND BALANCE ADJUSTMENT FUNCTION
-- Enhanced Production Version with Atomic Operations
-- =====================================================

-- Drop existing policies and functions for clean setup
DROP POLICY IF EXISTS "Users can view own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Admins can view all portfolios" ON portfolios;
DROP POLICY IF EXISTS "Service role can manage portfolios" ON portfolios;
DROP FUNCTION IF EXISTS adjust_balance(TEXT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS adjust_balance(UUID, TEXT, NUMERIC);

-- Create portfolios table with enhanced features for trading platform
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR')),
    balance NUMERIC(20,8) DEFAULT 0 CHECK (balance >= 0), -- Higher precision for crypto
    
    -- Enhanced tracking fields
    locked_balance NUMERIC(20,8) DEFAULT 0 CHECK (locked_balance >= 0), -- For pending trades
    available_balance NUMERIC(20,8) GENERATED ALWAYS AS (balance - locked_balance) STORED,
    
    -- Audit fields
    last_transaction_id UUID, -- Track last transaction for this portfolio
    last_updated_by UUID REFERENCES auth.users(id), -- Track who made the last change
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, currency),
    
    -- Balance integrity constraints
    CHECK (locked_balance <= balance),
    CHECK (available_balance >= 0)
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON portfolios(currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_balance ON portfolios(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_portfolios_available_balance ON portfolios(available_balance) WHERE available_balance > 0;
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON portfolios(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_portfolios_user_balance ON portfolios(user_id, balance DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency_balance ON portfolios(currency, balance DESC);

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create NON-RECURSIVE RLS policies to prevent infinite loops

-- 1. Users can view their own portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR SELECT USING (user_id = auth.uid());

-- 2. Users can update their own portfolios (for balance adjustments)
CREATE POLICY "Users can update own portfolios" ON portfolios
    FOR UPDATE USING (user_id = auth.uid());

-- 3. Users can insert their own portfolios
CREATE POLICY "Users can insert own portfolios" ON portfolios
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. Admins can view all portfolios (NON-RECURSIVE - direct UUID comparison)
CREATE POLICY "Admins can view all portfolios" ON portfolios
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- 5. Service role can manage all portfolios (for system operations)
CREATE POLICY "Service role can manage portfolios" ON portfolios
    FOR ALL USING (auth.role() = 'service_role');

-- Create enhanced atomic balance adjustment function with row-level locking
CREATE OR REPLACE FUNCTION adjust_balance(
    p_user_id TEXT,
    p_currency TEXT,
    p_delta NUMERIC,
    p_transaction_id UUID DEFAULT NULL,
    p_updated_by UUID DEFAULT NULL,
    p_lock_amount NUMERIC DEFAULT 0
)
RETURNS TABLE(
    user_id UUID, 
    currency TEXT, 
    balance NUMERIC, 
    locked_balance NUMERIC,
    available_balance NUMERIC,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    current_balance NUMERIC := 0;
    current_locked NUMERIC := 0;
    new_balance NUMERIC;
    new_locked NUMERIC;
    portfolio_exists BOOLEAN := FALSE;
BEGIN
    -- Convert text user_id to UUID for database operations
    -- Use row-level locking to ensure atomic operations
    SELECT p.balance, p.locked_balance INTO current_balance, current_locked
    FROM portfolios p
    WHERE p.user_id = p_user_id::UUID AND p.currency = p_currency
    FOR UPDATE; -- Critical: Row-level lock for atomic operations
    
    -- Check if portfolio was found
    IF FOUND THEN
        portfolio_exists := TRUE;
    ELSE
        -- Create portfolio if it doesn't exist
        INSERT INTO portfolios (user_id, currency, balance, locked_balance, last_updated_by, created_at, updated_at)
        VALUES (p_user_id::UUID, p_currency, 0, 0, p_updated_by, NOW(), NOW());
        current_balance := 0;
        current_locked := 0;
        portfolio_exists := FALSE;
    END IF;
    
    -- Calculate new balances
    new_balance := current_balance + p_delta;
    new_locked := current_locked + p_lock_amount;
    
    -- Validate balance constraints
    IF new_balance < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Current balance %.8f + delta %.8f = %.8f (negative balance not allowed)', 
                       current_balance, p_delta, new_balance;
    END IF;
    
    IF new_locked < 0 THEN
        RAISE EXCEPTION 'INVALID_LOCK_AMOUNT: Current locked %.8f + lock delta %.8f = %.8f (negative locked balance not allowed)', 
                       current_locked, p_lock_amount, new_locked;
    END IF;
    
    IF new_locked > new_balance THEN
        RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_FUNDS: Locked amount %.8f cannot exceed total balance %.8f', 
                       new_locked, new_balance;
    END IF;
    
    -- Update the portfolio with atomic operation
    UPDATE portfolios p
    SET 
        balance = new_balance,
        locked_balance = new_locked,
        last_transaction_id = COALESCE(p_transaction_id, p.last_transaction_id),
        last_updated_by = COALESCE(p_updated_by, p.last_updated_by),
        updated_at = NOW()
    WHERE p.user_id = p_user_id::UUID AND p.currency = p_currency;
    
    -- Log the balance adjustment for audit trail
    RAISE LOG 'Balance adjusted for user % currency %: %.8f -> %.8f (delta: %.8f, locked: %.8f -> %.8f)', 
             p_user_id, p_currency, current_balance, new_balance, p_delta, current_locked, new_locked;
    
    -- Return the updated portfolio record
    RETURN QUERY
    SELECT p.user_id, p.currency, p.balance, p.locked_balance, p.available_balance, p.updated_at
    FROM portfolios p
    WHERE p.user_id = p_user_id::UUID AND p.currency = p_currency;
    
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'INVALID_USER: User ID % does not exist', p_user_id;
    WHEN check_violation THEN
        RAISE EXCEPTION 'CONSTRAINT_VIOLATION: Balance adjustment violates table constraints';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'BALANCE_ADJUSTMENT_ERROR: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for simple balance queries
CREATE OR REPLACE FUNCTION get_user_balance(
    p_user_id UUID,
    p_currency TEXT
)
RETURNS TABLE(
    balance NUMERIC,
    locked_balance NUMERIC,
    available_balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.balance, p.locked_balance, p.available_balance
    FROM portfolios p
    WHERE p.user_id = p_user_id AND p.currency = p_currency;
    
    -- Return zeros if portfolio doesn't exist
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to lock/unlock balance for trades
CREATE OR REPLACE FUNCTION lock_balance(
    p_user_id UUID,
    p_currency TEXT,
    p_amount NUMERIC,
    p_transaction_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_available NUMERIC;
BEGIN
    -- Check available balance with row lock
    SELECT available_balance INTO current_available
    FROM portfolios
    WHERE user_id = p_user_id AND currency = p_currency
    FOR UPDATE;
    
    IF NOT FOUND OR current_available < p_amount THEN
        RETURN FALSE; -- Insufficient available balance
    END IF;
    
    -- Lock the amount
    UPDATE portfolios
    SET 
        locked_balance = locked_balance + p_amount,
        last_transaction_id = COALESCE(p_transaction_id, last_transaction_id),
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_currency;
    
    RETURN TRUE; -- Success
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_portfolios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS trigger_portfolios_updated_at ON portfolios;
CREATE TRIGGER trigger_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolios_updated_at();

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON portfolios TO authenticated;
GRANT ALL ON portfolios TO service_role;
GRANT EXECUTE ON FUNCTION adjust_balance(TEXT, TEXT, NUMERIC, UUID, UUID, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_balance(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION lock_balance(UUID, TEXT, NUMERIC, UUID) TO authenticated, service_role;

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
    WHERE routine_name IN ('adjust_balance', 'get_user_balance', 'lock_balance')
    AND routine_schema = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes WHERE tablename = 'portfolios';
    
    -- Report status
    IF table_exists AND policy_count >= 5 AND function_count >= 3 AND index_count >= 5 THEN
        RAISE NOTICE 'SUCCESS: Portfolios system configured successfully';
        RAISE NOTICE 'Table: ✓ | Policies: % | Functions: % | Indexes: %', policy_count, function_count, index_count;
    ELSE
        RAISE WARNING 'INCOMPLETE: Table: % | Policies: % | Functions: % | Indexes: %', 
                     CASE WHEN table_exists THEN '✓' ELSE '✗' END, 
                     policy_count, function_count, index_count;
    END IF;
END $$;

-- Show table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'currency', 'balance') 
        THEN '✓ Core' 
        WHEN column_name IN ('locked_balance', 'available_balance')
        THEN '○ Trading'
        ELSE '◦ Enhanced'
    END as field_type
FROM information_schema.columns 
WHERE table_name = 'portfolios' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;