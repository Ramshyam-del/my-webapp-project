-- Migration script to add trade management columns for admin win/loss system
-- Run this in your Supabase SQL Editor

BEGIN;

-- Add columns for admin trade management
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS admin_action TEXT CHECK (admin_action IN ('win', 'loss', 'pending'));

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMPTZ;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS trade_result TEXT CHECK (trade_result IN ('win', 'loss', 'pending'));

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS result_determined_at TIMESTAMPTZ;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS auto_expired BOOLEAN DEFAULT FALSE;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS final_pnl NUMERIC(20,8);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS start_ts TIMESTAMPTZ;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS expiry_ts TIMESTAMPTZ;

-- Set default values for existing trades
UPDATE trades 
SET 
    admin_action = 'pending',
    trade_result = 'pending',
    auto_expired = FALSE,
    start_ts = COALESCE(start_ts, created_at),
    expiry_ts = COALESCE(expiry_ts, expires_at)
WHERE admin_action IS NULL OR trade_result IS NULL;

-- Add comments to explain the columns
COMMENT ON COLUMN trades.admin_action IS 'Admin decision: win, loss, or pending';
COMMENT ON COLUMN trades.admin_action_at IS 'Timestamp when admin made the decision';
COMMENT ON COLUMN trades.admin_user_id IS 'ID of admin who made the decision';
COMMENT ON COLUMN trades.trade_result IS 'Final trade result: win, loss, or pending';
COMMENT ON COLUMN trades.result_determined_at IS 'When the trade result was determined';
COMMENT ON COLUMN trades.auto_expired IS 'Whether trade was auto-expired to loss';
COMMENT ON COLUMN trades.final_pnl IS 'Final profit/loss amount';
COMMENT ON COLUMN trades.duration_seconds IS 'Trade duration in seconds';
COMMENT ON COLUMN trades.start_ts IS 'Trade start timestamp';
COMMENT ON COLUMN trades.expiry_ts IS 'Trade expiry timestamp';

-- Create index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_trades_admin_action ON trades(admin_action);
CREATE INDEX IF NOT EXISTS idx_trades_trade_result ON trades(trade_result);
CREATE INDEX IF NOT EXISTS idx_trades_expiry_ts ON trades(expiry_ts);
CREATE INDEX IF NOT EXISTS idx_trades_start_ts ON trades(start_ts);

-- Create function to auto-expire trades
CREATE OR REPLACE FUNCTION auto_expire_trades()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
BEGIN
    -- Update trades that have expired and no admin action taken
    UPDATE trades 
    SET 
        trade_result = 'loss',
        auto_expired = TRUE,
        result_determined_at = NOW(),
        final_pnl = -amount,
        status = 'completed'
    WHERE 
        expiry_ts <= NOW() 
        AND admin_action = 'pending' 
        AND trade_result = 'pending'
        AND status = 'OPEN';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND column_name IN ('admin_action', 'admin_action_at', 'admin_user_id', 'trade_result', 'result_determined_at', 'auto_expired', 'final_pnl', 'duration_seconds', 'start_ts', 'expiry_ts')
ORDER BY column_name;

COMMIT;