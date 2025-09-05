-- Create crypto deposits and wallet management tables
-- Run this in your Supabase SQL Editor

-- Create fund_transactions table if it doesn't exist (for existing transaction tracking)
CREATE TABLE IF NOT EXISTS fund_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'recharge', 'RECHARGE', 'WITHDRAW')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  remark TEXT,
  admin_id UUID REFERENCES auth.users(id),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crypto_deposits table for tracking blockchain deposits
CREATE TABLE IF NOT EXISTS crypto_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT')),
  deposit_address TEXT NOT NULL,
  transaction_hash TEXT UNIQUE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'completed', 'failed')),
  block_number BIGINT,
  network TEXT, -- e.g., 'ethereum', 'bitcoin', 'tron'
  from_address TEXT,
  gas_fee NUMERIC DEFAULT 0,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_wallet_addresses table for managing user deposit addresses
CREATE TABLE IF NOT EXISTS user_wallet_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT')),
  address TEXT NOT NULL,
  network TEXT NOT NULL, -- e.g., 'ethereum', 'bitcoin', 'tron'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, currency, network)
);

-- Create deposit_monitoring_config table for blockchain monitoring settings
CREATE TABLE IF NOT EXISTS deposit_monitoring_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL UNIQUE CHECK (currency IN ('BTC', 'ETH', 'USDT')),
  network TEXT NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  min_confirmations INTEGER DEFAULT 3,
  min_deposit_amount NUMERIC DEFAULT 0.001,
  is_enabled BOOLEAN DEFAULT true,
  last_checked_block BIGINT DEFAULT 0,
  check_interval_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_currency ON crypto_deposits(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_address ON crypto_deposits(deposit_address);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_created_at ON crypto_deposits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_user_id ON user_wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_currency ON user_wallet_addresses(currency);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_address ON user_wallet_addresses(address);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Create RLS policies for crypto_deposits
CREATE POLICY "Users can view own crypto deposits" ON crypto_deposits
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Admins can view all crypto deposits" ON crypto_deposits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::uuid = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage crypto deposits" ON crypto_deposits
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for user_wallet_addresses
CREATE POLICY "Users can view own wallet addresses" ON user_wallet_addresses
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can insert own wallet addresses" ON user_wallet_addresses
  FOR INSERT WITH CHECK (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Admins can view all wallet addresses" ON user_wallet_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::uuid = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage wallet addresses" ON user_wallet_addresses
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for deposit_monitoring_config
CREATE POLICY "Admins can manage monitoring config" ON deposit_monitoring_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::uuid = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage monitoring config" ON deposit_monitoring_config
  FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for fund_transactions
CREATE POLICY "Users can view own fund transactions" ON fund_transactions
  FOR SELECT USING (user_id::uuid = auth.uid()::uuid);

CREATE POLICY "Admins can view all fund transactions" ON fund_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::uuid = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage fund transactions" ON fund_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default monitoring configuration
INSERT INTO deposit_monitoring_config (currency, network, min_confirmations, min_deposit_amount, check_interval_seconds)
VALUES 
  ('BTC', 'bitcoin', 3, 0.0001, 60),
  ('ETH', 'ethereum', 12, 0.001, 30),
  ('USDT', 'ethereum', 12, 1.0, 30)
ON CONFLICT (currency) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON crypto_deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_wallet_addresses TO authenticated;
GRANT SELECT ON deposit_monitoring_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fund_transactions TO authenticated;

GRANT ALL ON crypto_deposits TO service_role;
GRANT ALL ON user_wallet_addresses TO service_role;
GRANT ALL ON deposit_monitoring_config TO service_role;
GRANT ALL ON fund_transactions TO service_role;

COMMIT;