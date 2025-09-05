-- Add missing columns for password-based authentication
-- Run this in your Supabase SQL Editor

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));

-- Update existing users to have active status if they don't have one
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Create index for faster email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email_auth ON users(email) WHERE password_hash IS NOT NULL;

-- Create index for status filtering
CREate INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add constraint to ensure either password_hash exists (local auth) or it's null (OAuth)
-- This allows both authentication methods to coexist
ALTER TABLE users ADD CONSTRAINT check_auth_method 
  CHECK (password_hash IS NOT NULL OR email IS NOT NULL);

-- Update RLS policies to allow password-based authentication
-- Allow users to insert their own records during registration
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users 
  FOR INSERT WITH CHECK (true); -- Allow registration

-- Allow users to update their own records
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users 
  FOR UPDATE USING (auth.uid()::text = id::text OR id IS NULL); -- Allow updates during auth

-- Allow reading user data for authentication
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users 
  FOR SELECT USING (auth.uid()::text = id::text OR auth.uid() IS NULL); -- Allow login lookup

COMMIT;