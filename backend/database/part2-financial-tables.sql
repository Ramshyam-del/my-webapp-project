-- =====================================================
-- QUANTEX TRADING PLATFORM - PART 2 of 4
-- Portfolios & Fund Management Tables
-- =====================================================

-- =====================================================
-- PORTFOLIOS TABLE FOR BALANCE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB')),
    
    -- High precision balances for cryptocurrency
    balance NUMERIC(20,8) DEFAULT 0 CHECK (balance >= 0),
    available_balance NUMERIC(20,8) DEFAULT 0 CHECK (available_balance >= 0),
    locked_balance NUMERIC(20,8) DEFAULT 0 CHECK (locked_balance >= 0),
    
    -- Audit trail
    last_transaction_id UUID,
    last_updated_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, currency),
    CHECK (locked_balance <= balance),
    CHECK (available_balance <= balance),
    CHECK (available_balance + locked_balance = balance)
);

-- Portfolios indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_currency ON portfolios(currency);
CREATE INDEX IF NOT EXISTS idx_portfolios_balance ON portfolios(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON portfolios(updated_at DESC);

-- =====================================================
-- FUND TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS fund_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USD', 'EUR', 'USDC', 'BNB')),
    amount NUMERIC(20,8) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'recharge', 'RECHARGE', 'WITHDRAW', 'bonus', 'penalty')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected')),
    
    -- Enhanced tracking
    transaction_reference TEXT,
    blockchain_tx_hash TEXT,
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
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (fee_amount >= 0)
);

-- Fund transactions indexes
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_currency ON fund_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_admin ON fund_transactions(admin_id) WHERE admin_id IS NOT NULL;

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
    required_confirmations INTEGER DEFAULT 3 CHECK (required_confirmations > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed', 'orphaned')),
    
    -- Blockchain details
    block_number BIGINT,
    block_hash TEXT,
    network TEXT NOT NULL,
    from_address TEXT,
    gas_fee NUMERIC(20,8) DEFAULT 0,
    
    -- Processing tracking
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    confirmed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    credited_to_portfolio BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (confirmations <= required_confirmations OR status = 'completed'),
    CHECK (gas_fee >= 0)
);

-- Crypto deposits indexes
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_currency ON crypto_deposits(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_created_at ON crypto_deposits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_network ON crypto_deposits(network);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_confirmations ON crypto_deposits(confirmations, status);

-- =====================================================
-- USER WALLET ADDRESSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_wallet_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'USDC', 'BNB')),
    address TEXT NOT NULL,
    network TEXT NOT NULL CHECK (network IN ('bitcoin', 'ethereum', 'tron', 'binance-smart-chain')),
    
    -- Management
    is_active BOOLEAN DEFAULT true,
    is_monitored BOOLEAN DEFAULT true,
    address_label TEXT,
    
    -- Usage tracking
    total_deposits_count INTEGER DEFAULT 0,
    total_deposits_amount NUMERIC(20,8) DEFAULT 0,
    last_deposit_at TIMESTAMPTZ,
    
    -- Security
    created_by_admin UUID REFERENCES auth.users(id),
    deactivated_by UUID REFERENCES auth.users(id),
    deactivated_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(user_id, currency, network),
    UNIQUE(address, network),
    CHECK (total_deposits_count >= 0),
    CHECK (total_deposits_amount >= 0)
);

-- User wallet addresses indexes
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_user_id ON user_wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_currency ON user_wallet_addresses(currency);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_address ON user_wallet_addresses(address);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_active ON user_wallet_addresses(is_active, is_monitored) WHERE is_active = true;

COMMIT;

-- =====================================================
-- VERIFICATION FOR PART 2
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count tables created
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('portfolios', 'fund_transactions', 'crypto_deposits', 'user_wallet_addresses')
    AND table_schema = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename IN ('portfolios', 'fund_transactions', 'crypto_deposits', 'user_wallet_addresses');
    
    RAISE NOTICE '✅ PART 2 COMPLETE: Financial & Crypto Tables';
    RAISE NOTICE '   Tables Created: % | Indexes: %', table_count, index_count;
    RAISE NOTICE '💰 PORTFOLIOS: Multi-currency balance tracking with NUMERIC(20,8) precision';
    RAISE NOTICE '🔒 CRYPTO DEPOSITS: Blockchain confirmation tracking with gas fees';
    RAISE NOTICE '💳 WALLET ADDRESSES: User crypto address management with monitoring';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT: Run Part 3 - User Activities & Monitoring';
END $$;
    RAISE NOTICE '🔗 CRYPTO DEPOSITS: Blockchain integration with confirmation tracking';
    RAISE NOTICE '📱 WALLET ADDRESSES: User deposit address management with security';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT: Run Part 3 - User Activities & Monitoring';
END $$;