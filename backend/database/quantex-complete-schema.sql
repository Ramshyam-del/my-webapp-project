-- =====================================================
-- QUANTEX TRADING PLATFORM - COMPLETE DATABASE SCHEMA
-- Production-Ready SQL Script for Supabase PostgreSQL
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
$$ language 'plpgsql';

-- =====================================================
-- ENHANCED USERS TABLE
-- =====================================================

-- Add comprehensive user management columns to auth.users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'moderator')),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen')),
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'standard' CHECK (account_type IN ('standard', 'premium', 'vip', 'demo')),
ADD COLUMN IF NOT EXISTS verification_level VARCHAR(50) DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'email_verified', 'phone_verified', 'kyc_pending', 'kyc_verified', 'enhanced_verified')),

-- Trading permissions
ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_daily_withdrawal NUMERIC(20,8) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS max_daily_deposit NUMERIC(20,8) DEFAULT 50000.00,

-- Security and tracking
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,

-- KYC and compliance
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS document_verification_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (document_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected', 'expired')),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address JSONB,

-- Trading preferences
ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS trading_experience VARCHAR(20) DEFAULT 'beginner' CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
ADD COLUMN IF NOT EXISTS leverage_limit NUMERIC(5,2) DEFAULT 1.00,

-- Notification preferences
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false,

-- Admin tracking
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status_change_reason TEXT,

-- Timestamps
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create public users table for additional data
CREATE TABLE IF NOT EXISTS public.users (
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
-- PORTFOLIOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB', 'ADA', 'DOT', 'LINK', 'LTC')),
    
    -- Enhanced precision for cryptocurrency (CRITICAL for accuracy)
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

-- =====================================================
-- CRYPTOCURRENCY PAIRS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crypto_pairs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL, -- e.g., 'BTCUSDT', 'ETHUSDT'
    base_currency TEXT NOT NULL, -- e.g., 'BTC', 'ETH'
    quote_currency TEXT NOT NULL, -- e.g., 'USDT', 'USD'
    
    -- Trading configuration
    is_active BOOLEAN DEFAULT true,
    min_trade_amount NUMERIC(20,8) DEFAULT 0.00000001,
    max_trade_amount NUMERIC(20,8) DEFAULT 1000000.00000000,
    price_precision INTEGER DEFAULT 8,
    quantity_precision INTEGER DEFAULT 8,
    
    -- Fee configuration
    maker_fee NUMERIC(5,4) DEFAULT 0.0010, -- 0.1%
    taker_fee NUMERIC(5,4) DEFAULT 0.0010, -- 0.1%
    
    -- Market data
    current_price NUMERIC(20,8),
    price_change_24h NUMERIC(10,4),
    volume_24h NUMERIC(20,8),
    high_24h NUMERIC(20,8),
    low_24h NUMERIC(20,8),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TRADES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency_pair TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell', 'buy_up', 'buy_down', 'long', 'short')),
    
    -- Trade details
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    entry_price NUMERIC(20,8) NOT NULL CHECK (entry_price > 0),
    exit_price NUMERIC(20,8),
    leverage INTEGER DEFAULT 1 CHECK (leverage >= 1 AND leverage <= 100),
    
    -- Duration and expiry
    duration_seconds INTEGER,
    expires_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Status and results
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired', 'liquidated')),
    pnl NUMERIC(20,8) DEFAULT 0.00000000,
    fee NUMERIC(20,8) DEFAULT 0.00000000,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    stop_loss NUMERIC(20,8),
    take_profit NUMERIC(20,8),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pair_id UUID REFERENCES crypto_pairs(id),
    
    -- Order details
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    price NUMERIC(20,8), -- NULL for market orders
    stop_price NUMERIC(20,8), -- For stop orders
    
    -- Execution details
    filled_amount NUMERIC(20,8) DEFAULT 0,
    remaining_amount NUMERIC(20,8) GENERATED ALWAYS AS (amount - filled_amount) STORED,
    average_price NUMERIC(20,8),
    
    -- Status and timing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'filled', 'cancelled', 'expired', 'rejected')),
    time_in_force TEXT DEFAULT 'GTC' CHECK (time_in_force IN ('GTC', 'IOC', 'FOK')), -- Good Till Cancelled, Immediate or Cancel, Fill or Kill
    expires_at TIMESTAMPTZ,
    
    -- Fees
    fee_amount NUMERIC(20,8) DEFAULT 0,
    fee_currency TEXT,
    
    -- Metadata
    client_order_id TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (filled_amount <= amount),
    CHECK (remaining_amount >= 0)
);

-- =====================================================
-- FUND TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS fund_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB', 'ADA', 'DOT', 'LINK', 'LTC')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'recharge', 'RECHARGE', 'WITHDRAW', 'bonus', 'penalty', 'trade_fee', 'referral')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')),
    
    -- Enhanced tracking
    transaction_reference TEXT,
    blockchain_tx_hash TEXT,
    remark TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    
    -- Fee tracking
    fee_amount NUMERIC(20,8) DEFAULT 0 CHECK (fee_amount >= 0),
    fee_currency TEXT,
    
    -- Processing details
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    -- Balance tracking
    balance_before NUMERIC(20,8),
    balance_after NUMERIC(20,8),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CRYPTO DEPOSITS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS crypto_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USDC', 'BNB')),
    deposit_address TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    
    -- Blockchain confirmation tracking
    confirmations INTEGER DEFAULT 0 CHECK (confirmations >= 0),
    required_confirmations INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed', 'orphaned')),
    
    -- Blockchain details
    block_number BIGINT,
    block_hash TEXT,
    network TEXT NOT NULL, -- e.g., 'ethereum', 'bitcoin', 'tron'
    from_address TEXT,
    gas_fee NUMERIC(20,8) DEFAULT 0 CHECK (gas_fee >= 0),
    
    -- Processing tracking
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    confirmed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    credited_to_portfolio BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (confirmations <= required_confirmations OR status = 'completed')
);

-- =====================================================
-- MINING PAYOUTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mining_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR')),
    payout_amount NUMERIC(20,8) NOT NULL CHECK (payout_amount > 0),
    
    -- Balance tracking
    balance_before NUMERIC(20,8) NOT NULL,
    balance_after NUMERIC(20,8) NOT NULL,
    
    -- Mining details
    mining_period_start TIMESTAMPTZ,
    mining_period_end TIMESTAMPTZ,
    hash_rate NUMERIC(20,8),
    mining_pool TEXT,
    
    -- Payout details
    payout_date TIMESTAMPTZ DEFAULT NOW(),
    payout_method TEXT DEFAULT 'automatic' CHECK (payout_method IN ('automatic', 'manual')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (balance_after = balance_before + payout_amount)
);

-- =====================================================
-- OPERATION LOGS TABLE (Admin Actions)
-- =====================================================

CREATE TABLE IF NOT EXISTS operation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    
    -- Action details
    action TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'user_management', 'financial', 'security', 'system')),
    
    -- Target information
    target_user_id UUID REFERENCES auth.users(id),
    target_user_email TEXT,
    target_resource TEXT, -- e.g., 'trade', 'withdrawal', 'user_account'
    target_resource_id UUID,
    
    -- Action details
    details TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Request information
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    
    -- Result
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- USER ACTIVITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'trade', 'deposit', 'withdrawal', 'profile_update', 'password_change', 'kyc_submission')),
    description TEXT,
    
    -- Request information
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB,
    
    -- Activity metadata
    metadata JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    
    -- Configuration details
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'trading', 'security', 'fees', 'limits', 'notifications')),
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'array')),
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    requires_restart BOOLEAN DEFAULT FALSE,
    
    -- Validation
    validation_rules JSONB,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- BALANCE ADJUSTMENT FUNCTION
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
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_verification_level ON public.users(verification_level);
CREATE INDEX IF NOT EXISTS idx_users_trading_enabled ON public.users(trading_enabled) WHERE trading_enabled = true;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Portfolios table indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON portfolios(currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_balance ON portfolios(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_portfolios_available_balance ON portfolios(available_balance) WHERE available_balance > 0;
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON portfolios(updated_at DESC);

-- Crypto pairs indexes
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_symbol ON crypto_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_active ON crypto_pairs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_base_currency ON crypto_pairs(base_currency);
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_quote_currency ON crypto_pairs(quote_currency);

-- Trades table indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_currency_pair ON trades(currency_pair);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_expires_at ON trades(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pair_id ON orders(pair_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_side ON orders(side);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at) WHERE expires_at IS NOT NULL;

-- Fund transactions indexes
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_currency ON fund_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_admin ON fund_transactions(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fund_transactions_tx_hash ON fund_transactions(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;

-- Crypto deposits indexes
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_currency ON crypto_deposits(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_network ON crypto_deposits(network);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_created_at ON crypto_deposits(created_at DESC);

-- Mining payouts indexes
CREATE INDEX IF NOT EXISTS idx_mining_payouts_user_id ON mining_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_currency ON mining_payouts(currency);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_date ON mining_payouts(payout_date DESC);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_created_at ON mining_payouts(created_at DESC);

-- Operation logs indexes
CREATE INDEX IF NOT EXISTS idx_operation_logs_admin_id ON operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_target_user ON operation_logs(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_operation_logs_category ON operation_logs(category);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at DESC);

-- User activities indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_ip ON user_activities(ip_address) WHERE ip_address IS NOT NULL;

-- Configurations indexes
CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key);
CREATE INDEX IF NOT EXISTS idx_configurations_category ON configurations(category);
CREATE INDEX IF NOT EXISTS idx_configurations_public ON configurations(is_public) WHERE is_public = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
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

CREATE TRIGGER update_crypto_deposits_updated_at 
    BEFORE UPDATE ON crypto_deposits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mining_payouts_updated_at 
    BEFORE UPDATE ON mining_payouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configurations_updated_at 
    BEFORE UPDATE ON configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON public.users 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admins can manage all users" ON public.users 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Portfolios table policies
CREATE POLICY "Users can view own portfolios" ON portfolios 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Service role can manage portfolios" ON portfolios 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all portfolios" ON portfolios 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Crypto pairs policies (public read access)
CREATE POLICY "Anyone can view active crypto pairs" ON crypto_pairs 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage crypto pairs" ON crypto_pairs 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Trades table policies
CREATE POLICY "Users can view own trades" ON trades 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Users can create own trades" ON trades 
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own trades" ON trades 
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all trades" ON trades 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Orders table policies
CREATE POLICY "Users can view own orders" ON orders 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Users can create own orders" ON orders 
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders" ON orders 
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders" ON orders 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Fund transactions policies
CREATE POLICY "Users can view own transactions" ON fund_transactions 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admins can manage all transactions" ON fund_transactions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Crypto deposits policies
CREATE POLICY "Users can view own deposits" ON crypto_deposits 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admins can manage all deposits" ON crypto_deposits 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Mining payouts policies
CREATE POLICY "Users can view own payouts" ON mining_payouts 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admins can manage all payouts" ON mining_payouts 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Operation logs policies
CREATE POLICY "Admins can view operation logs" ON operation_logs 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admins can insert operation logs" ON operation_logs 
    FOR INSERT WITH CHECK (
        admin_id = auth.uid() AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- User activities policies
CREATE POLICY "Users can view own activities" ON user_activities 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "System can insert user activities" ON user_activities 
    FOR INSERT WITH CHECK (true); -- Allow system to log activities

-- Configurations policies
CREATE POLICY "Public configs readable by all" ON configurations 
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all configs" ON configurations 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- =====================================================
-- INITIAL DATA SETUP
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

-- Create default admin user (if not exists)
DO $$
BEGIN
    -- This will be handled by your application's user creation process
    -- The admin user should be created through Supabase Auth
    RAISE NOTICE 'Schema setup complete. Create admin user through your application.';
END $$;

-- =====================================================
-- VERIFICATION AND SUMMARY
-- =====================================================

-- Verify table creation
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'portfolios', 'crypto_pairs', 'trades', 'orders', 'fund_transactions', 'crypto_deposits', 'mining_payouts', 'operation_logs', 'user_activities', 'configurations');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    AND routine_name IN ('adjust_balance', 'update_updated_at_column');
    
    -- Output summary
    RAISE NOTICE '';
    RAISE NOTICE '=== QUANTEX TRADING PLATFORM DATABASE SETUP COMPLETE ===';
    RAISE NOTICE 'Tables created: % (expected: 11)', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'RLS policies created: %', policy_count;
    RAISE NOTICE 'Functions created: % (expected: 2)', function_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create admin user through Supabase Auth';
    RAISE NOTICE '2. Update user role to "admin" or "super_admin"';
    RAISE NOTICE '3. Configure environment variables';
    RAISE NOTICE '4. Test API endpoints';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
END $$;

-- Final commit
COMMIT;