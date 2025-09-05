-- =====================================================
-- QUANTEX TRADING PLATFORM - FIXED RLS SCHEMA
-- Production-Ready SQL Script with Non-Recursive RLS
-- Fixes infinite recursion in Row Level Security policies
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
-- ADMIN ROLE CHECKING FUNCTION (NON-RECURSIVE)
-- =====================================================

-- Create a security definer function to check admin roles
-- This avoids RLS recursion by using SECURITY DEFINER
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
-- PUBLIC USERS TABLE (PROFILE EXTENSION)
-- =====================================================

-- Create public.users table that extends auth.users
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

-- =====================================================
-- CRYPTO PAIRS TABLE
-- =====================================================

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

-- =====================================================
-- ORDERS TABLE
-- =====================================================

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

-- =====================================================
-- TRADES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS trades (
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

-- =====================================================
-- MINING PAYOUTS TABLE
-- =====================================================

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

-- =====================================================
-- OPERATION LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS operation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'user_management', 'financial', 'trading', 'system', 'security')),
    target_type TEXT CHECK (target_type IN ('user', 'transaction', 'trade', 'order', 'system', 'configuration')),
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- USER ACTIVITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'trade', 'deposit', 'withdraw', 'profile_update', 'password_change', 'kyc_submission', 'order_placed', 'order_cancelled')),
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'trading', 'security', 'fees', 'limits', 'notifications')),
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- BALANCE ADJUSTMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION adjust_balance(
    p_user_id UUID,
    p_currency TEXT,
    p_amount NUMERIC(20,8),
    p_transaction_type TEXT DEFAULT 'adjustment',
    p_reference TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance NUMERIC(20,8);
    new_balance NUMERIC(20,8);
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM portfolios
    WHERE user_id = p_user_id AND currency = p_currency;
    
    -- If portfolio doesn't exist, create it
    IF current_balance IS NULL THEN
        INSERT INTO portfolios (user_id, currency, balance)
        VALUES (p_user_id, p_currency, GREATEST(0, p_amount));
        current_balance := 0;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance + p_amount;
    
    -- Prevent negative balance
    IF new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', current_balance, p_amount;
    END IF;
    
    -- Update portfolio
    UPDATE portfolios
    SET balance = new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_currency;
    
    -- Log the transaction
    INSERT INTO fund_transactions (
        user_id, currency, amount, type, status,
        transaction_reference, balance_before, balance_after
    ) VALUES (
        p_user_id, p_currency, ABS(p_amount),
        CASE WHEN p_amount > 0 THEN 'deposit' ELSE 'withdraw' END,
        'completed', p_reference, current_balance, new_balance
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Balance adjustment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(id); -- id maps to auth.users email
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Portfolios table indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON portfolios(currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_balance ON portfolios(balance) WHERE balance > 0;

-- Crypto pairs table indexes
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_symbol ON crypto_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_active ON crypto_pairs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crypto_pairs_base_quote ON crypto_pairs(base_currency, quote_currency);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pair_id ON orders(pair_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Trades table indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_currency_pair ON trades(currency_pair);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);

-- Fund transactions table indexes
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_currency ON fund_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_type ON fund_transactions(user_id, type);

-- Crypto deposits table indexes
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_currency ON crypto_deposits(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_address ON crypto_deposits(deposit_address);

-- Mining payouts table indexes
CREATE INDEX IF NOT EXISTS idx_mining_payouts_user_id ON mining_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_currency ON mining_payouts(currency);
CREATE INDEX IF NOT EXISTS idx_mining_payouts_date ON mining_payouts(payout_date);

-- Operation logs table indexes
CREATE INDEX IF NOT EXISTS idx_operation_logs_admin_id ON operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_operation_logs_category ON operation_logs(category);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_operation_logs_target ON operation_logs(target_type, target_id);

-- User activities table indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON user_activities(user_id, activity_type);

-- Configurations table indexes
CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key);
CREATE INDEX IF NOT EXISTS idx_configurations_category ON configurations(category);
CREATE INDEX IF NOT EXISTS idx_configurations_public ON configurations(is_public) WHERE is_public = true;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Users table trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Portfolios table trigger
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Crypto pairs table trigger
DROP TRIGGER IF EXISTS update_crypto_pairs_updated_at ON crypto_pairs;
CREATE TRIGGER update_crypto_pairs_updated_at
    BEFORE UPDATE ON crypto_pairs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Orders table trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trades table trigger
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fund transactions table trigger
DROP TRIGGER IF EXISTS update_fund_transactions_updated_at ON fund_transactions;
CREATE TRIGGER update_fund_transactions_updated_at
    BEFORE UPDATE ON fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Crypto deposits table trigger
DROP TRIGGER IF EXISTS update_crypto_deposits_updated_at ON crypto_deposits;
CREATE TRIGGER update_crypto_deposits_updated_at
    BEFORE UPDATE ON crypto_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Mining payouts table trigger
DROP TRIGGER IF EXISTS update_mining_payouts_updated_at ON mining_payouts;
CREATE TRIGGER update_mining_payouts_updated_at
    BEFORE UPDATE ON mining_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurations table trigger
DROP TRIGGER IF EXISTS update_configurations_updated_at ON configurations;
CREATE TRIGGER update_configurations_updated_at
    BEFORE UPDATE ON configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIXED ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES (NON-RECURSIVE)
-- =====================================================

-- Users can view own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow user registration
CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all users (using security definer function)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin_user());

-- Admins can update users (using security definer function)
CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (is_admin_user());

-- =====================================================
-- OTHER TABLE POLICIES (USING NON-RECURSIVE FUNCTION)
-- =====================================================

-- Portfolios table policies
CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all portfolios" ON portfolios
    FOR SELECT USING (is_admin_user());

CREATE POLICY "System can manage portfolios" ON portfolios
    FOR ALL USING (true);

-- Crypto pairs table policies
CREATE POLICY "Anyone can view active crypto pairs" ON crypto_pairs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage crypto pairs" ON crypto_pairs
    FOR ALL USING (is_admin_user());

-- Orders table policies
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (is_admin_user());

-- Trades table policies
CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create trades" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update trades" ON trades
    FOR UPDATE USING (true);

CREATE POLICY "Admins can view all trades" ON trades
    FOR SELECT USING (is_admin_user());

-- Fund transactions table policies
CREATE POLICY "Users can view own transactions" ON fund_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON fund_transactions
    FOR ALL USING (is_admin_user());

-- Crypto deposits table policies
CREATE POLICY "Users can view own deposits" ON crypto_deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage deposits" ON crypto_deposits
    FOR ALL USING (true);

-- Mining payouts table policies
CREATE POLICY "Users can view own payouts" ON mining_payouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage payouts" ON mining_payouts
    FOR ALL USING (is_admin_user());

-- Operation logs table policies
CREATE POLICY "Admins can view operation logs" ON operation_logs
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Admins can create operation logs" ON operation_logs
    FOR INSERT WITH CHECK (is_admin_user());

-- User activities table policies
CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can log activities" ON user_activities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activities" ON user_activities
    FOR SELECT USING (is_admin_user());

-- Configurations table policies
CREATE POLICY "Anyone can view public configurations" ON configurations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage configurations" ON configurations
    FOR ALL USING (is_admin_user());

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default crypto pairs
INSERT INTO crypto_pairs (symbol, base_currency, quote_currency, is_active, current_price) VALUES
('BTC/USDT', 'BTC', 'USDT', true, 45000.00000000),
('ETH/USDT', 'ETH', 'USDT', true, 3000.00000000),
('BNB/USDT', 'BNB', 'USDT', true, 300.00000000),
('ADA/USDT', 'ADA', 'USDT', true, 0.50000000),
('DOT/USDT', 'DOT', 'USDT', true, 25.00000000),
('LINK/USDT', 'LINK', 'USDT', true, 15.00000000),
('LTC/USDT', 'LTC', 'USDT', true, 150.00000000)
ON CONFLICT (symbol) DO UPDATE SET
    current_price = EXCLUDED.current_price,
    updated_at = NOW();

-- Insert default configurations
INSERT INTO configurations (key, value, description, category, is_public) VALUES
('trading_enabled', 'true', 'Global trading enable/disable', 'trading', true),
('maintenance_mode', 'false', 'System maintenance mode', 'system', true),
('min_withdrawal_btc', '0.001', 'Minimum BTC withdrawal amount', 'limits', true),
('min_withdrawal_eth', '0.01', 'Minimum ETH withdrawal amount', 'limits', true),
('min_withdrawal_usdt', '10', 'Minimum USDT withdrawal amount', 'limits', true),
('max_leverage', '100', 'Maximum allowed leverage', 'trading', true),
('trading_fee_maker', '0.001', 'Maker trading fee (0.1%)', 'fees', true),
('trading_fee_taker', '0.001', 'Taker trading fee (0.1%)', 'fees', true),
('withdrawal_fee_btc', '0.0005', 'BTC withdrawal fee', 'fees', true),
('withdrawal_fee_eth', '0.005', 'ETH withdrawal fee', 'fees', true),
('withdrawal_fee_usdt', '1', 'USDT withdrawal fee', 'fees', true)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION AND SUMMARY
-- =====================================================

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
    AND routine_name IN ('adjust_balance', 'update_updated_at_column', 'is_admin_user');
    
    -- Output summary
    RAISE NOTICE '';
    RAISE NOTICE '=== QUANTEX TRADING PLATFORM - FIXED RLS SETUP COMPLETE ===';
    RAISE NOTICE 'Tables created: % (expected: 11)', table_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'RLS policies created: %', policy_count;
    RAISE NOTICE 'Functions created: % (expected: 3)', function_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ FIXED: RLS infinite recursion issue resolved';
    RAISE NOTICE '✅ Uses SECURITY DEFINER function for admin role checks';
    RAISE NOTICE '✅ No circular dependencies in RLS policies';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create admin user through Supabase Auth';
    RAISE NOTICE '2. Insert admin record: INSERT INTO public.users (id, role) VALUES (''<auth_user_id>'', ''super_admin'');';
    RAISE NOTICE '3. Configure environment variables';
    RAISE NOTICE '4. Test API endpoints';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
END $$;

-- Final commit
COMMIT;