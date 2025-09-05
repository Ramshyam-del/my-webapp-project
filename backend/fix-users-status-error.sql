-- =====================================================
-- FIX: ERROR 42703 - column "status" does not exist
-- Execute this script in your Supabase SQL Editor
-- =====================================================

-- Add the missing 'status' column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen'));

-- Update any NULL status values to 'active'
UPDATE public.users SET status = 'active' WHERE status IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Verification: Check if the status column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'status';

-- Test query to ensure it works (should not throw an error now)
SELECT id, email, role, status 
FROM public.users 
LIMIT 3;

-- Show all users with their status
SELECT COUNT(*) as total_users, status 
FROM public.users 
GROUP BY status;
