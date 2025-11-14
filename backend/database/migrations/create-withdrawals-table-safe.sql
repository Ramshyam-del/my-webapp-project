-- Create dedicated withdrawals table for user withdrawal requests
-- Simplified version with only essential columns

BEGIN;

-- Create withdrawals table for user withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT')),
    amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
    withdrawal_address TEXT NOT NULL,
    network TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
    transaction_hash TEXT,
    fee_amount NUMERIC(20, 8) DEFAULT 0,
    admin_note TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_currency ON withdrawals(currency);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Service role can manage all withdrawals" ON withdrawals;

-- Create RLS Policies
-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own withdrawals
CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can manage all withdrawals
CREATE POLICY "Service role can manage all withdrawals" ON withdrawals
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON withdrawals TO authenticated;
GRANT ALL ON withdrawals TO service_role;

COMMIT;

-- Success message
SELECT 'Withdrawals table created/updated successfully!' as status;