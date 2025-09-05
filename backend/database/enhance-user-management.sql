-- =====================================================
-- ENHANCED USER STATUS AND ACCOUNT MANAGEMENT
-- Production-Ready User Status System for Trading Platform
-- =====================================================

-- Add comprehensive status and account management columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen')),
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'standard' CHECK (account_type IN ('standard', 'premium', 'vip', 'demo')),
ADD COLUMN IF NOT EXISTS verification_level VARCHAR(50) DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'email_verified', 'phone_verified', 'kyc_pending', 'kyc_verified', 'enhanced_verified')),
ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_daily_withdrawal NUMERIC(20,8) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS max_daily_deposit NUMERIC(20,8) DEFAULT 50000.00,

-- Account security and tracking
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,

-- Compliance and KYC
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_verification_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_verification_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (document_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected', 'expired')),
ADD COLUMN IF NOT EXISTS compliance_flags JSONB DEFAULT '{}',

-- Admin management fields
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,

-- Geographic and device tracking
ADD COLUMN IF NOT EXISTS country_code CHAR(2),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_language CHAR(2) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS registered_device_info JSONB DEFAULT '{}',

-- Trading preferences and limits
ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS trading_experience VARCHAR(20) DEFAULT 'beginner' CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
ADD COLUMN IF NOT EXISTS leverage_limit NUMERIC(5,2) DEFAULT 1.00 CHECK (leverage_limit >= 1.00 AND leverage_limit <= 100.00),

-- Notification preferences
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false;

-- Update existing users to have proper default values
UPDATE users 
SET 
    status = COALESCE(status, 'active'),
    account_type = COALESCE(account_type, 'standard'),
    verification_level = COALESCE(verification_level, 'unverified'),
    trading_enabled = COALESCE(trading_enabled, true),
    withdrawal_enabled = COALESCE(withdrawal_enabled, true),
    deposit_enabled = COALESCE(deposit_enabled, true),
    max_daily_withdrawal = COALESCE(max_daily_withdrawal, 1000.00),
    max_daily_deposit = COALESCE(max_daily_deposit, 50000.00),
    login_attempts = COALESCE(login_attempts, 0),
    two_factor_enabled = COALESCE(two_factor_enabled, false),
    document_verification_status = COALESCE(document_verification_status, 'not_submitted'),
    compliance_flags = COALESCE(compliance_flags, '{}'),
    preferred_language = COALESCE(preferred_language, 'en'),
    registered_device_info = COALESCE(registered_device_info, '{}'),
    risk_tolerance = COALESCE(risk_tolerance, 'medium'),
    trading_experience = COALESCE(trading_experience, 'beginner'),
    leverage_limit = COALESCE(leverage_limit, 1.00),
    email_notifications = COALESCE(email_notifications, true),
    sms_notifications = COALESCE(sms_notifications, false),
    push_notifications = COALESCE(push_notifications, true),
    marketing_emails = COALESCE(marketing_emails, false),
    updated_at = NOW()
WHERE 
    status IS NULL OR 
    account_type IS NULL OR 
    verification_level IS NULL OR
    trading_enabled IS NULL OR
    withdrawal_enabled IS NULL OR
    deposit_enabled IS NULL;

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_verification_level ON users(verification_level);
CREATE INDEX IF NOT EXISTS idx_users_trading_enabled ON users(trading_enabled) WHERE trading_enabled = true;
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(document_verification_status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_2fa ON users(two_factor_enabled) WHERE two_factor_enabled = true;
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until) WHERE locked_until > NOW();

-- Composite indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_users_status_verification ON users(status, verification_level);
CREATE INDEX IF NOT EXISTS idx_users_type_status ON users(account_type, status);
CREATE INDEX IF NOT EXISTS idx_users_created_status ON users(created_at DESC, status);

-- Create user management helper functions

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
            
            -- Log the status change
            RAISE LOG 'User % status changed from % to % by admin % (reason: %)', 
                     p_user_id, old_status, p_new_status, p_admin_id, p_reason;
            
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

-- Function to lock user account temporarily
CREATE OR REPLACE FUNCTION lock_user_account(
    p_user_id UUID,
    p_duration_minutes INTEGER DEFAULT 30,
    p_reason TEXT DEFAULT 'Security lock'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        locked_until = NOW() + INTERVAL '1 minute' * p_duration_minutes,
        admin_notes = COALESCE(admin_notes, '') || 
                     E'\n' || NOW()::TEXT || ': ' || p_reason,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_user_status(UUID, TEXT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION can_user_trade(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION lock_user_account(UUID, INTEGER, TEXT) TO authenticated, service_role;

-- Create view for admin user management
CREATE OR REPLACE VIEW admin_user_overview AS
SELECT 
    id,
    email,
    username,
    first_name,
    last_name,
    status,
    account_type,
    verification_level,
    document_verification_status,
    trading_enabled,
    withdrawal_enabled,
    deposit_enabled,
    last_login_at,
    last_login_ip,
    login_attempts,
    locked_until,
    two_factor_enabled,
    kyc_verified_at,
    country_code,
    risk_tolerance,
    trading_experience,
    leverage_limit,
    status_changed_by,
    status_changed_at,
    status_change_reason,
    created_at,
    updated_at,
    CASE 
        WHEN locked_until > NOW() THEN 'Locked'
        WHEN status = 'active' AND trading_enabled = true THEN 'Trading'
        WHEN status = 'active' THEN 'Active (No Trading)'
        ELSE INITCAP(status)
    END as display_status,
    CASE 
        WHEN verification_level = 'kyc_verified' THEN 'Verified'
        WHEN verification_level = 'email_verified' THEN 'Email Only'
        ELSE 'Unverified'
    END as verification_status
FROM users;

-- Grant view access to authenticated users (RLS will handle row-level access)
GRANT SELECT ON admin_user_overview TO authenticated;

-- Comprehensive verification
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
    updated_users INTEGER;
BEGIN
    -- Count new columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('status', 'account_type', 'verification_level', 'trading_enabled', 'two_factor_enabled');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'users' 
    AND indexname LIKE 'idx_users_%';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name IN ('update_user_status', 'can_user_trade', 'lock_user_account')
    AND routine_schema = 'public';
    
    -- Count users with proper status
    SELECT COUNT(*) INTO updated_users
    FROM users 
    WHERE status IS NOT NULL;
    
    -- Report comprehensive status
    IF column_count >= 5 AND index_count >= 8 AND function_count = 3 AND updated_users > 0 THEN
        RAISE NOTICE '🎉 SUCCESS: Enhanced user management system deployed!';
        RAISE NOTICE '✅ Columns: % | Indexes: % | Functions: % | Updated Users: %', 
                     column_count, index_count, function_count, updated_users;
        RAISE NOTICE '👤 USER FEATURES: Status tracking, account types, verification levels';
        RAISE NOTICE '🔒 SECURITY: 2FA support, account locking, login tracking';
        RAISE NOTICE '📊 COMPLIANCE: KYC integration, document verification, audit trails';
        RAISE NOTICE '🎯 TRADING: Risk tolerance, experience levels, leverage limits';
        RAISE NOTICE '🔧 MANAGEMENT: Admin functions for user status control';
    ELSE
        RAISE WARNING '❌ INCOMPLETE USER MANAGEMENT SETUP:';
        RAISE WARNING '   Columns: % (expected 5+) | Indexes: % (expected 8+)', column_count, index_count;
        RAISE WARNING '   Functions: % (expected 3) | Updated Users: %', function_count, updated_users;
    END IF;
END $$;

-- Show enhanced user table structure summary
SELECT 
    'User Management Enhancements' as category,
    COUNT(CASE WHEN column_name LIKE '%status%' THEN 1 END) as status_columns,
    COUNT(CASE WHEN column_name LIKE '%enabled%' THEN 1 END) as permission_columns,
    COUNT(CASE WHEN column_name LIKE '%verification%' OR column_name LIKE '%kyc%' THEN 1 END) as compliance_columns,
    COUNT(CASE WHEN column_name LIKE '%login%' OR column_name LIKE '%password%' OR column_name LIKE '%factor%' THEN 1 END) as security_columns,
    COUNT(CASE WHEN column_name LIKE '%trading%' OR column_name LIKE '%risk%' OR column_name LIKE '%leverage%' THEN 1 END) as trading_columns
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

COMMIT;