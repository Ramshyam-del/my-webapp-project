-- Create dedicated withdrawals table for user withdrawal requests
-- This is separate from fund_transactions which is used for admin operations

BEGIN;

-- Create withdrawals table for user withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT')),
    amount NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
    withdrawal_address TEXT NOT NULL,
    network TEXT NOT NULL, -- e.g., 'ethereum', 'bitcoin', 'tron'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'locked', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    
    -- Admin management fields
    locked_by UUID REFERENCES auth.users(id), -- Admin who locked the withdrawal
    locked_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id), -- Admin who approved/rejected
    processed_at TIMESTAMPTZ,
    
    -- Transaction details
    transaction_hash TEXT, -- Blockchain transaction hash when completed
    fee_amount NUMERIC(20, 8) DEFAULT 0,
    fee_currency TEXT,
    
    -- Additional info
    user_note TEXT, -- User's note/reason for withdrawal
    admin_note TEXT, -- Admin's note for approval/rejection
    failure_reason TEXT, -- Reason if withdrawal failed
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_currency ON withdrawals(currency);
CREATE INDEX IF NOT EXISTS idx_withdrawals_locked_by ON withdrawals(locked_by);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_by ON withdrawals(processed_by);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own withdrawals
CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals" ON withdrawals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can update withdrawals (lock, approve, reject)
CREATE POLICY "Admins can manage withdrawals" ON withdrawals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Service role can manage all withdrawals
CREATE POLICY "Service role can manage all withdrawals" ON withdrawals
    FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT ON withdrawals TO authenticated;
GRANT ALL ON withdrawals TO service_role;

-- Create function to handle withdrawal status changes
CREATE OR REPLACE FUNCTION handle_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Set processed_at when status changes to approved/rejected
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        NEW.processed_at = NOW();
    END IF;
    
    -- Set locked_at when status changes to locked
    IF OLD.status != 'locked' AND NEW.status = 'locked' THEN
        NEW.locked_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
CREATE TRIGGER withdrawal_status_change_trigger
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION handle_withdrawal_status_change();

COMMIT;

-- Success message
SELECT 'Withdrawals table created successfully!' as status;