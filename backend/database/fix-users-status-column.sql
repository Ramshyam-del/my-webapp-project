-- Fix missing status column in public.users table
-- This resolves the "column 'status' does not exist" error

-- Add status column to public.users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen'));

-- Update any NULL status values to 'active'
UPDATE public.users SET status = 'active' WHERE status IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Verification query
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'status';

-- Test query to ensure it works
SELECT id, email, role, status 
FROM public.users 
LIMIT 3;