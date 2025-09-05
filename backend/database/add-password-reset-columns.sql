-- Add password reset columns to users table
-- Run this in your Supabase SQL Editor

-- Add columns for OTP-based password reset
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookups during password reset
CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp) WHERE reset_otp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Add constraint to ensure OTP is 6 digits when present
ALTER TABLE users ADD CONSTRAINT check_reset_otp_format 
  CHECK (reset_otp IS NULL OR (reset_otp ~ '^[0-9]{6}$'));

-- Add constraint to ensure reset token is hex string when present
ALTER TABLE users ADD CONSTRAINT check_reset_token_format 
  CHECK (reset_token IS NULL OR (reset_token ~ '^[a-f0-9]{64}$'));

COMMIT;