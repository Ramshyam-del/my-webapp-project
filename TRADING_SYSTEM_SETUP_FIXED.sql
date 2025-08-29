-- Drop existing trades table if it exists (to recreate with new structure)
DROP TABLE IF EXISTS public.trades CASCADE;

-- Users' per-currency balances
CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  currency text NOT NULL,                       -- e.g. USDT, BTC, ETH (balance bookkeeping currency)
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

-- Admin fund transactions
CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  currency text NOT NULL,
  amount numeric NOT NULL,                      -- positive for recharge, negative for withdraw
  type text NOT NULL CHECK (type IN ('RECHARGE','WITHDRAW')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text                               -- admin id (optional)
);

-- Trades table with new structure
CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  currency text NOT NULL,                       -- e.g. USDT (portfolio currency)
  pair text NOT NULL,                           -- e.g. BTC/USDT
  leverage numeric NOT NULL,
  duration text NOT NULL,                       -- e.g. 1m,5m,15m,1h
  amount numeric NOT NULL,                      -- stake in 'currency'
  start_ts timestamptz NOT NULL DEFAULT now(),
  expiry_ts timestamptz,
  admin_decision text CHECK (admin_decision IN ('WIN','LOSS')),  -- nullable until chosen
  outcome text CHECK (outcome IN ('WIN','LOSS')),                -- final result at settlement
  settled boolean NOT NULL DEFAULT false,
  settled_at timestamptz,
  pnl numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','SETTLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_currency ON public.portfolios(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_trades_user ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_expiry ON public.trades(expiry_ts);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_settled ON public.trades(settled);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS select_own_portfolio ON public.portfolios;
DROP POLICY IF EXISTS select_own_trades ON public.trades;
DROP POLICY IF EXISTS admin_all_portfolios ON public.portfolios;
DROP POLICY IF EXISTS admin_all_fund_transactions ON public.fund_transactions;
DROP POLICY IF EXISTS admin_all_trades ON public.trades;

-- Create policies for authenticated users
CREATE POLICY select_own_portfolio ON public.portfolios FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY select_own_trades ON public.trades FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Create policies for admin access (service role)
CREATE POLICY admin_all_portfolios ON public.portfolios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY admin_all_fund_transactions ON public.fund_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY admin_all_trades ON public.trades FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create exec_sql function for atomic operations
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result json;
BEGIN
  EXECUTE query;
  RETURN '{}'::json;
END $$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon, authenticated, service_role;
