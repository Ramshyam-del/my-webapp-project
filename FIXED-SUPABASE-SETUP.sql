-- =====================================================
-- QUANTEX TRADING PLATFORM - FIXED SUPABASE SETUP
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending')),
    balance DECIMAL(20,8) DEFAULT 1000.00,
    total_deposits DECIMAL(20,8) DEFAULT 0.00,
    total_withdrawals DECIMAL(20,8) DEFAULT 0.00,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    kyc_document_url TEXT,
    kyc_submitted_at TIMESTAMP WITH TIME ZONE,
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration table for system settings
CREATE TABLE IF NOT EXISTS public.configuration (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cryptocurrency pairs table
CREATE TABLE IF NOT EXISTS public.crypto_pairs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    base_currency TEXT NOT NULL,
    quote_currency TEXT NOT NULL,
    current_price DECIMAL(20,8) DEFAULT 0.00,
    price_change_24h DECIMAL(10,4) DEFAULT 0.00,
    price_change_percent_24h DECIMAL(10,4) DEFAULT 0.00,
    volume_24h DECIMAL(20,8) DEFAULT 0.00,
    market_cap DECIMAL(20,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    min_order_size DECIMAL(20,8) DEFAULT 0.001,
    max_order_size DECIMAL(20,8) DEFAULT 1000000.00,
    price_precision INTEGER DEFAULT 8,
    quantity_precision INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRADING TABLES
-- =====================================================

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    pair_symbol TEXT REFERENCES public.crypto_pairs(symbol) NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8),
    stop_price DECIMAL(20,8),
    filled_quantity DECIMAL(20,8) DEFAULT 0.00,
    average_price DECIMAL(20,8),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partially_filled', 'cancelled', 'rejected')),
    total_amount DECIMAL(20,8) GENERATED ALWAYS AS (quantity * COALESCE(price, 0)) STORED,
    commission DECIMAL(20,8) DEFAULT 0.00,
    commission_rate DECIMAL(10,6) DEFAULT 0.001,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filled_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'commission', 'bonus', 'refund')),
    currency TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    balance_before DECIMAL(20,8) NOT NULL,
    balance_after DECIMAL(20,8) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_id TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Trades table (executed trades)
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    pair_symbol TEXT REFERENCES public.crypto_pairs(symbol) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_amount DECIMAL(20,8) GENERATED ALWAYS AS (quantity * price) STORED,
    buyer_commission DECIMAL(20,8) DEFAULT 0.00,
    seller_commission DECIMAL(20,8) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WALLET & PAYMENT TABLES
-- =====================================================

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    currency TEXT NOT NULL,
    address TEXT,
    private_key_encrypted TEXT,
    balance DECIMAL(20,8) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    currency TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    tx_hash TEXT,
    wallet_address TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'failed')),
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 6,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    currency TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0.00,
    net_amount DECIMAL(20,8) GENERATED ALWAYS AS (amount - fee) STORED,
    wallet_address TEXT NOT NULL,
    tx_hash TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- MINING & STAKING TABLES
-- =====================================================

-- Mining pools table
CREATE TABLE IF NOT EXISTS public.mining_pools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    currency TEXT NOT NULL,
    algorithm TEXT,
    pool_url TEXT,
    pool_port INTEGER,
    is_active BOOLEAN DEFAULT true,
    min_payout DECIMAL(20,8) DEFAULT 0.001,
    fee_percent DECIMAL(5,4) DEFAULT 0.01,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mining payouts table
CREATE TABLE IF NOT EXISTS public.mining_payouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    pool_id UUID REFERENCES public.mining_pools(id) ON DELETE SET NULL,
    currency TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0.00,
    net_amount DECIMAL(20,8) GENERATED ALWAYS AS (amount - fee) STORED,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- ADMIN & SYSTEM TABLES
-- =====================================================

-- Operation logs table
CREATE TABLE IF NOT EXISTS public.operation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System notifications table
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'admins')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users(kyc_status);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pair_symbol ON public.orders(pair_symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_pair_symbol ON public.trades(pair_symbol);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_seller ON public.trades(buyer_id, seller_id);

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON public.wallets(user_id, currency);

-- Deposits/Withdrawals indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_configuration_updated_at ON public.configuration;
DROP TRIGGER IF EXISTS update_crypto_pairs_updated_at ON public.crypto_pairs;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
DROP TRIGGER IF EXISTS update_deposits_updated_at ON public.deposits;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.withdrawals;
DROP TRIGGER IF EXISTS update_mining_pools_updated_at ON public.mining_pools;
DROP TRIGGER IF EXISTS update_mining_payouts_updated_at ON public.mining_payouts;
DROP TRIGGER IF EXISTS update_system_notifications_updated_at ON public.system_notifications;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuration_updated_at BEFORE UPDATE ON public.configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crypto_pairs_updated_at BEFORE UPDATE ON public.crypto_pairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mining_pools_updated_at BEFORE UPDATE ON public.mining_pools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mining_payouts_updated_at BEFORE UPDATE ON public.mining_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_notifications_updated_at BEFORE UPDATE ON public.system_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'user', 'active', NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate user balance
CREATE OR REPLACE FUNCTION calculate_user_balance(user_uuid UUID)
RETURNS DECIMAL(20,8) AS $$
DECLARE
    total_balance DECIMAL(20,8) := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN type IN ('deposit', 'bonus') THEN amount
            WHEN type IN ('withdrawal', 'commission') THEN -amount
            WHEN type = 'trade' THEN 
                CASE 
                    WHEN metadata->>'side' = 'buy' THEN -amount
                    ELSE amount
                END
            ELSE 0
        END
    ), 0) INTO total_balance
    FROM public.transactions 
    WHERE user_id = user_uuid AND status = 'completed';
    
    RETURN total_balance;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view configuration" ON public.configuration;
DROP POLICY IF EXISTS "Only admins can modify configuration" ON public.configuration;
DROP POLICY IF EXISTS "Anyone can view crypto pairs" ON public.crypto_pairs;
DROP POLICY IF EXISTS "Only admins can modify crypto pairs" ON public.crypto_pairs;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can view trades" ON public.trades;
DROP POLICY IF EXISTS "Only admins can create trades" ON public.trades;
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can create own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can create own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Anyone can view mining pools" ON public.mining_pools;
DROP POLICY IF EXISTS "Only admins can modify mining pools" ON public.mining_pools;
DROP POLICY IF EXISTS "Users can view own mining payouts" ON public.mining_payouts;
DROP POLICY IF EXISTS "Admins can view all mining payouts" ON public.mining_payouts;
DROP POLICY IF EXISTS "Only admins can view operation logs" ON public.operation_logs;
DROP POLICY IF EXISTS "Anyone can view system notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Only admins can modify system notifications" ON public.system_notifications;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Configuration policies
CREATE POLICY "Anyone can view configuration" ON public.configuration
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify configuration" ON public.configuration
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Crypto pairs policies
CREATE POLICY "Anyone can view crypto pairs" ON public.crypto_pairs
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify crypto pairs" ON public.crypto_pairs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trades policies
CREATE POLICY "Anyone can view trades" ON public.trades
    FOR SELECT USING (true);

CREATE POLICY "Only admins can create trades" ON public.trades
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Wallets policies
CREATE POLICY "Users can view own wallets" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallets" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Deposits policies
CREATE POLICY "Users can view own deposits" ON public.deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deposits" ON public.deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits" ON public.deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Mining pools policies
CREATE POLICY "Anyone can view mining pools" ON public.mining_pools
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify mining pools" ON public.mining_pools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Mining payouts policies
CREATE POLICY "Users can view own mining payouts" ON public.mining_payouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mining payouts" ON public.mining_payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Operation logs policies
CREATE POLICY "Only admins can view operation logs" ON public.operation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System notifications policies
CREATE POLICY "Anyone can view system notifications" ON public.system_notifications
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify system notifications" ON public.system_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default configuration
INSERT INTO public.configuration (key, value, description) VALUES
('trading_fee', '0.001', 'Trading fee percentage (0.1%)'),
('min_order_size', '0.001', 'Minimum order size in base currency'),
('max_order_size', '1000000', 'Maximum order size in base currency'),
('kyc_required', 'true', 'Whether KYC is required for trading'),
('maintenance_mode', 'false', 'Whether the platform is in maintenance mode'),
('withdrawal_fee_btc', '0.0005', 'Bitcoin withdrawal fee'),
('withdrawal_fee_eth', '0.01', 'Ethereum withdrawal fee'),
('withdrawal_fee_usdt', '10', 'USDT withdrawal fee'),
('min_withdrawal_btc', '0.001', 'Minimum Bitcoin withdrawal'),
('min_withdrawal_eth', '0.01', 'Minimum Ethereum withdrawal'),
('min_withdrawal_usdt', '50', 'Minimum USDT withdrawal')
ON CONFLICT (key) DO NOTHING;

-- Insert popular crypto pairs
INSERT INTO public.crypto_pairs (symbol, base_currency, quote_currency, current_price, price_change_percent_24h, volume_24h, market_cap, is_active) VALUES
('BTCUSDT', 'BTC', 'USDT', 45000.00, 2.5, 2500000000.00, 850000000000.00, true),
('ETHUSDT', 'ETH', 'USDT', 3000.00, 1.8, 1500000000.00, 350000000000.00, true),
('BNBUSDT', 'BNB', 'USDT', 350.00, -0.5, 500000000.00, 55000000000.00, true),
('ADAUSDT', 'ADA', 'USDT', 0.50, 3.2, 200000000.00, 18000000000.00, true),
('SOLUSDT', 'SOL', 'USDT', 100.00, 5.1, 300000000.00, 40000000000.00, true),
('DOTUSDT', 'DOT', 'USDT', 7.50, 1.2, 150000000.00, 8000000000.00, true),
('LINKUSDT', 'LINK', 'USDT', 15.00, 2.8, 180000000.00, 8000000000.00, true),
('MATICUSDT', 'MATIC', 'USDT', 0.80, 4.1, 120000000.00, 7000000000.00, true)
ON CONFLICT (symbol) DO NOTHING;

-- Insert default mining pools
INSERT INTO public.mining_pools (name, currency, algorithm, pool_url, pool_port, min_payout, fee_percent) VALUES
('Bitcoin Pool', 'BTC', 'SHA256', 'stratum+tcp://pool.example.com', 3333, 0.001, 0.01),
('Ethereum Pool', 'ETH', 'Ethash', 'stratum+tcp://pool.example.com', 4444, 0.01, 0.01),
('Litecoin Pool', 'LTC', 'Scrypt', 'stratum+tcp://pool.example.com', 5555, 0.1, 0.01)
ON CONFLICT (name) DO NOTHING;

-- Insert system notifications
INSERT INTO public.system_notifications (title, message, type, target_audience) VALUES
('Welcome to Quantex!', 'Welcome to our trading platform. Please complete your KYC verification to start trading.', 'info', 'all'),
('System Maintenance', 'Scheduled maintenance on Sunday 2-4 AM UTC. Trading will be temporarily suspended.', 'warning', 'all')
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for public data
GRANT SELECT ON public.crypto_pairs TO anon;
GRANT SELECT ON public.configuration TO anon;
GRANT SELECT ON public.system_notifications TO anon;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This completes the Quantex trading platform database setup
-- The schema includes:
-- ✅ User management with roles and KYC
-- ✅ Trading system with orders, trades, and transactions
-- ✅ Wallet management for multiple currencies
-- ✅ Deposit and withdrawal system
-- ✅ Mining pools and payouts
-- ✅ Admin operations and logging
-- ✅ Row Level Security (RLS) policies
-- ✅ Performance indexes
-- ✅ Initial data for configuration and crypto pairs
-- ✅ Automatic triggers for updated_at timestamps
-- ✅ User profile creation on signup

-- Next steps:
-- 1. Set up your environment variables
-- 2. Test the API endpoints
-- 3. Create an admin user using the bootstrap endpoint
-- 4. Configure your frontend to use the new schema
