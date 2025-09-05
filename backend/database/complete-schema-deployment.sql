-- COMPLETE SCHEMA DEPLOYMENT SCRIPT
-- This script ensures all tables exist with correct structure including status columns
-- Run this script in Supabase SQL Editor to resolve all schema issues

-- =====================================================
-- STEP 1: ENSURE USERS TABLE WITH STATUS COLUMN
-- =====================================================

-- Drop and recreate users table with complete structure
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'moderator')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen')),
    account_type VARCHAR(50) DEFAULT 'standard' CHECK (account_type IN ('standard', 'premium', 'vip', 'demo')),
    verification_level VARCHAR(50) DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'email_verified', 'phone_verified', 'kyc_pending', 'kyc_verified', 'enhanced_verified')),
    
    -- Trading permissions
    trading_enabled BOOLEAN DEFAULT true,
    withdrawal_enabled BOOLEAN DEFAULT true,
    deposit_enabled BOOLEAN DEFAULT true,
    max_daily_withdrawal NUMERIC(20,8) DEFAULT 1000.00,
    max_daily_deposit NUMERIC(20,8) DEFAULT 50000.00,
    
    -- Security and tracking
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    
    -- KYC and compliance
    kyc_verified_at TIMESTAMPTZ,
    document_verification_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (document_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected', 'expired')),
    country_code VARCHAR(3),
    date_of_birth DATE,
    address JSONB,
    
    -- Trading preferences
    risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    trading_experience VARCHAR(20) DEFAULT 'beginner' CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
    leverage_limit NUMERIC(5,2) DEFAULT 1.00,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Admin tracking
    status_changed_by UUID REFERENCES auth.users(id),
    status_changed_at TIMESTAMPTZ,
    status_change_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(id); -- id is linked to auth.users email
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at);

-- =====================================================
-- STEP 2: CREATE OTHER ESSENTIAL TABLES
-- =====================================================

-- Portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    balance NUMERIC(20,8) DEFAULT 0.00 NOT NULL,
    locked_balance NUMERIC(20,8) DEFAULT 0.00 NOT NULL,
    total_deposited NUMERIC(20,8) DEFAULT 0.00 NOT NULL,
    total_withdrawn NUMERIC(20,8) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, currency)
);

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency_pair VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    amount NUMERIC(20,8) NOT NULL,
    entry_price NUMERIC(20,8) NOT NULL,
    exit_price NUMERIC(20,8),
    leverage NUMERIC(5,2) DEFAULT 1.00,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    pnl NUMERIC(20,8) DEFAULT 0.00,
    fee NUMERIC(20,8) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    closed_at TIMESTAMPTZ
);

-- Fund transactions table
CREATE TABLE IF NOT EXISTS public.fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(20,8) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bonus', 'fee', 'trade_profit', 'trade_loss')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    remark TEXT,
    admin_id UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- STEP 3: CREATE AUTH TRIGGER FUNCTION
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the updated trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user with proper metadata extraction and conflict handling
    INSERT INTO public.users (id, username, first_name, last_name, phone, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'username')::text, 
                 SPLIT_PART(NEW.email, '@', 1)), -- Generate username from email if not provided
        COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'phone')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user'), -- Default to 'user' role
        'active', -- Set status to active for new users
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        username = CASE 
            WHEN users.username IS NULL OR users.username = '' 
            THEN EXCLUDED.username 
            ELSE users.username 
        END,
        first_name = CASE 
            WHEN users.first_name IS NULL OR users.first_name = '' 
            THEN EXCLUDED.first_name 
            ELSE users.first_name 
        END,
        last_name = CASE 
            WHEN users.last_name IS NULL OR users.last_name = '' 
            THEN EXCLUDED.last_name 
            ELSE users.last_name 
        END,
        phone = CASE 
            WHEN users.phone IS NULL OR users.phone = '' 
            THEN EXCLUDED.phone 
            ELSE users.phone 
        END,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for portfolios
CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for trades
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for fund_transactions
CREATE POLICY "Users can view own transactions" ON public.fund_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.fund_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 5: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.portfolios TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.trades TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.fund_transactions TO authenticated;

-- Grant permissions to service role (for admin operations)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.portfolios TO service_role;
GRANT ALL ON public.trades TO service_role;
GRANT ALL ON public.fund_transactions TO service_role;

-- =====================================================
-- STEP 6: VERIFICATION QUERIES
-- =====================================================

-- Verify the status column exists
SELECT 'Status column exists in public.users' as check_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'status'
);

-- Test the trigger function
SELECT 'Trigger function exists' as check_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
);

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

SELECT 'Complete schema deployment finished successfully' as final_result;