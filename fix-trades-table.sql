-- Drop existing trades table if it exists
DROP TABLE IF EXISTS public.trades CASCADE;

-- Create trades table for Win/Loss tracking
CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  pair text NOT NULL,
  side text NOT NULL CHECK (side IN ('LONG','SHORT')),
  leverage numeric NOT NULL,
  duration text NOT NULL,
  amount numeric NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  pnl numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','WIN','LOSS')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX trades_user_idx ON public.trades(user_id);
CREATE INDEX trades_status_idx ON public.trades(status);
CREATE INDEX trades_created_idx ON public.trades(created_at DESC);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY insert_own_trades
ON public.trades FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY select_own_trades
ON public.trades FOR SELECT TO authenticated
USING (auth.uid()::text = user_id);

-- Create policy for admin access (service role)
CREATE POLICY admin_all_trades
ON public.trades FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_trades_updated_at ON public.trades;
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
