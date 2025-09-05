-- =====================================================
-- QUANTEX CRYPTO DEPOSITS TABLES CREATION SCRIPT
-- Execute this script in your Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create crypto_deposits table for tracking blockchain deposits
CREATE TABLE IF NOT EXISTS public.crypto_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- Create user_wallet_addresses table for managing user crypto addresses
CREATE TABLE IF NOT EXISTS public.user_wallet_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT')),
  address TEXT NOT NULL,
  network TEXT NOT NULL, -- e.g., 'ethereum', 'bitcoin', 'tron'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, currency, network)
);

-- Create deposit_monitoring_config table for blockchain monitoring settings
CREATE TABLE IF NOT EXISTS public.deposit_monitoring_config (
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

-- Create fund_transactions table for tracking all financial transactions
CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'fee', 'bonus', 'referral')),
  currency TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance_before NUMERIC DEFAULT 0,
  balance_after NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id UUID, -- Links to deposits, trades, etc.
  reference_type TEXT, -- 'crypto_deposit', 'trade', etc.
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON public.crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON public.crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_currency ON public.crypto_deposits(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON public.crypto_deposits(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_user_id ON public.user_wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_currency ON public.user_wallet_addresses(currency);
CREATE INDEX IF NOT EXISTS idx_user_wallet_addresses_active ON public.user_wallet_addresses(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_deposit_monitoring_config_enabled ON public.deposit_monitoring_config(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_deposit_monitoring_config_network ON public.deposit_monitoring_config(network);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON public.fund_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON public.fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_status ON public.fund_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_currency ON public.fund_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON public.fund_transactions(created_at);

-- Insert default monitoring configuration
INSERT INTO public.deposit_monitoring_config (currency, network, min_confirmations, min_deposit_amount, check_interval_seconds)
VALUES 
  ('BTC', 'bitcoin', 3, 0.0001, 60),
  ('ETH', 'ethereum', 12, 0.001, 30),
  ('USDT', 'ethereum', 12, 1.0, 30)
ON CONFLICT (currency) DO NOTHING;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crypto_deposits
CREATE POLICY "Users can view own deposits" ON public.crypto_deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all deposits" ON public.crypto_deposits
  FOR ALL USING (true);

-- Create RLS policies for user_wallet_addresses
CREATE POLICY "Users can view own wallet addresses" ON public.user_wallet_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all wallet addresses" ON public.user_wallet_addresses
  FOR ALL USING (true);

-- Create RLS policies for deposit_monitoring_config
CREATE POLICY "Service role can manage monitoring config" ON public.deposit_monitoring_config
  FOR ALL USING (true);

-- Create RLS policies for fund_transactions
CREATE POLICY "Users can view own transactions" ON public.fund_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions" ON public.fund_transactions
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.crypto_deposits TO authenticated;
GRANT SELECT ON public.user_wallet_addresses TO authenticated;
GRANT SELECT ON public.deposit_monitoring_config TO authenticated;
GRANT SELECT ON public.fund_transactions TO authenticated;

GRANT ALL ON public.crypto_deposits TO service_role;
GRANT ALL ON public.user_wallet_addresses TO service_role;
GRANT ALL ON public.deposit_monitoring_config TO service_role;
GRANT ALL ON public.fund_transactions TO service_role;

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crypto_deposits_updated_at
  BEFORE UPDATE ON public.crypto_deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallet_addresses_updated_at
  BEFORE UPDATE ON public.user_wallet_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposit_monitoring_config_updated_at
  BEFORE UPDATE ON public.deposit_monitoring_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fund_transactions_updated_at
  BEFORE UPDATE ON public.fund_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification: Show created tables
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('crypto_deposits', 'user_wallet_addresses', 'deposit_monitoring_config', 'fund_transactions')
ORDER BY table_name;

-- Success message
SELECT 'All tables created successfully!' as status;