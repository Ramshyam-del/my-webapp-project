-- =====================================================
-- FINAL TRIGGER FIX - SAVE ALL USER METADATA (Enhanced)
-- =====================================================

-- Drop existing trigger and function for clean setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure users table has all required columns with proper constraints
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));

-- Create performance indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL AND username != '';
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Create the complete handle_new_user function that saves all metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    generated_username TEXT;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Generate username from email if not provided or empty
    generated_username := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Check if user already exists (for logging)
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_exists;
    
    -- Insert user profile with all metadata from registration
    INSERT INTO public.users (
        id,
        email,
        username,
        first_name,
        last_name,
        phone,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        generated_username,
        COALESCE(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
        COALESCE(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
        COALESCE(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
        'user', -- Always default to 'user' role for security
        'active', -- New users start as active
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = CASE 
            WHEN EXCLUDED.username IS NOT NULL AND EXCLUDED.username != '' 
            THEN EXCLUDED.username 
            ELSE users.username 
        END,
        first_name = CASE 
            WHEN EXCLUDED.first_name IS NOT NULL AND EXCLUDED.first_name != '' 
            THEN EXCLUDED.first_name 
            ELSE users.first_name 
        END,
        last_name = CASE 
            WHEN EXCLUDED.last_name IS NOT NULL AND EXCLUDED.last_name != '' 
            THEN EXCLUDED.last_name 
            ELSE users.last_name 
        END,
        phone = CASE 
            WHEN EXCLUDED.phone IS NOT NULL AND EXCLUDED.phone != '' 
            THEN EXCLUDED.phone 
            ELSE users.phone 
        END,
        -- Preserve existing role (don't overwrite admin roles)
        role = users.role,
        updated_at = NOW();
    
    -- Log successful operation
    IF user_exists THEN
        RAISE LOG 'User profile updated for: % (ID: %)', NEW.email, NEW.id;
    ELSE
        RAISE LOG 'User profile created for: % (ID: %) with username: %', NEW.email, NEW.id, generated_username;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE WARNING 'Unique constraint violation for user %: %', NEW.email, SQLERRM;
        RETURN NEW;
    WHEN foreign_key_violation THEN
        RAISE WARNING 'Foreign key violation for user %: %', NEW.email, SQLERRM;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper permissions for production security
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;

-- Comprehensive verification
DO $$
DECLARE
    trigger_count INTEGER;
    function_count INTEGER;
    column_count INTEGER;
BEGIN
    -- Check trigger exists
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
    AND event_object_table = 'users'
    AND event_object_schema = 'auth';
    
    -- Check function exists
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user'
    AND routine_schema = 'public';
    
    -- Check required columns exist
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN ('id', 'email', 'username', 'first_name', 'last_name', 'phone', 'role', 'status');
    
    -- Report status
    IF trigger_count = 1 AND function_count = 1 AND column_count = 8 THEN
        RAISE NOTICE 'SUCCESS: Auth trigger system is fully configured and ready';
        RAISE NOTICE 'Trigger: ✓ | Function: ✓ | Columns: % of 8 required', column_count;
    ELSE
        RAISE WARNING 'INCOMPLETE SETUP - Trigger: % | Function: % | Columns: % of 8', 
                     trigger_count, function_count, column_count;
    END IF;
END $$;

-- Verify the trigger is created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    event_object_schema,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test query to check if all columns exist with proper data types
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'email', 'username', 'first_name', 'last_name', 'phone', 'role', 'status') 
        THEN '✓ Required' 
        ELSE '○ Optional' 
    END as importance
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY 
    CASE column_name
        WHEN 'id' THEN 1
        WHEN 'email' THEN 2
        WHEN 'username' THEN 3
        WHEN 'first_name' THEN 4
        WHEN 'last_name' THEN 5
        WHEN 'phone' THEN 6
        WHEN 'role' THEN 7
        WHEN 'status' THEN 8
        ELSE 99
    END;

COMMIT;