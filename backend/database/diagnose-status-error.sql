-- DIAGNOSTIC SCRIPT FOR STATUS COLUMN ERROR
-- This script helps identify which table is missing the status column
-- and provides the complete fix

-- =====================================================
-- STEP 1: CHECK CURRENT TABLE STRUCTURES
-- =====================================================

-- Check if public.users table exists and has status column
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'status';

-- Check if auth.users table has status column
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'status';

-- List all columns in public.users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: CHECK TRIGGERS THAT MIGHT CAUSE THE ERROR
-- =====================================================

-- Check if the auth trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%auth%user%' OR trigger_name LIKE '%handle_new_user%';

-- =====================================================
-- STEP 3: COMPREHENSIVE FIX
-- =====================================================

-- Ensure public.users table exists with all required columns
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'moderator')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen')),
    account_type VARCHAR(50) DEFAULT 'standard' CHECK (account_type IN ('standard', 'premium', 'vip', 'demo')),
    verification_level VARCHAR(50) DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'email_verified', 'phone_verified', 'kyc_pending', 'kyc_verified', 'enhanced_verified')),
    
    -- Trading permissions
    trading_enabled BOOLEAN DEFAULT true,
    withdrawal_enabled BOOLEAN DEFAULT true,
    deposit_enabled BOOLEAN DEFAULT true,
    max_daily_withdrawal NUMERIC(20,8) DEFAULT 1000.00,
    max_daily_deposit NUMERIC(20,8) DEFAULT 50000.00,
    
    -- Security and tracking
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    
    -- KYC and compliance
    kyc_verified_at TIMESTAMPTZ,
    document_verification_status VARCHAR(50) DEFAULT 'not_submitted' CHECK (document_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected', 'expired')),
    country_code VARCHAR(3),
    date_of_birth DATE,
    address JSONB,
    
    -- Trading preferences
    risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    trading_experience VARCHAR(20) DEFAULT 'beginner' CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
    leverage_limit NUMERIC(5,2) DEFAULT 1.00,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Admin tracking
    status_changed_by UUID REFERENCES auth.users(id),
    status_changed_at TIMESTAMPTZ,
    status_change_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add status column if it doesn't exist (for existing tables)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen'));

-- Update any NULL status values
UPDATE public.users SET status = 'active' WHERE status IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- =====================================================
-- STEP 4: UPDATE THE AUTH TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the updated trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user with proper metadata extraction and conflict handling
    INSERT INTO public.users (id, username, first_name, last_name, phone, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'username')::text, 
                 SPLIT_PART(NEW.email, '@', 1)), -- Generate username from email if not provided
        COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'phone')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user'), -- Default to 'user' role
        'active', -- Set status to active for new users
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        username = CASE 
            WHEN users.username IS NULL OR users.username = '' 
            THEN EXCLUDED.username 
            ELSE users.username 
        END,
        first_name = CASE 
            WHEN users.first_name IS NULL OR users.first_name = '' 
            THEN EXCLUDED.first_name 
            ELSE users.first_name 
        END,
        last_name = CASE 
            WHEN users.last_name IS NULL OR users.last_name = '' 
            THEN EXCLUDED.last_name 
            ELSE users.last_name 
        END,
        phone = CASE 
            WHEN users.phone IS NULL OR users.phone = '' 
            THEN EXCLUDED.phone 
            ELSE users.phone 
        END,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 5: VERIFICATION QUERIES
-- =====================================================

-- Verify the status column exists
SELECT 'Status column exists in public.users' as check_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'status'
);

-- Test the trigger function
SELECT 'Trigger function exists' as check_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
);

-- Test a sample query that uses status
SELECT COUNT(*) as total_users, status 
FROM public.users 
GROUP BY status;

SELECT 'Diagnostic script completed successfully' as final_result;