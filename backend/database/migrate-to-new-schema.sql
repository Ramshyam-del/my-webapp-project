-- =====================================================
-- QUANTEX TRADING PLATFORM - MIGRATION SCRIPT
-- Safely migrate from old schema to new comprehensive schema
-- =====================================================

-- IMPORTANT: Run this script in a transaction and test thoroughly
-- before applying to production!

BEGIN;

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables for existing data
DO $$
BEGIN
    -- Backup existing users data if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        CREATE TABLE users_backup AS SELECT * FROM public.users;
        RAISE NOTICE 'Created backup: users_backup';
    END IF;
    
    -- Backup existing portfolios data if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolios' AND table_schema = 'public') THEN
        CREATE TABLE portfolios_backup AS SELECT * FROM portfolios;
        RAISE NOTICE 'Created backup: portfolios_backup';
    END IF;
    
    -- Backup existing trades data if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades' AND table_schema = 'public') THEN
        CREATE TABLE trades_backup AS SELECT * FROM trades;
        RAISE NOTICE 'Created backup: trades_backup';
    END IF;
    
    -- Backup existing fund_transactions data if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fund_transactions' AND table_schema = 'public') THEN
        CREATE TABLE fund_transactions_backup AS SELECT * FROM fund_transactions;
        RAISE NOTICE 'Created backup: fund_transactions_backup';
    END IF;
    
    RAISE NOTICE 'Backup phase completed';
END $$;

-- =====================================================
-- STEP 2: DROP EXISTING CONSTRAINTS AND INDEXES
-- =====================================================

-- Drop existing RLS policies if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    RAISE NOTICE 'Dropped existing RLS policies';
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
DROP TRIGGER IF EXISTS update_fund_transactions_updated_at ON fund_transactions;

-- =====================================================
-- STEP 3: APPLY NEW SCHEMA
-- =====================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create or replace utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- STEP 4: ENHANCE AUTH.USERS TABLE
-- =====================================================

-- Add new columns to auth.users if they don't exist
DO $$
BEGIN
    -- Add columns one by one with error handling
    BEGIN
        ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Column username already exists or error: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS first_name TEXT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Column first_name already exists or error: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_name TEXT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Column last_name already exists or error: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone TEXT;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Column phone already exists or error: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
        ALTER TABLE auth.users ADD CONSTRAINT check_user_role CHECK (role IN ('user', 'admin', 'super_admin', 'moderator'));
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Column role already exists or error: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
        ALTER TABLE auth.users ADD CONSTRAINT check_user_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen'));
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Column status already exists or error: %', SQLERRM;
    END;
    
    -- Add other essential columns
    ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN DEFAULT true;
    ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN DEFAULT true;
    ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT true;
    ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Enhanced auth.users table';
END $$;

-- =====================================================
-- STEP 5: CREATE/UPDATE PUBLIC.USERS TABLE
-- =====================================================

-- Drop existing public.users table if it exists and recreate with new structure
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

-- =====================================================
-- STEP 6: MIGRATE EXISTING USER DATA
-- =====================================================

DO $$
BEGIN
    -- Migrate data from backup if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup' AND table_schema = 'public') THEN
        INSERT INTO public.users (id, username, first_name, last_name, phone, role, status, created_at, updated_at)
        SELECT 
            id,
            COALESCE(username, email) as username,
            first_name,
            last_name,
            phone,
            COALESCE(role, 'user') as role,
            COALESCE(status, 'active') as status,
            COALESCE(created_at, NOW()) as created_at,
            COALESCE(updated_at, NOW()) as updated_at
        FROM users_backup
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            updated_at = NOW();
        
        RAISE NOTICE 'Migrated existing user data';
    ELSE
        -- Create users from auth.users if no backup exists
        INSERT INTO public.users (id, username, created_at, updated_at)
        SELECT 
            id,
            email as username,
            COALESCE(created_at, NOW()) as created_at,
            NOW() as updated_at
        FROM auth.users
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created user records from auth.users';
    END IF;
END $$;

-- =====================================================
-- STEP 7: CREATE/UPDATE PORTFOLIOS TABLE
-- =====================================================

-- Drop and recreate portfolios table with new structure
DROP TABLE IF EXISTS portfolios CASCADE;

CREATE TABLE portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB', 'ADA', 'DOT', 'LINK', 'LTC')),
    
    -- Enhanced precision for cryptocurrency
    balance NUMERIC(20,8) DEFAULT 0 CHECK (balance >= 0),
    locked_balance NUMERIC(20,8) DEFAULT 0 CHECK (locked_balance >= 0),
    available_balance NUMERIC(20,8) GENERATED ALWAYS AS (balance - locked_balance) STORED,
    
    -- Audit and tracking fields
    last_transaction_id UUID,
    last_updated_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, currency),
    CHECK (locked_balance <= balance),
    CHECK (available_balance >= 0)
);

-- Migrate existing portfolio data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolios_backup' AND table_schema = 'public') THEN
        INSERT INTO portfolios (user_id, currency, balance, locked_balance, created_at, updated_at)
        SELECT 
            user_id,
            currency,
            COALESCE(balance, 0)::NUMERIC(20,8) as balance,
            COALESCE(locked_balance, 0)::NUMERIC(20,8) as locked_balance,
            COALESCE(created_at, NOW()) as created_at,
            COALESCE(updated_at, NOW()) as updated_at
        FROM portfolios_backup
        ON CONFLICT (user_id, currency) DO UPDATE SET
            balance = EXCLUDED.balance,
            locked_balance = EXCLUDED.locked_balance,
            updated_at = NOW();
        
        RAISE NOTICE 'Migrated existing portfolio data';
    END IF;
END $$;

-- =====================================================
-- STEP 8: CREATE OTHER TABLES
-- =====================================================

-- Create crypto_pairs table
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

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pair_id UUID REFERENCES crypto_pairs(id),
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    price NUMERIC(20,8),
    stop_price NUMERIC(20,8),
    filled_amount NUMERIC(20,8) DEFAULT 0,
    remaining_amount NUMERIC(20,8) GENERATED ALWAYS AS (amount - filled_amount) STORED,
    average_price NUMERIC(20,8),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'filled', 'cancelled', 'expired', 'rejected')),
    time_in_force TEXT DEFAULT 'GTC' CHECK (time_in_force IN ('GTC', 'IOC', 'FOK')),
    expires_at TIMESTAMPTZ,
    fee_amount NUMERIC(20,8) DEFAULT 0,
    fee_currency TEXT,
    client_order_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (filled_amount <= amount),
    CHECK (remaining_amount >= 0)
);

-- Update existing trades table or create new one
DROP TABLE IF EXISTS trades CASCADE;

CREATE TABLE trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency_pair TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell', 'buy_up', 'buy_down', 'long', 'short')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    entry_price NUMERIC(20,8) NOT NULL CHECK (entry_price > 0),
    exit_price NUMERIC(20,8),
    leverage INTEGER DEFAULT 1 CHECK (leverage >= 1 AND leverage <= 100),
    duration_seconds INTEGER,
    expires_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired', 'liquidated')),
    pnl NUMERIC(20,8) DEFAULT 0.00000000,
    fee NUMERIC(20,8) DEFAULT 0.00000000,
    metadata JSONB DEFAULT '{}',
    stop_loss NUMERIC(20,8),
    take_profit NUMERIC(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Migrate existing trades data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trades_backup' AND table_schema = 'public') THEN
        INSERT INTO trades (user_id, currency_pair, trade_type, amount, entry_price, exit_price, leverage, status, pnl, fee, created_at, updated_at)
        SELECT 
            user_id,
            currency_pair,
            trade_type,
            amount::NUMERIC(20,8),
            entry_price::NUMERIC(20,8),
            exit_price::NUMERIC(20,8),
            COALESCE(leverage, 1)::INTEGER,
            COALESCE(status, 'active'),
            COALESCE(pnl, 0)::NUMERIC(20,8),
            COALESCE(fee, 0)::NUMERIC(20,8),
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM trades_backup;
        
        RAISE NOTICE 'Migrated existing trades data';
    END IF;
END $$;

-- Update existing fund_transactions table or create new one
DROP TABLE IF EXISTS fund_transactions CASCADE;

CREATE TABLE fund_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB', 'ADA', 'DOT', 'LINK', 'LTC')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'recharge', 'RECHARGE', 'WITHDRAW', 'bonus', 'penalty', 'trade_fee', 'referral')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')),
    transaction_reference TEXT,
    blockchain_tx_hash TEXT,
    remark TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    fee_amount NUMERIC(20,8) DEFAULT 0 CHECK (fee_amount >= 0),
    fee_currency TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    balance_before NUMERIC(20,8),
    balance_after NUMERIC(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Migrate existing fund_transactions data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fund_transactions_backup' AND table_schema = 'public') THEN
        INSERT INTO fund_transactions (user_id, currency, amount, type, status, remark, admin_id, created_by, created_at, updated_at)
        SELECT 
            user_id,
            currency,
            amount::NUMERIC(20,8),
            type,
            COALESCE(status, 'pending'),
            remark,
            admin_id,
            created_by,
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM fund_transactions_backup;
        
        RAISE NOTICE 'Migrated existing fund_transactions data';
    END IF;
END $$;

-- =====================================================
-- STEP 9: CREATE REMAINING TABLES
-- =====================================================

-- Create remaining tables (crypto_deposits, mining_payouts, etc.)
-- These are likely new tables, so we create them fresh

CREATE TABLE IF NOT EXISTS crypto_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USDC', 'BNB')),
    deposit_address TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    confirmations INTEGER DEFAULT 0 CHECK (confirmations >= 0),
    required_confirmations INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed', 'orphaned')),
    block_number BIGINT,
    block_hash TEXT,
    network TEXT NOT NULL,
    from_address TEXT,
    gas_fee NUMERIC(20,8) DEFAULT 0 CHECK (gas_fee >= 0),
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    confirmed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    credited_to_portfolio BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (confirmations <= required_confirmations OR status = 'completed')
);

CREATE TABLE IF NOT EXISTS mining_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR')),
    payout_amount NUMERIC(20,8) NOT NULL CHECK (payout_amount > 0),
    balance_before NUMERIC(20,8) NOT NULL,
    balance_after NUMERIC(20,8) NOT NULL,
    mining_period_start TIMESTAMPTZ,
    mining_period_end TIMESTAMPTZ,
    hash_rate NUMERIC(20,8),
    mining_pool TEXT,
    payout_date TIMESTAMPTZ DEFAULT NOW(),
    payout_method TEXT DEFAULT 'automatic' CHECK (payout_method IN ('automatic', 'manual')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (balance_after = balance_before + payout_amount)
);

CREATE TABLE IF NOT EXISTS operation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'user_management', 'financial', 'security', 'system')),
    target_user_id UUID REFERENCES auth.users(id),
    target_user_email TEXT,
    target_resource TEXT,
    target_resource_id UUID,
    details TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'trade', 'deposit', 'withdrawal', 'profile_update', 'password_change', 'kyc_submission')),
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB,
    metadata JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'trading', 'security', 'fees', 'limits', 'notifications')),
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    requires_restart BOOLEAN DEFAULT FALSE,
    validation_rules JSONB,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- STEP 10: CREATE BALANCE ADJUSTMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION adjust_balance(
    p_user_id UUID,
    p_currency TEXT,
    p_amount NUMERIC,
    p_transaction_id UUID DEFAULT NULL,
    p_updated_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_portfolio_id UUID;
    v_result JSONB;
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL OR p_currency IS NULL OR p_amount IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid parameters: user_id, currency, and amount are required'
        );
    END IF;
    
    -- Lock the portfolio row for update
    SELECT id, balance INTO v_portfolio_id, v_current_balance
    FROM portfolios
    WHERE user_id = p_user_id AND currency = p_currency
    FOR UPDATE;
    
    -- Create portfolio if it doesn't exist
    IF v_portfolio_id IS NULL THEN
        INSERT INTO portfolios (user_id, currency, balance, last_transaction_id, last_updated_by)
        VALUES (p_user_id, p_currency, GREATEST(p_amount, 0), p_transaction_id, p_updated_by)
        RETURNING id, balance INTO v_portfolio_id, v_new_balance;
        
        v_current_balance := 0;
    ELSE
        -- Calculate new balance
        v_new_balance := v_current_balance + p_amount;
        
        -- Prevent negative balance
        IF v_new_balance < 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient balance',
                'current_balance', v_current_balance,
                'requested_amount', p_amount,
                'resulting_balance', v_new_balance
            );
        END IF;
        
        -- Update the balance
        UPDATE portfolios
        SET 
            balance = v_new_balance,
            last_transaction_id = COALESCE(p_transaction_id, last_transaction_id),
            last_updated_by = COALESCE(p_updated_by, last_updated_by),
            updated_at = NOW()
        WHERE id = v_portfolio_id;
    END IF;
    
    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'portfolio_id', v_portfolio_id,
        'currency', p_currency,
        'previous_balance', v_current_balance,
        'adjustment_amount', p_amount,
        'new_balance', v_new_balance
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 11: CREATE INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Portfolios table indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON portfolios(currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_balance ON portfolios(balance) WHERE balance > 0;

-- Trading table indexes
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_symbol ON crypto_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_active ON crypto_pairs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at DESC);

-- =====================================================
-- STEP 12: CREATE TRIGGERS
-- =====================================================

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at 
    BEFORE UPDATE ON portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_pairs_updated_at 
    BEFORE UPDATE ON crypto_pairs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fund_transactions_updated_at 
    BEFORE UPDATE ON fund_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 13: ENABLE RLS AND CREATE POLICIES
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

-- Create essential RLS policies
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all users" ON public.users 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Users can view own portfolios" ON portfolios 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Service role can manage portfolios" ON portfolios 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view active crypto pairs" ON crypto_pairs 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own trades" ON trades 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Users can create own trades" ON trades 
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 14: INSERT DEFAULT DATA
-- =====================================================

-- Insert default crypto pairs
INSERT INTO crypto_pairs (symbol, base_currency, quote_currency, is_active, min_trade_amount, max_trade_amount) VALUES
('BTCUSDT', 'BTC', 'USDT', true, 0.00001000, 1000.00000000),
('ETHUSDT', 'ETH', 'USDT', true, 0.00100000, 10000.00000000),
('ADAUSDT', 'ADA', 'USDT', true, 1.00000000, 1000000.00000000),
('DOTUSDT', 'DOT', 'USDT', true, 0.10000000, 100000.00000000),
('LINKUSDT', 'LINK', 'USDT', true, 0.10000000, 100000.00000000),
('LTCUSDT', 'LTC', 'USDT', true, 0.01000000, 10000.00000000),
('BNBUSDT', 'BNB', 'USDT', true, 0.01000000, 10000.00000000),
('USDCUSDT', 'USDC', 'USDT', true, 1.00000000, 1000000.00000000)
ON CONFLICT (symbol) DO NOTHING;

-- Insert default configurations
INSERT INTO configurations (key, value, description, category, is_public) VALUES
('platform_name', '"Quantex Trading Platform"', 'Platform display name', 'general', true),
('trading_enabled', 'true', 'Global trading enable/disable', 'trading', false),
('maintenance_mode', 'false', 'Platform maintenance mode', 'system', true),
('default_leverage_limit', '10', 'Default maximum leverage for new users', 'trading', false),
('min_withdrawal_amount', '{"BTC": 0.001, "ETH": 0.01, "USDT": 10}', 'Minimum withdrawal amounts by currency', 'limits', true),
('max_daily_withdrawal', '{"standard": 1000, "premium": 10000, "vip": 100000}', 'Maximum daily withdrawal by account type', 'limits', false),
('trading_fees', '{"maker": 0.001, "taker": 0.001}', 'Trading fee structure', 'fees', true),
('supported_currencies', '["BTC", "ETH", "USDT", "USD", "EUR", "USDC", "BNB", "ADA", "DOT", "LINK", "LTC"]', 'List of supported currencies', 'general', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- STEP 15: CLEANUP AND VERIFICATION
-- =====================================================

-- Verify migration success
DO $$
DECLARE
    table_count INTEGER;
    user_count INTEGER;
    portfolio_count INTEGER;
    trade_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'portfolios', 'crypto_pairs', 'trades', 'orders', 'fund_transactions', 'crypto_deposits', 'mining_payouts', 'operation_logs', 'user_activities', 'configurations');
    
    -- Count migrated data
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO portfolio_count FROM portfolios;
    SELECT COUNT(*) INTO trade_count FROM trades;
    
    -- Output migration summary
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Tables created/updated: % (expected: 11)', table_count;
    RAISE NOTICE 'Users migrated: %', user_count;
    RAISE NOTICE 'Portfolios migrated: %', portfolio_count;
    RAISE NOTICE 'Trades migrated: %', trade_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Backup tables created (if data existed):';
    RAISE NOTICE '- users_backup';
    RAISE NOTICE '- portfolios_backup';
    RAISE NOTICE '- trades_backup';
    RAISE NOTICE '- fund_transactions_backup';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test your application thoroughly';
    RAISE NOTICE '2. Update API endpoints to use new schema';
    RAISE NOTICE '3. Drop backup tables when confident: DROP TABLE users_backup, portfolios_backup, etc.';
    RAISE NOTICE '4. Update user roles as needed';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
END $$;

-- Commit the transaction
COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================

/*
POST-MIGRATION CHECKLIST:

1. VERIFY DATA INTEGRITY:
   - Check that all users were migrated correctly
   - Verify portfolio balances are accurate
   - Confirm trades and transactions are intact

2. UPDATE APPLICATION CODE:
   - Update API endpoints to use new table structure
   - Modify queries to use new column names
   - Update authentication logic for new user roles

3. TEST FUNCTIONALITY:
   - Test user registration and login
   - Test trading operations
   - Test deposit/withdrawal flows
   - Test admin functions

4. PERFORMANCE MONITORING:
   - Monitor query performance with new indexes
   - Check RLS policy performance
   - Optimize queries as needed

5. CLEANUP (AFTER TESTING):
   - Drop backup tables: DROP TABLE users_backup, portfolios_backup, etc.
   - Remove old unused columns if any
   - Update documentation

6. SECURITY REVIEW:
   - Verify RLS policies are working correctly
   - Test user access permissions
   - Review admin access controls
*/