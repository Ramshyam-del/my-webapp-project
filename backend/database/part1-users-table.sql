-- =====================================================
-- QUANTEX TRADING PLATFORM - PART 1 of 4
-- Enhanced Users Table & Basic Setup
-- =====================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENHANCED USERS TABLE
-- =====================================================

-- Add comprehensive user management columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen')),
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'standard' CHECK (account_type IN ('standard', 'premium', 'vip', 'demo')),
ADD COLUMN IF NOT EXISTS verification_level VARCHAR(50) DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'email_verified', 'phone_verified', 'kyc_verified')),

-- Trading permissions
ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deposit_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_daily_withdrawal NUMERIC(20,8) DEFAULT 1000.00,
ADD COLUMN IF NOT EXISTS max_daily_deposit NUMERIC(20,8) DEFAULT 50000.00,

-- Security fields
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,

-- Compliance
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS document_verification_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (document_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected')),

-- Admin management
ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status_change_reason TEXT,

-- Trading preferences
ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS leverage_limit NUMERIC(5,2) DEFAULT 1.00 CHECK (leverage_limit >= 1.00 AND leverage_limit <= 100.00),

-- Preferences
ADD COLUMN IF NOT EXISTS country_code CHAR(2),
ADD COLUMN IF NOT EXISTS preferred_language CHAR(2) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Update existing users with default values
UPDATE users 
SET 
    status = COALESCE(status, 'active'),
    role = COALESCE(role, 'user'),
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
    risk_tolerance = COALESCE(risk_tolerance, 'medium'),
    leverage_limit = COALESCE(leverage_limit, 1.00),
    preferred_language = COALESCE(preferred_language, 'en'),
    email_notifications = COALESCE(email_notifications, true),
    updated_at = NOW()
WHERE 
    status IS NULL OR role IS NULL OR account_type IS NULL;

-- Create comprehensive indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL AND username != '';
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_level ON users(verification_level);
CREATE INDEX IF NOT EXISTS idx_users_trading_enabled ON users(trading_enabled) WHERE trading_enabled = true;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_2fa ON users(two_factor_enabled) WHERE two_factor_enabled = true;

-- Composite indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_users_status_verification ON users(status, verification_level);
CREATE INDEX IF NOT EXISTS idx_users_type_status ON users(account_type, status);
CREATE INDEX IF NOT EXISTS idx_users_created_status ON users(created_at DESC, status);

COMMIT;

-- =====================================================
-- VERIFICATION FOR PART 1
-- =====================================================

DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    updated_users INTEGER;
BEGIN
    -- Count new columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('status', 'role', 'trading_enabled', 'verification_level', 'two_factor_enabled');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'users' 
    AND indexname LIKE 'idx_users_%';
    
    -- Count updated users
    SELECT COUNT(*) INTO updated_users
    FROM users 
    WHERE status IS NOT NULL AND role IS NOT NULL;
    
    RAISE NOTICE '✅ PART 1 COMPLETE: Enhanced Users Table';
    RAISE NOTICE '   Columns Added: % | Indexes: % | Users Updated: %', column_count, index_count, updated_users;
    RAISE NOTICE '👤 USER FEATURES: Status, roles, verification levels, trading permissions';
    RAISE NOTICE '🔒 SECURITY: Login tracking, 2FA support, account locking';
    RAISE NOTICE '📊 COMPLIANCE: KYC integration, document verification';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT: Run Part 2 - Portfolios & Balance Management';
END $$;