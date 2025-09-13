-- ENHANCED HANDLE_NEW_USER TRIGGER - Production Ready
-- Combines simplified approach with critical safety features

-- Fix the handle_new_user trigger function with production enhancements
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user profile with conflict handling for production safety
    INSERT INTO public.users (
        id,
        email,
        username,
        first_name,
        last_name,
        phone,
        role,
        status,
        credit_score,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 
                 SPLIT_PART(NEW.email, '@', 1)), -- Generate username from email if empty
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'), -- Default role
        'active', -- Default status for new users
        100, -- Default credit score
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
        updated_at = NOW();
    
    RETURN NEW;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE WARNING 'Unique constraint violation for user: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
    WHEN foreign_key_violation THEN
        RAISE WARNING 'Foreign key violation for user: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
    WHEN others THEN
        RAISE WARNING 'Error in handle_new_user trigger for: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the setup with comprehensive checks
DO $$
DECLARE
    trigger_exists BOOLEAN := FALSE;
    function_exists BOOLEAN := FALSE;
BEGIN
    -- Check if function exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    -- Check if trigger exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) INTO trigger_exists;
    
    -- Report status
    IF function_exists AND trigger_exists THEN
        RAISE NOTICE 'SUCCESS: Auth trigger and function are properly configured';
    ELSIF function_exists AND NOT trigger_exists THEN
        RAISE WARNING 'Function exists but trigger is missing';
    ELSIF NOT function_exists AND trigger_exists THEN
        RAISE WARNING 'Trigger exists but function is missing';
    ELSE
        RAISE WARNING 'Both function and trigger are missing';
    END IF;
END $$;

-- Detailed verification query
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.event_object_schema,
    t.action_statement,
    CASE 
        WHEN r.routine_name IS NOT NULL THEN 'Function exists'
        ELSE 'Function missing'
    END as function_status
FROM information_schema.triggers t
LEFT JOIN information_schema.routines r 
    ON r.routine_name = 'handle_new_user' 
    AND r.routine_schema = 'public'
WHERE t.trigger_name = 'on_auth_user_created';

-- Test the users table structure (ensure required columns exist)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
    AND column_name IN ('id', 'email', 'username', 'first_name', 'last_name', 'phone', 'role', 'status')
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
    END;

COMMIT;