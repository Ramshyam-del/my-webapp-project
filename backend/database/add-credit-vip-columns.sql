-- Add credit_score and vip_level columns to users table
-- This migration adds support for admin-configurable credit scores and VIP levels

BEGIN;

-- Add credit_score column (0-1000 range)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 0 CHECK (credit_score >= 0 AND credit_score <= 1000);

-- Add vip_level column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS vip_level TEXT DEFAULT 'VIP0' CHECK (vip_level IN ('VIP0', 'VIP1', 'VIP2', 'VIP3', 'VIP4', 'VIP5'));

-- Add comments for documentation
COMMENT ON COLUMN public.users.credit_score IS 'User credit score (0-1000), configurable by admin';
COMMENT ON COLUMN public.users.vip_level IS 'User VIP level (VIP0-VIP5), configurable by admin';

-- Update existing users to have default values
UPDATE public.users 
SET credit_score = 0, vip_level = 'VIP0' 
WHERE credit_score IS NULL OR vip_level IS NULL;

COMMIT;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('credit_score', 'vip_level')
ORDER BY column_name;