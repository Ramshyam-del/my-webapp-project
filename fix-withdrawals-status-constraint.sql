-- Fix withdrawals status constraint to include 'approved' status
-- This will allow the admin approval process to work correctly

-- First, drop the existing constraint
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;

-- Add the new constraint with all required status values
ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_status_check 
CHECK (status IN ('pending', 'locked', 'approved', 'rejected', 'completed', 'failed'));

-- Verify the constraint was added (PostgreSQL compatible)
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'withdrawals_status_check';

-- Test that we can now update to approved status
-- (This is just for verification - don't run in production)
-- UPDATE withdrawals SET status = 'approved' WHERE id = 'some-test-id';