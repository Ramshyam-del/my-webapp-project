-- CLEANUP DUPLICATE AND CONFLICTING RLS POLICIES
-- This script removes conflicting policies that can cause authentication issues

-- Step 1: Clean up duplicate and conflicting RLS policies
DROP POLICY IF EXISTS "allow_all_users" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Allow trigger function to insert users" ON users;

-- Step 2: Clean up any additional conflicting policies that might exist
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Enable select for users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- Step 3: Verify the cleanup and show remaining policies
DO $$
DECLARE
    policy_count INTEGER;
    rec RECORD;
BEGIN
    -- Count remaining policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users';
    
    RAISE NOTICE 'Found % remaining policies on users table:', policy_count;
    
    -- List all remaining policies
    FOR rec IN 
        SELECT policyname, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'users'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Condition: %', rec.policyname, rec.cmd, rec.qual;
    END LOOP;
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'users' AND schemaname = 'public' AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'RLS is ENABLED on users table';
    ELSE
        RAISE NOTICE 'WARNING: RLS is DISABLED on users table';
    END IF;
END $$;

-- Step 4: Ensure we have the minimum required policies for functionality
-- Only create if they don't already exist from our previous scripts

-- Check and create basic user access policy if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
        RAISE NOTICE 'Created missing policy: Users can view own profile';
    END IF;
END $$;

-- Check and create user update policy if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
        RAISE NOTICE 'Created missing policy: Users can update own profile';
    END IF;
END $$;

-- Check and create user insert policy if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
        RAISE NOTICE 'Created missing policy: Users can insert own profile';
    END IF;
END $$;

-- Step 5: Final verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

COMMIT;