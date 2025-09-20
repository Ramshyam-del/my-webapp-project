-- Migration script to normalize transaction types to lowercase
-- This script updates existing data and constraints to use consistent lowercase transaction types

BEGIN;

-- Step 1: Update existing data to use lowercase transaction types
UPDATE fund_transactions 
SET type = LOWER(type) 
WHERE type IN ('RECHARGE', 'WITHDRAW', 'DEPOSIT');

-- Step 2: Update the constraint to only allow lowercase transaction types
ALTER TABLE fund_transactions 
DROP CONSTRAINT IF EXISTS fund_transactions_type_check;

ALTER TABLE fund_transactions 
ADD CONSTRAINT fund_transactions_type_check 
CHECK (type IN ('deposit', 'withdraw', 'recharge', 'bonus', 'penalty', 'trade_fee', 'referral'));

-- Step 3: Update crypto_deposits table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_deposits') THEN
        UPDATE crypto_deposits 
        SET type = LOWER(type) 
        WHERE type IN ('RECHARGE', 'WITHDRAW', 'DEPOSIT');
        
        ALTER TABLE crypto_deposits 
        DROP CONSTRAINT IF EXISTS crypto_deposits_type_check;
        
        ALTER TABLE crypto_deposits 
        ADD CONSTRAINT crypto_deposits_type_check 
        CHECK (type IN ('deposit', 'withdraw', 'recharge', 'bonus', 'penalty'));
    END IF;
END $$;

-- Step 4: Update user_activities table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activities') THEN
        UPDATE user_activities 
        SET activity_type = LOWER(activity_type) 
        WHERE activity_type IN ('DEPOSIT', 'WITHDRAW');
    END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT 'fund_transactions' as table_name, type, COUNT(*) as count
FROM fund_transactions 
GROUP BY type
ORDER BY type;