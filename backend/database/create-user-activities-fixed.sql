-- =====================================================
-- USER ACTIVITIES TABLE - Fixed RLS Policies Version
-- Tracks user actions with NON-RECURSIVE RLS policies
-- =====================================================

-- Drop existing policies to ensure clean setup
DROP POLICY IF EXISTS "Admins can view all user activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON user_activities;
DROP POLICY IF EXISTS "Service role can manage activities" ON user_activities;

-- Create user_activities table with enhanced activity types for trading platform
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL, -- Make required for audit trails
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        -- Authentication Activities
        'login', 'logout', 'registration', 'password_changed', 'password_reset',
        'two_factor_enabled', 'two_factor_disabled',
        
        -- Trading Activities  
        'trade_created', 'trade_completed', 'trade_cancelled', 'trade_settled',
        'order_placed', 'order_cancelled', 'order_filled',
        
        -- Financial Activities
        'deposit', 'deposit_confirmed', 'withdrawal_requested', 'withdrawal_completed',
        'withdrawal_cancelled', 'balance_adjusted', 'fund_transfer',
        
        -- Account Management
        'profile_updated', 'account_frozen', 'account_unfrozen', 'account_suspended',
        'account_activated', 'kyc_submitted', 'kyc_approved', 'kyc_rejected',
        
        -- Security Events
        'suspicious_activity_detected', 'login_attempt_failed', 'device_registered',
        'api_key_created', 'api_key_revoked',
        
        -- Admin Actions
        'admin_action_performed', 'user_balance_modified', 'trade_outcome_set'
    )),
    activity_description TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}', -- Enhanced device tracking
    session_id TEXT, -- Track user sessions
    admin_user_id UUID REFERENCES auth.users(id), -- Track which admin performed action
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints for data integrity
    CONSTRAINT check_admin_actions CHECK (
        -- Ensure admin actions have admin_user_id
        (activity_type LIKE 'admin_%' AND admin_user_id IS NOT NULL) OR 
        (activity_type NOT LIKE 'admin_%')
    )
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_email ON user_activities(user_email);
CREATE INDEX IF NOT EXISTS idx_user_activities_session ON user_activities(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_activities_admin ON user_activities(admin_user_id) WHERE admin_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_activities_ip ON user_activities(ip_address) WHERE ip_address IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON user_activities(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_type_time ON user_activities(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_time ON user_activities(user_id, created_at DESC);

-- Enable RLS for security
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create NON-RECURSIVE RLS policies (CRITICAL FIX)

-- 1. Users can view their own activities
CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

-- 2. CRITICAL FIX: Admin policy using direct UUID comparison (NON-RECURSIVE)
-- This prevents infinite loops caused by referencing users table within RLS policy
CREATE POLICY "Admins can view all user activities" ON user_activities
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'::uuid
    );

-- 3. System can insert activities (service role and authenticated users)
CREATE POLICY "System can insert activities" ON user_activities
    FOR INSERT WITH CHECK (true);

-- 4. Service role can manage all activities
CREATE POLICY "Service role can manage activities" ON user_activities
    FOR ALL USING (auth.role() = 'service_role');

-- Grant appropriate permissions
GRANT SELECT ON user_activities TO authenticated;
GRANT INSERT ON user_activities TO authenticated, service_role;
GRANT ALL ON user_activities TO service_role;

-- Create helper function for logging activities
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_user_email TEXT,
    p_activity_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_session_id TEXT DEFAULT NULL,
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    -- Validate required parameters
    IF p_user_id IS NULL OR p_user_email IS NULL OR p_activity_type IS NULL THEN
        RAISE EXCEPTION 'INVALID_PARAMETERS: user_id, user_email, and activity_type are required';
    END IF;
    
    -- Insert activity log
    INSERT INTO user_activities (
        user_id, user_email, activity_type, activity_description,
        ip_address, user_agent, metadata, session_id, admin_user_id
    )
    VALUES (
        p_user_id, p_user_email, p_activity_type, p_description,
        p_ip_address, p_user_agent, p_metadata, p_session_id, p_admin_user_id
    )
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE WARNING 'Failed to log user activity for %: %', p_user_email, SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated, service_role;

-- Comprehensive verification
DO $$
DECLARE
    table_exists BOOLEAN;
    policy_count INTEGER;
    function_exists BOOLEAN;
    index_count INTEGER;
BEGIN
    -- Check table exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_activities' AND table_schema = 'public'
    ) INTO table_exists;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies WHERE tablename = 'user_activities';
    
    -- Check function exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'log_user_activity' AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes WHERE tablename = 'user_activities';
    
    -- Report status
    IF table_exists AND policy_count >= 4 AND function_exists AND index_count >= 7 THEN
        RAISE NOTICE 'SUCCESS: User activities system is ready for production';
        RAISE NOTICE 'Table: ✓ | Policies: % | Function: ✓ | Indexes: %', policy_count, index_count;
        RAISE NOTICE 'CRITICAL FIX: Non-recursive admin policy prevents RLS infinite loops';
    ELSE
        RAISE WARNING 'SETUP INCOMPLETE - Table: % | Policies: % | Function: % | Indexes: %', 
                     CASE WHEN table_exists THEN '✓' ELSE '✗' END,
                     policy_count,
                     CASE WHEN function_exists THEN '✓' ELSE '✗' END,
                     index_count;
    END IF;
END $$;

-- Show table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'user_email', 'activity_type', 'created_at') 
        THEN '✓ Core' 
        WHEN column_name IN ('ip_address', 'user_agent', 'metadata')
        THEN '○ Tracking'
        ELSE '◦ Enhanced'
    END as field_importance
FROM information_schema.columns 
WHERE table_name = 'user_activities' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show RLS policies for verification
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'user_activities'
ORDER BY policyname;

COMMIT;