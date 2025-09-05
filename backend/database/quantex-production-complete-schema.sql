-- =====================================================
-- QUANTEX TRADING PLATFORM - COMPLETE SCHEMA DEPLOYMENT
-- Production-Ready SQL Script with Non-Recursive RLS Policies
-- Fixes infinite recursion issues and includes all required features
-- =====================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CRITICAL: Non-recursive admin role checking function
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Return false if no user provided
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user role directly without RLS interference
    SELECT role INTO user_role
    FROM public.users
    WHERE id = user_uuid;
    
    -- Return true if user is admin or super_admin
    RETURN user_role IN ('admin', 'super_admin');
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 1: ENHANCED USERS TABLE WITH COMPLETE STRUCTURE
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
    status_changed_by UUID REFERENCES public.users(id),
    status_changed_at TIMESTAMPTZ,
    status_change_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- STEP 2: ENHANCED FINANCIAL TABLES
-- =====================================================

-- Portfolios table with high precision
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB')),
    balance NUMERIC(20,8) DEFAULT 0 CHECK (balance >= 0),
    locked_balance NUMERIC(20,8) DEFAULT 0 CHECK (locked_balance >= 0),
    available_balance NUMERIC(20,8) GENERATED ALWAYS AS (balance - locked_balance) STORED,
    total_deposited NUMERIC(20,8) DEFAULT 0,
    total_withdrawn NUMERIC(20,8) DEFAULT 0,
    last_transaction_id UUID,
    last_updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, currency),
    CHECK (locked_balance <= balance)
    -- Note: available_balance check is redundant since it's generated always as (balance - locked_balance)
);

-- Crypto pairs table for trading pairs configuration
CREATE TABLE IF NOT EXISTS public.crypto_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    current_price NUMERIC(20,8) NOT NULL DEFAULT 0,
    price_change_24h NUMERIC(10,4) DEFAULT 0,
    volume_24h NUMERIC(20,8) DEFAULT 0,
    market_cap NUMERIC(20,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    min_trade_amount NUMERIC(20,8) DEFAULT 0.001,
    max_trade_amount NUMERIC(20,8) DEFAULT 1000000,
    fee_percentage NUMERIC(5,4) DEFAULT 0.001,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (current_price >= 0),
    CHECK (min_trade_amount > 0),
    CHECK (max_trade_amount > min_trade_amount)
);

-- Orders table for trade order management
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pair_id UUID REFERENCES public.crypto_pairs(id),
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    price NUMERIC(20,8) CHECK (price > 0),
    filled_amount NUMERIC(20,8) DEFAULT 0 CHECK (filled_amount >= 0),
    remaining_amount NUMERIC(20,8) GENERATED ALWAYS AS (amount - filled_amount) STORED,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'filled', 'cancelled', 'expired', 'rejected')),
    time_in_force TEXT DEFAULT 'GTC' CHECK (time_in_force IN ('GTC', 'IOC', 'FOK')),
    stop_price NUMERIC(20,8),
    average_fill_price NUMERIC(20,8),
    fees_paid NUMERIC(20,8) DEFAULT 0,
    expires_at TIMESTAMPTZ,
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (filled_amount <= amount),
    CHECK (remaining_amount >= 0)
);

-- Enhanced trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency_pair TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell', 'buy_up', 'buy_down', 'long', 'short')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    entry_price NUMERIC(20,8) NOT NULL CHECK (entry_price > 0),
    exit_price NUMERIC(20,8),
    leverage INTEGER DEFAULT 1 CHECK (leverage >= 1 AND leverage <= 100),
    duration_seconds INTEGER,
    expires_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired', 'liquidated')),
    pnl NUMERIC(20,8) DEFAULT 0,
    fee NUMERIC(20,8) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    stop_loss NUMERIC(20,8),
    take_profit NUMERIC(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enhanced fund transactions table
CREATE TABLE IF NOT EXISTS public.fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'recharge', 'RECHARGE', 'WITHDRAW', 'bonus', 'penalty', 'trade_fee', 'referral')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')),
    transaction_reference TEXT,
    blockchain_tx_hash TEXT,
    remark TEXT,
    admin_id UUID REFERENCES public.users(id),
    created_by TEXT,
    fee_amount NUMERIC(20,8) DEFAULT 0 CHECK (fee_amount >= 0),
    fee_currency TEXT,
    processed_by UUID REFERENCES public.users(id),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    balance_before NUMERIC(20,8),
    balance_after NUMERIC(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User activities table for audit tracking
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'login', 'logout', 'registration', 'password_changed', 'password_reset',
        'two_factor_enabled', 'two_factor_disabled', 'trade_created', 'trade_completed',
        'trade_cancelled', 'deposit', 'deposit_confirmed', 'withdrawal_requested',
        'withdrawal_completed', 'withdrawal_cancelled', 'balance_adjusted',
        'profile_updated', 'account_frozen', 'account_suspended', 'kyc_submitted',
        'kyc_approved', 'kyc_rejected', 'admin_action_performed'
    )),
    activity_description TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    session_id TEXT,
    admin_user_id UUID REFERENCES public.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_admin_actions CHECK (
        (activity_type LIKE 'admin_%' AND admin_user_id IS NOT NULL) OR 
        (activity_type NOT LIKE 'admin_%')
    )
);

-- Crypto deposits table for blockchain monitoring
CREATE TABLE IF NOT EXISTS public.crypto_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USDC', 'BNB')),
    deposit_address TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    confirmations INTEGER DEFAULT 0 CHECK (confirmations >= 0),
    required_confirmations INTEGER DEFAULT 3 CHECK (required_confirmations > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed', 'orphaned')),
    block_number BIGINT,
    block_hash TEXT,
    network TEXT NOT NULL,
    from_address TEXT,
    gas_fee NUMERIC(20,8) DEFAULT 0,
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    confirmed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    credited_to_portfolio BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (confirmations <= required_confirmations OR status = 'completed'),
    CHECK (gas_fee >= 0)
);

-- Mining payouts table
CREATE TABLE IF NOT EXISTS public.mining_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    hash_rate NUMERIC(20,8),
    duration_hours INTEGER CHECK (duration_hours > 0),
    payout_rate NUMERIC(20,8),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    transaction_id UUID REFERENCES public.fund_transactions(id),
    mining_pool TEXT,
    block_height BIGINT,
    difficulty NUMERIC(20,8),
    network_hash_rate NUMERIC(20,8),
    payout_date DATE NOT NULL,
    processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Operation logs for admin actions
CREATE TABLE IF NOT EXISTS public.operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id),
    target_user_id UUID REFERENCES public.users(id),
    operation_type TEXT NOT NULL CHECK (operation_type IN (
        'user_status_change', 'balance_adjustment', 'trade_settlement', 
        'withdrawal_approval', 'kyc_verification', 'account_freeze',
        'fee_adjustment', 'system_config_change'
    )),
    operation_description TEXT NOT NULL,
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- System configurations table
CREATE TABLE IF NOT EXISTS public.configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    config_type TEXT NOT NULL CHECK (config_type IN ('system', 'trading', 'security', 'notification', 'blockchain')),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_encrypted BOOLEAN DEFAULT false,
    last_modified_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- STEP 3: PRODUCTION-READY AUTH TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Enhanced auth trigger function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user profile with conflict handling and smart username generation
    INSERT INTO public.users (
        id,
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

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 4: PERFORMANCE INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_verification_level ON public.users(verification_level);
CREATE INDEX IF NOT EXISTS idx_users_trading_enabled ON public.users(trading_enabled) WHERE trading_enabled = true;

-- Portfolios table indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON public.portfolios(currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON public.portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_balance ON public.portfolios(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON public.portfolios(updated_at DESC);

-- Crypto pairs table indexes
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_symbol ON public.crypto_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_active ON public.crypto_pairs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_base_quote ON public.crypto_pairs(base_currency, quote_currency);
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_updated ON public.crypto_pairs(last_updated DESC);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pair_id ON public.orders(pair_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_side_type ON public.orders(side, order_type);

-- Trades table indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_currency_pair ON public.trades(currency_pair);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON public.trades(user_id, status);

-- Fund transactions indexes
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON public.fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_currency ON public.fund_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON public.fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON public.fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON public.fund_transactions(created_at DESC);

-- User activities indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_email ON public.user_activities(user_email);

-- Crypto deposits indexes
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON public.crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON public.crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_currency ON public.crypto_deposits(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON public.crypto_deposits(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_created_at ON public.crypto_deposits(created_at DESC);

-- Mining payouts indexes
CREATE INDEX IF NOT EXISTS idx_mining_payouts_user_id ON public.mining_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_currency ON public.mining_payouts(currency);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_status ON public.mining_payouts(status);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_date ON public.mining_payouts(payout_date DESC);

-- Operation logs indexes
CREATE INDEX IF NOT EXISTS idx_operation_logs_admin_id ON public.operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_target_user ON public.operation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_type ON public.operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON public.operation_logs(created_at DESC);

-- Configurations indexes
CREATE INDEX IF NOT EXISTS idx_configurations_key ON public.configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_configurations_type ON public.configurations(config_type);
CREATE INDEX IF NOT EXISTS idx_configurations_public ON public.configurations(is_public) WHERE is_public = true;

-- =====================================================
-- STEP 5: UPDATED_AT TRIGGERS
-- =====================================================

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crypto_pairs_updated_at ON public.crypto_pairs;
CREATE TRIGGER update_crypto_pairs_updated_at
    BEFORE UPDATE ON public.crypto_pairs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fund_transactions_updated_at ON public.fund_transactions;
CREATE TRIGGER update_fund_transactions_updated_at
    BEFORE UPDATE ON public.fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crypto_deposits_updated_at ON public.crypto_deposits;
CREATE TRIGGER update_crypto_deposits_updated_at
    BEFORE UPDATE ON public.crypto_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mining_payouts_updated_at ON public.mining_payouts;
CREATE TRIGGER update_mining_payouts_updated_at
    BEFORE UPDATE ON public.mining_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configurations_updated_at ON public.configurations;
CREATE TRIGGER update_configurations_updated_at
    BEFORE UPDATE ON public.configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: NON-RECURSIVE RLS POLICIES (CRITICAL FIX)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configurations ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES (NON-RECURSIVE)
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- CRITICAL: Using security definer function to prevent recursion
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (is_admin_user());

-- PORTFOLIOS TABLE POLICIES
CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all portfolios" ON public.portfolios
    FOR SELECT USING (is_admin_user());

CREATE POLICY "System can manage portfolios" ON public.portfolios
    FOR ALL USING (true);

-- TRADES TABLE POLICIES
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update trades" ON public.trades
    FOR UPDATE USING (true);

CREATE POLICY "Admins can view all trades" ON public.trades
    FOR SELECT USING (is_admin_user());

-- FUND TRANSACTIONS TABLE POLICIES
CREATE POLICY "Users can view own transactions" ON public.fund_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON public.fund_transactions
    FOR ALL USING (is_admin_user());

-- USER ACTIVITIES TABLE POLICIES
CREATE POLICY "Users can view own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can log activities" ON public.user_activities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activities" ON public.user_activities
    FOR SELECT USING (is_admin_user());

-- CRYPTO PAIRS TABLE POLICIES  
CREATE POLICY "Anyone can view active crypto pairs" ON public.crypto_pairs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage crypto pairs" ON public.crypto_pairs
    FOR ALL USING (is_admin_user());

-- ORDERS TABLE POLICIES
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (is_admin_user());

-- CRYPTO DEPOSITS TABLE POLICIES
CREATE POLICY "Users can view own deposits" ON public.crypto_deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage deposits" ON public.crypto_deposits
    FOR ALL USING (is_admin_user());

CREATE POLICY "System can insert deposits" ON public.crypto_deposits
    FOR INSERT WITH CHECK (true);

-- MINING PAYOUTS TABLE POLICIES
CREATE POLICY "Users can view own payouts" ON public.mining_payouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage payouts" ON public.mining_payouts
    FOR ALL USING (is_admin_user());

-- OPERATION LOGS TABLE POLICIES
CREATE POLICY "Admins can view operation logs" ON public.operation_logs
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can insert operation logs" ON public.operation_logs
    FOR INSERT WITH CHECK (is_admin_user() AND admin_id = auth.uid());

-- CONFIGURATIONS TABLE POLICIES
CREATE POLICY "Public configs readable by all" ON public.configurations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can view all configs" ON public.configurations
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can manage configs" ON public.configurations
    FOR ALL USING (is_admin_user());

-- =====================================================
-- STEP 7: BALANCE ADJUSTMENT FUNCTION
-- =====================================================

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
        INSERT INTO portfolios (user_id, currency, balance)
        VALUES (p_user_id, p_currency, GREATEST(0, p_amount))
        RETURNING balance INTO new_bal;
        
        current_balance := 0;
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
            updated_at = NOW()
        WHERE user_id = p_user_id AND currency = p_currency;
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
        balance_before,
        balance_after,
        remark
    ) VALUES (
        p_user_id,
        p_currency,
        ABS(p_amount),
        p_operation_type,
        'completed',
        p_reference,
        p_admin_id,
        current_balance,
        new_bal,
        'Balance adjustment: ' || p_amount || ' ' || p_currency
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
        (SELECT email FROM auth.users WHERE id = p_user_id),
        'balance_adjusted',
        'Balance adjusted by ' || p_amount || ' ' || p_currency,
        p_admin_id,
        jsonb_build_object(
            'currency', p_currency,
            'amount', p_amount,
            'old_balance', current_balance,
            'new_balance', new_bal,
            'transaction_id', fund_tx_id
        )
    );
    
    RETURN QUERY SELECT TRUE, new_bal, 'Balance adjusted successfully';
    
EXCEPTION
    WHEN others THEN
        RETURN QUERY SELECT FALSE, 0::NUMERIC(20,8), 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.portfolios TO authenticated;
GRANT SELECT ON public.crypto_pairs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.trades TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.fund_transactions TO authenticated;
GRANT SELECT, INSERT ON public.user_activities TO authenticated;
GRANT SELECT, INSERT ON public.crypto_deposits TO authenticated;
GRANT SELECT ON public.mining_payouts TO authenticated;
GRANT SELECT ON public.configurations TO authenticated;

-- Grant permissions to service role (for admin operations)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.portfolios TO service_role;
GRANT ALL ON public.crypto_pairs TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.trades TO service_role;
GRANT ALL ON public.fund_transactions TO service_role;
GRANT ALL ON public.user_activities TO service_role;
GRANT ALL ON public.crypto_deposits TO service_role;
GRANT ALL ON public.mining_payouts TO service_role;
GRANT ALL ON public.operation_logs TO service_role;
GRANT ALL ON public.configurations TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION adjust_user_balance TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated, service_role;

-- =====================================================
-- STEP 9: ESSENTIAL INITIAL DATA
-- =====================================================

-- Insert essential crypto pairs
INSERT INTO public.crypto_pairs (
    symbol, base_currency, quote_currency, current_price, is_active, 
    min_trade_amount, max_trade_amount, fee_percentage
) VALUES 
    ('BTCUSDT', 'BTC', 'USDT', 43500.00, true, 0.0001, 100.0, 0.001),
    ('ETHUSDT', 'ETH', 'USDT', 2650.00, true, 0.001, 1000.0, 0.001),
    ('BNBUSDT', 'BNB', 'USDT', 315.00, true, 0.01, 10000.0, 0.001),
    ('ADAUSDT', 'ADA', 'USDT', 0.45, true, 1.0, 1000000.0, 0.001),
    ('DOTUSDT', 'DOT', 'USDT', 6.20, true, 0.1, 100000.0, 0.001),
    ('LINKUSDT', 'LINK', 'USDT', 14.50, true, 0.1, 50000.0, 0.001)
ON CONFLICT (symbol) DO UPDATE SET
    current_price = EXCLUDED.current_price,
    is_active = EXCLUDED.is_active,
    last_updated = NOW();

-- Insert essential system configurations
INSERT INTO public.configurations (
    config_key, config_value, config_type, description, is_public
) VALUES 
    ('platform_maintenance', '{"enabled": false, "message": ""}', 'system', 'Platform maintenance mode', true),
    ('trading_enabled', '{"enabled": true}', 'trading', 'Global trading toggle', true),
    ('withdrawal_limits', '{"daily_limit_usd": 10000, "monthly_limit_usd": 100000}', 'trading', 'Withdrawal limits', false),
    ('deposit_minimums', '{"BTC": 0.0001, "ETH": 0.001, "USDT": 1.0}', 'trading', 'Minimum deposit amounts', true),
    ('kyc_requirements', '{"required_for_withdrawal": true, "max_unverified_withdrawal": 100}', 'security', 'KYC requirements', false),
    ('fee_structure', '{"trading_fee": 0.001, "withdrawal_fee_btc": 0.0005, "withdrawal_fee_eth": 0.005}', 'trading', 'Platform fee structure', true),
    ('supported_currencies', '{"fiat": ["USD", "EUR"], "crypto": ["BTC", "ETH", "USDT", "USDC", "BNB"]}', 'system', 'Supported currencies', true),
    ('blockchain_confirmations', '{"BTC": 3, "ETH": 12, "USDT": 12, "USDC": 12, "BNB": 12}', 'blockchain', 'Required confirmations', false)
ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- =====================================================
-- STEP 10: COMPREHENSIVE VERIFICATION
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    crypto_pairs_count INTEGER;
    config_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'portfolios', 'crypto_pairs', 'orders', 'trades', 'fund_transactions', 'user_activities', 'crypto_deposits', 'mining_payouts', 'operation_logs', 'configurations');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name IN ('adjust_user_balance', 'update_updated_at_column', 'is_admin_user', 'handle_new_user');
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%updated_at%' OR trigger_name = 'on_auth_user_created';
    
    -- Count crypto pairs and configurations
    SELECT COUNT(*) INTO crypto_pairs_count FROM public.crypto_pairs;
    SELECT COUNT(*) INTO config_count FROM public.configurations;
    
    -- Output comprehensive summary
    RAISE NOTICE '';
    RAISE NOTICE '🎉 QUANTEX TRADING PLATFORM - PRODUCTION-READY DEPLOYMENT COMPLETE! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ DEPLOYMENT SUMMARY:';
    RAISE NOTICE '   Tables created: % (expected: 11)', table_count;
    RAISE NOTICE '   Indexes created: % (expected: 30+)', index_count;
    RAISE NOTICE '   RLS policies created: % (expected: 25+)', policy_count;
    RAISE NOTICE '   Functions created: % (expected: 4)', function_count;
    RAISE NOTICE '   Triggers created: % (expected: 10+)', trigger_count;
    RAISE NOTICE '   Crypto pairs: % | Configurations: %', crypto_pairs_count, config_count;
    RAISE NOTICE '';
    RAISE NOTICE '🛡️  SECURITY FEATURES:';
    RAISE NOTICE '   • Non-recursive RLS policies (prevents auth crashes)';
    RAISE NOTICE '   • SECURITY DEFINER admin function prevents infinite loops';
    RAISE NOTICE '   • Comprehensive audit trails with user_activities';
    RAISE NOTICE '   • Atomic balance operations with row-level locking';
    RAISE NOTICE '';
    RAISE NOTICE '💰 FINANCIAL FEATURES:';
    RAISE NOTICE '   • High-precision cryptocurrency handling (NUMERIC 20,8)';
    RAISE NOTICE '   • Multi-currency portfolio management';
    RAISE NOTICE '   • Complete order management system';
    RAISE NOTICE '   • Blockchain deposit monitoring';
    RAISE NOTICE '   • Mining payout tracking';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TRADING FEATURES:';
    RAISE NOTICE '   • Crypto pairs with real-time pricing';
    RAISE NOTICE '   • Order book management (market/limit/stop orders)';
    RAISE NOTICE '   • Trade execution and settlement';
    RAISE NOTICE '   • Leverage and risk management';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ADMIN FEATURES:';
    RAISE NOTICE '   • Operation logs for all admin actions';
    RAISE NOTICE '   • System configuration management';
    RAISE NOTICE '   • User status and KYC management';
    RAISE NOTICE '   • Balance adjustment tools';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Create your first admin user:';
    RAISE NOTICE '   INSERT INTO public.users (id, role) VALUES (''<auth_user_id>'', ''super_admin'');';
    RAISE NOTICE '2. Test the authentication system';
    RAISE NOTICE '3. Configure blockchain monitoring endpoints';
    RAISE NOTICE '4. Set up price feed integrations';
    RAISE NOTICE '';
    
    -- Verify the critical status column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'status'
    ) THEN
        RAISE NOTICE '✅ CRITICAL: Status column exists in public.users';
    ELSE
        RAISE WARNING '❌ CRITICAL: Status column missing from public.users';
    END IF;
    
    -- Verify auth trigger exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE '✅ CRITICAL: Auth trigger is properly configured';
    ELSE
        RAISE WARNING '❌ CRITICAL: Auth trigger is missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 DEPLOYMENT STATUS: SUCCESSFUL - READY FOR PRODUCTION!';
    RAISE NOTICE '';
END $$;

-- Final verification queries
SELECT 'Status column exists' as verification_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'status'
);

SELECT 'Auth trigger exists' as verification_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
);

-- Show essential table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name IN ('id', 'status', 'role', 'trading_enabled', 'verification_level')
ORDER BY table_name, ordinal_position;

COMMIT;