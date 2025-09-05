-- =====================================================
-- QUANTEX TRADING PLATFORM - PART 4 of 4
-- RLS Policies & Auth System (Final Part)
-- =====================================================

-- =====================================================
-- ENHANCED AUTH TRIGGER SYSTEM
-- =====================================================

-- Enhanced handle_new_user trigger function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user profile with conflict handling and smart username generation
    INSERT INTO public.users (
        id,
        email,
        username,
        first_name,
        last_name,
        phone,
        role,
        status,
        verification_level,
        trading_enabled,
        withdrawal_enabled,
        deposit_enabled,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'username', ''), 
            SPLIT_PART(NEW.email, '@', 1) || '_' || EXTRACT(epoch FROM NOW())::INTEGER::TEXT
        ), -- Generate unique username from email with timestamp
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'), -- Default role
        'active', -- Default status for new users
        'email_verified', -- Default verification level
        true, -- Trading enabled by default
        true, -- Withdrawal enabled by default
        true, -- Deposit enabled by default
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = CASE 
            WHEN EXCLUDED.username IS NOT NULL AND EXCLUDED.username != '' 
            THEN EXCLUDED.username 
            ELSE users.username 
        END,
        first_name = CASE 
            WHEN EXCLUDED.first_name IS NOT NULL AND EXCLUDED.first_name != '' 
            THEN EXCLUDED.first_name 
            ELSE users.first_name 
        END,
        last_name = CASE 
            WHEN EXCLUDED.last_name IS NOT NULL AND EXCLUDED.last_name != '' 
            THEN EXCLUDED.last_name 
            ELSE users.last_name 
        END,
        phone = CASE 
            WHEN EXCLUDED.phone IS NOT NULL AND EXCLUDED.phone != '' 
            THEN EXCLUDED.phone 
            ELSE users.phone 
        END,
        updated_at = NOW();

    -- Log user registration activity
    INSERT INTO user_activities (
        user_id,
        user_email,
        activity_type,
        activity_description,
        metadata
    ) VALUES (
        NEW.id,
        NEW.email,
        'registration',
        'User account created successfully',
        jsonb_build_object(
            'signup_method', COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
            'confirmed_at', NEW.confirmed_at
        )
    );
    
    RETURN NEW;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE WARNING 'Unique constraint violation for user: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
    WHEN foreign_key_violation THEN
        RAISE WARNING 'Foreign key violation for user: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
    WHEN others THEN
        RAISE WARNING 'Error in handle_new_user trigger for: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMPREHENSIVE RLS POLICIES (NON-RECURSIVE)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_monitoring_config ENABLE ROW LEVEL SECURITY;

-- Clean up any existing conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- USERS TABLE POLICIES (CRITICAL: NON-RECURSIVE)
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- CRITICAL FIX: Direct UUID comparison for admin access (prevents infinite loops)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Service role full access
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- PORTFOLIOS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Admins can view all portfolios" ON portfolios;
DROP POLICY IF EXISTS "Service role can manage portfolios" ON portfolios;

CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own portfolios" ON portfolios
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all portfolios" ON portfolios
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage portfolios" ON portfolios
    FOR ALL USING (auth.role() = 'service_role');

-- FUND_TRANSACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own fund transactions" ON fund_transactions;
DROP POLICY IF EXISTS "Admins can view all fund transactions" ON fund_transactions;
DROP POLICY IF EXISTS "Service role can manage fund transactions" ON fund_transactions;

CREATE POLICY "Users can view own fund transactions" ON fund_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all fund transactions" ON fund_transactions
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage fund transactions" ON fund_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- CRYPTO_DEPOSITS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own crypto deposits" ON crypto_deposits;
DROP POLICY IF EXISTS "Admins can view all crypto deposits" ON crypto_deposits;
DROP POLICY IF EXISTS "Service role can manage crypto deposits" ON crypto_deposits;

CREATE POLICY "Users can view own crypto deposits" ON crypto_deposits
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all crypto deposits" ON crypto_deposits
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage crypto deposits" ON crypto_deposits
    FOR ALL USING (auth.role() = 'service_role');

-- USER_WALLET_ADDRESSES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own wallet addresses" ON user_wallet_addresses;
DROP POLICY IF EXISTS "Users can insert own wallet addresses" ON user_wallet_addresses;
DROP POLICY IF EXISTS "Admins can view all wallet addresses" ON user_wallet_addresses;
DROP POLICY IF EXISTS "Service role can manage wallet addresses" ON user_wallet_addresses;

CREATE POLICY "Users can view own wallet addresses" ON user_wallet_addresses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet addresses" ON user_wallet_addresses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all wallet addresses" ON user_wallet_addresses
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage wallet addresses" ON user_wallet_addresses
    FOR ALL USING (auth.role() = 'service_role');

-- USER_ACTIVITIES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON user_activities;
DROP POLICY IF EXISTS "Service role full access" ON user_activities;

CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activities" ON user_activities
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "System can insert activities" ON user_activities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access" ON user_activities
    FOR ALL USING (auth.role() = 'service_role');

-- DEPOSIT_MONITORING_CONFIG TABLE POLICIES
DROP POLICY IF EXISTS "Admins can manage monitoring config" ON deposit_monitoring_config;
DROP POLICY IF EXISTS "Service role can manage monitoring config" ON deposit_monitoring_config;

CREATE POLICY "Admins can manage monitoring config" ON deposit_monitoring_config
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage monitoring config" ON deposit_monitoring_config
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- ATOMIC BALANCE ADJUSTMENT FUNCTION
-- =====================================================

-- Production-ready balance adjustment with row-level locking
CREATE OR REPLACE FUNCTION adjust_user_balance(
    p_user_id UUID,
    p_currency TEXT,
    p_amount NUMERIC(20,8),
    p_operation_type TEXT DEFAULT 'adjustment',
    p_reference TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    new_balance NUMERIC(20,8),
    message TEXT
) AS $$
DECLARE
    current_balance NUMERIC(20,8);
    new_bal NUMERIC(20,8);
    fund_tx_id UUID;
BEGIN
    -- Validate inputs
    IF p_amount = 0 THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC(20,8), 'Amount cannot be zero';
        RETURN;
    END IF;
    
    IF p_currency NOT IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB') THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC(20,8), 'Invalid currency';
        RETURN;
    END IF;
    
    -- Lock and get current balance (atomic operation)
    SELECT balance INTO current_balance 
    FROM portfolios 
    WHERE user_id = p_user_id AND currency = p_currency
    FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Create new portfolio if doesn't exist
        INSERT INTO portfolios (user_id, currency, balance, available_balance)
        VALUES (p_user_id, p_currency, p_amount, p_amount)
        RETURNING balance INTO new_bal;
        
        new_balance := new_bal;
    ELSE
        -- Calculate new balance
        new_bal := current_balance + p_amount;
        
        -- Prevent negative balances for withdrawals
        IF new_bal < 0 AND p_amount < 0 THEN
            RETURN QUERY SELECT FALSE, current_balance, 'Insufficient balance';
            RETURN;
        END IF;
        
        -- Update balance atomically
        UPDATE portfolios 
        SET 
            balance = new_bal,
            available_balance = new_bal,
            updated_at = NOW()
        WHERE user_id = p_user_id AND currency = p_currency;
        
        new_balance := new_bal;
    END IF;
    
    -- Log the transaction
    INSERT INTO fund_transactions (
        user_id,
        currency,
        amount,
        type,
        status,
        transaction_reference,
        admin_id,
        remark,
        created_by
    ) VALUES (
        p_user_id,
        p_currency,
        p_amount,
        p_operation_type,
        'completed',
        p_reference,
        p_admin_id,
        'Balance adjustment: ' || p_amount || ' ' || p_currency,
        'system'
    ) RETURNING id INTO fund_tx_id;
    
    -- Log user activity
    INSERT INTO user_activities (
        user_id,
        user_email,
        activity_type,
        activity_description,
        admin_user_id,
        metadata
    ) VALUES (
        p_user_id,
        (SELECT email FROM users WHERE id = p_user_id),
        'balance_adjusted',
        'Balance adjusted by ' || p_amount || ' ' || p_currency,
        p_admin_id,
        jsonb_build_object(
            'currency', p_currency,
            'amount', p_amount,
            'old_balance', current_balance,
            'new_balance', new_balance,
            'transaction_id', fund_tx_id
        )
    );
    
    RETURN QUERY SELECT TRUE, new_balance, 'Balance adjusted successfully';
    
EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC(20,8), 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION adjust_user_balance TO service_role;

-- =====================================================
-- ADMIN USER CREATION
-- =====================================================

-- Create the admin user if it doesn't exist (using the UUID from policies)
INSERT INTO users (
    id,
    email,
    username,
    first_name,
    last_name,
    role,
    status,
    verification_level,
    trading_enabled,
    withdrawal_enabled,
    deposit_enabled,
    created_at,
    updated_at
) VALUES (
    '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid,
    'admin@quantex.com',
    'quantex_admin',
    'System',
    'Administrator',
    'admin',
    'active',
    'kyc_verified',
    false, -- Admin doesn't need trading
    false,
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- =====================================================
-- FINAL PERMISSIONS & GRANTS
-- =====================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portfolios TO authenticated;
GRANT SELECT, INSERT ON fund_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON crypto_deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_wallet_addresses TO authenticated;
GRANT SELECT, INSERT ON user_activities TO authenticated;
GRANT SELECT ON deposit_monitoring_config TO authenticated;

-- Service role gets full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

COMMIT;

-- =====================================================
-- FINAL COMPREHENSIVE VERIFICATION
-- =====================================================

DO $$
DECLARE
    tables_rls_enabled INTEGER;
    total_policies INTEGER;
    auth_trigger_exists BOOLEAN;
    admin_user_exists BOOLEAN;
    monitoring_configs INTEGER;
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO tables_rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relrowsecurity = true 
    AND n.nspname = 'public'
    AND c.relname IN ('users', 'portfolios', 'fund_transactions', 'crypto_deposits', 'user_wallet_addresses', 'user_activities', 'deposit_monitoring_config');
    
    -- Count total policies
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies 
    WHERE tablename IN ('users', 'portfolios', 'fund_transactions', 'crypto_deposits', 'user_wallet_addresses', 'user_activities', 'deposit_monitoring_config');
    
    -- Check auth trigger
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) INTO auth_trigger_exists;
    
    -- Check admin user
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE id = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid 
        AND role = 'admin'
    ) INTO admin_user_exists;
    
    -- Check monitoring configs
    SELECT COUNT(*) INTO monitoring_configs FROM deposit_monitoring_config;
    
    -- Final status report
    IF tables_rls_enabled >= 7 AND total_policies >= 20 AND auth_trigger_exists AND admin_user_exists AND monitoring_configs >= 3 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉🎉🎉 QUANTEX TRADING PLATFORM - DEPLOYMENT COMPLETE! 🎉🎉🎉';
        RAISE NOTICE '';
        RAISE NOTICE '✅ PART 4 COMPLETE: RLS Policies & Auth System';
        RAISE NOTICE '   RLS Tables: % | Policies: % | Auth Trigger: ✓', tables_rls_enabled, total_policies;
        RAISE NOTICE '   Admin User: ✓ | Monitoring Configs: %', monitoring_configs;
        RAISE NOTICE '';
        RAISE NOTICE '🛡️  SECURITY FEATURES:';
        RAISE NOTICE '   • Non-recursive RLS policies (prevents auth crashes)';
        RAISE NOTICE '   • Row-level security on all sensitive tables';
        RAISE NOTICE '   • Atomic balance operations with locking';
        RAISE NOTICE '   • Comprehensive audit trails';
        RAISE NOTICE '';
        RAISE NOTICE '💰 FINANCIAL FEATURES:';
        RAISE NOTICE '   • High-precision cryptocurrency handling (NUMERIC 20,8)';
        RAISE NOTICE '   • Multi-currency portfolio management';
        RAISE NOTICE '   • Blockchain deposit monitoring';
        RAISE NOTICE '   • Atomic fund transactions';
        RAISE NOTICE '';
        RAISE NOTICE '👤 USER MANAGEMENT:';
        RAISE NOTICE '   • Enhanced user profiles with KYC';
        RAISE NOTICE '   • Trading permissions and limits';
        RAISE NOTICE '   • Account status management';
        RAISE NOTICE '   • Activity logging and monitoring';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 PRODUCTION-READY DATABASE SCHEMA DEPLOYED SUCCESSFULLY!';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING '';
        RAISE WARNING '❌ INCOMPLETE DEPLOYMENT:';
        RAISE WARNING '   RLS Tables: % (expected 7+)', tables_rls_enabled;
        RAISE WARNING '   Policies: % (expected 20+)', total_policies;
        RAISE WARNING '   Auth Trigger: %', CASE WHEN auth_trigger_exists THEN '✓' ELSE '✗' END;
        RAISE WARNING '   Admin User: %', CASE WHEN admin_user_exists THEN '✓' ELSE '✗' END;
        RAISE WARNING '   Monitoring Configs: % (expected 3+)', monitoring_configs;
        RAISE WARNING '';
    END IF;
END $$;

-- Summary of all created components
SELECT 
    'Database Schema Summary' as component,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as rls_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_created,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions_created;