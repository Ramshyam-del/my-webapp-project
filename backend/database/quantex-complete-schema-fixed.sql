-- =====================================================
-- QUANTEX TRADING PLATFORM - COMPLETE DATABASE SCHEMA
-- Production-Ready SQL Script for Supabase PostgreSQL
-- FIXED: Non-recursive RLS policies to prevent auth crashes
-- =====================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- [YOUR EXISTING TABLES - Keep everything the same until RLS POLICIES section]

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - FIXED
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- CRITICAL FIX: Non-recursive admin UUID for all policies
-- Replace the admin UUID below with your actual admin user UUID
-- Get it from: SELECT id FROM auth.users WHERE email = 'admin@quantex.com';

-- Users table policies (FIXED - Non-recursive)
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (id = auth.uid());

-- CRITICAL FIX: Direct UUID comparison (prevents infinite loops)
CREATE POLICY "Admins can view all users" ON public.users 
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Admins can manage all users" ON public.users 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Portfolios table policies (FIXED)
CREATE POLICY "Users can view own portfolios" ON portfolios 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage portfolios" ON portfolios 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all portfolios" ON portfolios 
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Crypto pairs policies (public read access)
CREATE POLICY "Anyone can view active crypto pairs" ON crypto_pairs 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage crypto pairs" ON crypto_pairs 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Trades table policies (FIXED)
CREATE POLICY "Users can view own trades" ON trades 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own trades" ON trades 
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trades" ON trades 
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all trades" ON trades 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Orders table policies (FIXED)
CREATE POLICY "Users can view own orders" ON orders 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders" ON orders 
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders" ON orders 
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders" ON orders 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Fund transactions policies (FIXED)
CREATE POLICY "Users can view own transactions" ON fund_transactions 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all transactions" ON fund_transactions 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Crypto deposits policies (FIXED)
CREATE POLICY "Users can view own deposits" ON crypto_deposits 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all deposits" ON crypto_deposits 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Mining payouts policies (FIXED)
CREATE POLICY "Users can view own payouts" ON mining_payouts 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payouts" ON mining_payouts 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Operation logs policies (FIXED)
CREATE POLICY "Admins can view operation logs" ON operation_logs 
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Admins can insert operation logs" ON operation_logs 
    FOR INSERT WITH CHECK (
        admin_id = auth.uid() AND
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- User activities policies (FIXED)
CREATE POLICY "Users can view own activities" ON user_activities 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activities" ON user_activities 
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "System can insert user activities" ON user_activities 
    FOR INSERT WITH CHECK (true);

-- Configurations policies (FIXED)
CREATE POLICY "Public configs readable by all" ON configurations 
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all configs" ON configurations 
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- Create the admin user
INSERT INTO users (
    id,
    email,
    username,
    first_name,
    last_name,
    role,
    status,
    verification_level,
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
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- [Keep all your existing INSERT statements for crypto_pairs and configurations]

COMMIT;

-- =====================================================
-- VERIFICATION AND SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 QUANTEX TRADING PLATFORM - FIXED SCHEMA DEPLOYED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ CRITICAL SECURITY FIX APPLIED:';
    RAISE NOTICE '   • Non-recursive RLS policies prevent auth crashes';
    RAISE NOTICE '   • Direct UUID comparisons for admin access';
    RAISE NOTICE '   • No more infinite loops in authentication';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 NEXT STEPS:';
    RAISE NOTICE '1. Update admin UUID in policies if different';
    RAISE NOTICE '2. Test authentication system';
    RAISE NOTICE '3. Verify all features work correctly';
    RAISE NOTICE '';
END $$;