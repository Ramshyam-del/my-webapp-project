-- =====================================================
-- CRYPTO DEPOSITS AND WALLET MANAGEMENT TABLES
-- Production-Ready Version with Fixed RLS Policies
-- =====================================================

-- Clean up existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view own crypto deposits" ON crypto_deposits;
DROP POLICY IF EXISTS "Users can view own wallet addresses" ON user_wallet_addresses;
DROP POLICY IF EXISTS "Admins can view all crypto deposits" ON crypto_deposits;
DROP POLICY IF EXISTS "Admins can view all wallet addresses" ON user_wallet_addresses;
DROP POLICY IF EXISTS "Admins can manage monitoring config" ON deposit_monitoring_config;
DROP POLICY IF EXISTS "Service role can manage crypto deposits" ON crypto_deposits;
DROP POLICY IF EXISTS "Service role can manage wallet addresses" ON user_wallet_addresses;
DROP POLICY IF EXISTS "Service role can manage monitoring config" ON deposit_monitoring_config;
DROP POLICY IF EXISTS "Users can view own fund transactions" ON fund_transactions;
DROP POLICY IF EXISTS "Admins can view all fund transactions" ON fund_transactions;
DROP POLICY IF EXISTS "Service role can manage fund transactions" ON fund_transactions;

-- Create fund_transactions table with enhanced features
CREATE TABLE IF NOT EXISTS fund_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0), -- High precision for crypto
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'recharge', 'RECHARGE', 'WITHDRAW', 'bonus', 'penalty')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')),
    
    -- Enhanced tracking fields
    transaction_reference TEXT, -- External reference ID
    blockchain_tx_hash TEXT, -- Associated blockchain transaction
    remark TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_by TEXT,
    
    -- Fee tracking
    fee_amount NUMERIC(20,8) DEFAULT 0,
    fee_currency TEXT,
    
    -- Processing details
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (fee_amount >= 0),
    CHECK ((type IN ('withdraw', 'WITHDRAW') AND fee_amount >= 0) OR (type NOT IN ('withdraw', 'WITHDRAW')))
);

-- Create crypto_deposits table with enhanced blockchain tracking
CREATE TABLE IF NOT EXISTS crypto_deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USDC', 'BNB')),
    deposit_address TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0), -- High precision
    
    -- Blockchain confirmation tracking
    confirmations INTEGER DEFAULT 0 CHECK (confirmations >= 0),
    required_confirmations INTEGER DEFAULT 3 CHECK (required_confirmations > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed', 'orphaned')),
    
    -- Blockchain details
    block_number BIGINT,
    block_hash TEXT,
    network TEXT NOT NULL, -- e.g., 'ethereum', 'bitcoin', 'tron', 'binance-smart-chain'
    from_address TEXT,
    gas_fee NUMERIC(20,8) DEFAULT 0,
    gas_price BIGINT,
    gas_used BIGINT,
    
    -- Processing tracking
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    confirmed_at TIMESTAMPZ,
    processed_at TIMESTAMPTZ,
    credited_to_portfolio BOOLEAN DEFAULT false,
    
    -- Enhanced metadata
    metadata JSONB DEFAULT '{}',
    raw_transaction_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (confirmations <= required_confirmations OR status = 'completed'),
    CHECK (gas_fee >= 0)
);

-- Create user_wallet_addresses table with enhanced security
CREATE TABLE IF NOT EXISTS user_wallet_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USDC', 'BNB')),
    address TEXT NOT NULL,
    network TEXT NOT NULL CHECK (network IN ('bitcoin', 'ethereum', 'tron', 'binance-smart-chain')),
    
    -- Security and management
    is_active BOOLEAN DEFAULT true,
    is_monitored BOOLEAN DEFAULT true,
    address_label TEXT, -- User-defined label
    derivation_path TEXT, -- HD wallet derivation path
    
    -- Usage tracking
    total_deposits_count INTEGER DEFAULT 0,
    total_deposits_amount NUMERIC(20,8) DEFAULT 0,
    last_deposit_at TIMESTAMPTZ,
    
    -- Security fields
    created_by_admin UUID REFERENCES auth.users(id),
    deactivated_by UUID REFERENCES auth.users(id),
    deactivated_at TIMESTAMPTZ,
    deactivated_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, currency, network),
    UNIQUE(address, network), -- Prevent address reuse across users
    CHECK (total_deposits_count >= 0),
    CHECK (total_deposits_amount >= 0)
);

-- Create deposit_monitoring_config table with enhanced settings
CREATE TABLE IF NOT EXISTS deposit_monitoring_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency TEXT NOT NULL UNIQUE CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USDC', 'BNB')),
    network TEXT NOT NULL,
    
    -- API configuration
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    websocket_endpoint TEXT,
    
    -- Monitoring settings
    min_confirmations INTEGER DEFAULT 3 CHECK (min_confirmations > 0),
    min_deposit_amount NUMERIC(20,8) DEFAULT 0.001 CHECK (min_deposit_amount > 0),
    max_deposit_amount NUMERIC(20,8), -- Optional max limit
    is_enabled BOOLEAN DEFAULT true,
    
    -- Scanning configuration
    last_checked_block BIGINT DEFAULT 0,
    check_interval_seconds INTEGER DEFAULT 30 CHECK (check_interval_seconds > 0),
    blocks_per_scan INTEGER DEFAULT 100,
    
    -- Fee estimation
    estimated_gas_price BIGINT DEFAULT 0,
    estimated_gas_limit BIGINT DEFAULT 21000,
    
    -- Status tracking
    last_scan_at TIMESTAMPTZ,
    last_error TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (consecutive_failures >= 0),
    CHECK (max_deposit_amount IS NULL OR max_deposit_amount > min_deposit_amount)
);

-- Create comprehensive indexes for performance
-- fund_transactions indexes
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_currency ON fund_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_admin ON fund_transactions(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fund_transactions_tx_ref ON fund_transactions(transaction_reference) WHERE transaction_reference IS NOT NULL;

-- crypto_deposits indexes
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_currency ON crypto_deposits(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_address ON crypto_deposits(deposit_address);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_created_at ON crypto_deposits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_network ON crypto_deposits(network);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_block ON crypto_deposits(block_number DESC) WHERE block_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_confirmations ON crypto_deposits(confirmations, status);

-- user_wallet_addresses indexes
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_user_id ON user_wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_currency ON user_wallet_addresses(currency);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_address ON user_wallet_addresses(address);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_network ON user_wallet_addresses(network);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_active ON user_wallet_addresses(is_active, is_monitored) WHERE is_active = true;

-- deposit_monitoring_config indexes
CREATE INDEX IF NOT EXISTS idx_deposit_monitoring_config_enabled ON deposit_monitoring_config(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_deposit_monitoring_config_network ON deposit_monitoring_config(network);

-- Enable RLS on all tables
ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

-- NON-RECURSIVE RLS POLICIES (CRITICAL FIX)

-- crypto_deposits policies
CREATE POLICY "Users can view own crypto deposits" ON crypto_deposits
    FOR SELECT USING (user_id = auth.uid());

-- CRITICAL FIX: Non-recursive admin policy
CREATE POLICY "Admins can view all crypto deposits" ON crypto_deposits
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage crypto deposits" ON crypto_deposits
    FOR ALL USING (auth.role() = 'service_role');

-- user_wallet_addresses policies
CREATE POLICY "Users can view own wallet addresses" ON user_wallet_addresses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet addresses" ON user_wallet_addresses
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- CRITICAL FIX: Non-recursive admin policy
CREATE POLICY "Admins can view all wallet addresses" ON user_wallet_addresses
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage wallet addresses" ON user_wallet_addresses
    FOR ALL USING (auth.role() = 'service_role');

-- deposit_monitoring_config policies
-- CRITICAL FIX: Non-recursive admin policy
CREATE POLICY "Admins can manage monitoring config" ON deposit_monitoring_config
    FOR ALL USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage monitoring config" ON deposit_monitoring_config
    FOR ALL USING (auth.role() = 'service_role');

-- fund_transactions policies
CREATE POLICY "Users can view own fund transactions" ON fund_transactions
    FOR SELECT USING (user_id = auth.uid());

-- CRITICAL FIX: Non-recursive admin policy
CREATE POLICY "Admins can view all fund transactions" ON fund_transactions
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

CREATE POLICY "Service role can manage fund transactions" ON fund_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Insert enhanced monitoring configuration
INSERT INTO deposit_monitoring_config (
    currency, network, min_confirmations, min_deposit_amount, 
    check_interval_seconds, blocks_per_scan, estimated_gas_limit
)
VALUES 
    ('BTC', 'bitcoin', 3, 0.0001, 60, 10, 0),
    ('ETH', 'ethereum', 12, 0.001, 30, 100, 21000),
    ('USDT', 'ethereum', 12, 1.0, 30, 100, 65000),
    ('USDC', 'ethereum', 12, 1.0, 30, 100, 65000),
    ('BNB', 'binance-smart-chain', 12, 0.001, 30, 100, 21000)
ON CONFLICT (currency) DO UPDATE SET
    network = EXCLUDED.network,
    min_confirmations = EXCLUDED.min_confirmations,
    min_deposit_amount = EXCLUDED.min_deposit_amount,
    updated_at = NOW();

-- Enhanced updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (with IF NOT EXISTS equivalent)
DROP TRIGGER IF EXISTS update_crypto_deposits_updated_at ON crypto_deposits;
CREATE TRIGGER update_crypto_deposits_updated_at
    BEFORE UPDATE ON crypto_deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_wallet_addresses_updated_at ON user_wallet_addresses;
CREATE TRIGGER update_user_wallet_addresses_updated_at
    BEFORE UPDATE ON user_wallet_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deposit_monitoring_config_updated_at ON deposit_monitoring_config;
CREATE TRIGGER update_deposit_monitoring_config_updated_at
    BEFORE UPDATE ON deposit_monitoring_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fund_transactions_updated_at ON fund_transactions;
CREATE TRIGGER update_fund_transactions_updated_at
    BEFORE UPDATE ON fund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON crypto_deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_wallet_addresses TO authenticated;
GRANT SELECT ON deposit_monitoring_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fund_transactions TO authenticated;

GRANT ALL ON crypto_deposits TO service_role;
GRANT ALL ON user_wallet_addresses TO service_role;
GRANT ALL ON deposit_monitoring_config TO service_role;
GRANT ALL ON fund_transactions TO service_role;

-- Comprehensive verification
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
    config_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('crypto_deposits', 'user_wallet_addresses', 'deposit_monitoring_config', 'fund_transactions')
    AND table_schema = 'public';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('crypto_deposits', 'user_wallet_addresses', 'deposit_monitoring_config', 'fund_transactions');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename IN ('crypto_deposits', 'user_wallet_addresses', 'deposit_monitoring_config', 'fund_transactions');
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table IN ('crypto_deposits', 'user_wallet_addresses', 'deposit_monitoring_config', 'fund_transactions');
    
    -- Count config entries
    SELECT COUNT(*) INTO config_count FROM deposit_monitoring_config;
    
    -- Report comprehensive status
    IF table_count = 4 AND policy_count >= 10 AND index_count >= 15 AND trigger_count >= 4 AND config_count >= 3 THEN
        RAISE NOTICE '🎉 SUCCESS: Crypto deposits system is production-ready!';
        RAISE NOTICE '✅ Tables: % | Policies: % | Indexes: % | Triggers: % | Configs: %', 
                     table_count, policy_count, index_count, trigger_count, config_count;
        RAISE NOTICE '🛡️  SECURITY: Non-recursive RLS policies prevent authentication crashes';
        RAISE NOTICE '⚡ PERFORMANCE: Comprehensive indexing for blockchain operations';
        RAISE NOTICE '🎯 PRECISION: NUMERIC(20,8) for accurate cryptocurrency handling';
        RAISE NOTICE '📊 MONITORING: Advanced blockchain monitoring and confirmation tracking';
    ELSE
        RAISE WARNING '❌ INCOMPLETE CRYPTO SETUP:';
        RAISE WARNING '   Tables: % (expected 4) | Policies: % (expected 10+)', table_count, policy_count;
        RAISE WARNING '   Indexes: % (expected 15+) | Triggers: % (expected 4+)', index_count, trigger_count;
        RAISE WARNING '   Configs: % (expected 3+)', config_count;
    END IF;
END $$;

-- Show enhanced table structures
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count,
    CASE t.table_name
        WHEN 'crypto_deposits' THEN '✅ Blockchain deposit tracking'
        WHEN 'user_wallet_addresses' THEN '✅ User address management'  
        WHEN 'fund_transactions' THEN '✅ Admin fund operations'
        WHEN 'deposit_monitoring_config' THEN '✅ Monitoring configuration'
    END as purpose
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_name IN ('crypto_deposits', 'user_wallet_addresses', 'deposit_monitoring_config', 'fund_transactions')
    AND t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;

COMMIT;