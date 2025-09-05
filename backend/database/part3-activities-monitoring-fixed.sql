-- =====================================================
-- QUANTEX TRADING PLATFORM - PART 3 of 4
-- User Activities & Monitoring Configuration
-- =====================================================

-- =====================================================
-- USER ACTIVITIES TABLE FOR AUDIT TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
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
        
        -- Admin Actions
        'admin_action_performed', 'user_balance_modified', 'trade_outcome_set'
    )),
    activity_description TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    session_id TEXT,
    admin_user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints for data integrity
    CONSTRAINT check_admin_actions CHECK (
        (activity_type LIKE 'admin_%' AND admin_user_id IS NOT NULL) OR 
        (activity_type NOT LIKE 'admin_%')
    )
);

-- User activities indexes
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

-- =====================================================
-- DEPOSIT MONITORING CONFIGURATION TABLE
-- =====================================================

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
    max_deposit_amount NUMERIC(20,8),
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

-- Deposit monitoring config indexes
CREATE INDEX IF NOT EXISTS idx_deposit_monitoring_config_enabled ON deposit_monitoring_config(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_deposit_monitoring_config_network ON deposit_monitoring_config(network);

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

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to log user activities
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

-- Function to update user status with audit trail
CREATE OR REPLACE FUNCTION update_user_status(
    p_user_id UUID,
    p_new_status TEXT,
    p_reason TEXT,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    old_status TEXT;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user exists and get current status
    SELECT status INTO old_status FROM users WHERE id = p_user_id;
    
    IF FOUND THEN
        user_exists := TRUE;
        
        -- Only update if status is different
        IF old_status != p_new_status THEN
            UPDATE users 
            SET 
                status = p_new_status,
                status_changed_by = p_admin_id,
                status_changed_at = NOW(),
                status_change_reason = p_reason,
                updated_at = NOW()
            WHERE id = p_user_id;
            
            -- Log activity
            PERFORM log_user_activity(
                p_user_id,
                (SELECT email FROM users WHERE id = p_user_id),
                'account_status_changed',
                'Status changed from ' || old_status || ' to ' || p_new_status,
                NULL,
                NULL,
                jsonb_build_object(
                    'old_status', old_status,
                    'new_status', p_new_status,
                    'reason', p_reason,
                    'admin_id', p_admin_id
                ),
                NULL,
                p_admin_id
            );
            
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN user_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can trade
CREATE OR REPLACE FUNCTION can_user_trade(p_user_id UUID)
RETURNS TABLE(
    can_trade BOOLEAN,
    can_deposit BOOLEAN,
    can_withdraw BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT 
        status, 
        trading_enabled, 
        deposit_enabled, 
        withdrawal_enabled,
        verification_level,
        locked_until
    INTO user_record
    FROM users 
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, FALSE, FALSE, 'User not found';
        RETURN;
    END IF;
    
    -- Check if account is locked
    IF user_record.locked_until IS NOT NULL AND user_record.locked_until > NOW() THEN
        RETURN QUERY SELECT FALSE, FALSE, FALSE, 'Account temporarily locked';
        RETURN;
    END IF;
    
    -- Check account status
    CASE user_record.status
        WHEN 'active' THEN
            RETURN QUERY SELECT 
                user_record.trading_enabled,
                user_record.deposit_enabled,
                user_record.withdrawal_enabled,
                'Account active';
        WHEN 'suspended' THEN
            RETURN QUERY SELECT FALSE, FALSE, FALSE, 'Account suspended';
        WHEN 'banned' THEN
            RETURN QUERY SELECT FALSE, FALSE, FALSE, 'Account banned';
        WHEN 'frozen' THEN
            RETURN QUERY SELECT FALSE, FALSE, FALSE, 'Account frozen';
        WHEN 'pending_verification' THEN
            RETURN QUERY SELECT FALSE, user_record.deposit_enabled, FALSE, 'Pending verification';
        ELSE
            RETURN QUERY SELECT FALSE, FALSE, FALSE, 'Account inactive';
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_user_status TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION can_user_trade TO authenticated, service_role;

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION & TRIGGERS
-- =====================================================

-- Enhanced updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_deposit_monitoring_config_updated_at ON deposit_monitoring_config;

CREATE TRIGGER update_deposit_monitoring_config_updated_at
    BEFORE UPDATE ON deposit_monitoring_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =====================================================
-- VERIFICATION FOR PART 3
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    config_count INTEGER;
BEGIN
    -- Count new tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('user_activities', 'deposit_monitoring_config')
    AND table_schema = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name IN ('log_user_activity', 'update_user_status', 'can_user_trade')
    AND routine_schema = 'public';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%updated_at%';
    
    -- Count config entries
    SELECT COUNT(*) INTO config_count FROM deposit_monitoring_config;
    
    RAISE NOTICE '✅ PART 3 COMPLETE: Activities & Monitoring';
    RAISE NOTICE '   Tables: % | Functions: % | Triggers: % | Configs: %', table_count, function_count, trigger_count, config_count;
    RAISE NOTICE '📊 USER ACTIVITIES: Comprehensive audit logging with 20+ activity types';
    RAISE NOTICE '🔍 MONITORING: Blockchain deposit monitoring configuration';
    RAISE NOTICE '🛠️  ADMIN TOOLS: Status management and user permission checking';
    RAISE NOTICE '⚡ AUTOMATION: Updated_at triggers for data consistency';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT: Run Part 4 - RLS Policies & Auth System (FINAL)';
END $$;