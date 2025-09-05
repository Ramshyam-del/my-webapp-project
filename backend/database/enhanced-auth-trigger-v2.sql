-- ENHANCED AUTH TRIGGER V2 - Production Ready
-- Combines user improvements with critical safety features

-- Ensure users table has all required columns with proper constraints
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL AND username != '';
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Update the trigger function with comprehensive error handling and safety features
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    generated_username TEXT;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Generate a fallback username from email if not provided
    generated_username := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'username', ''),
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Check if user already exists (for logging purposes)
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_exists;
    
    -- Insert or update user profile with comprehensive metadata handling
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
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), ''),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), ''),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), ''),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'user'),
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
        -- Only update role if explicitly provided and user is not already admin
        role = CASE 
            WHEN users.role = 'admin' THEN users.role  -- Preserve admin role
            WHEN EXCLUDED.role IS NOT NULL AND EXCLUDED.role != '' 
            THEN EXCLUDED.role 
            ELSE users.role 
        END,
        updated_at = NOW();
    
    -- Log successful operation
    IF user_exists THEN
        RAISE LOG 'User profile updated successfully for: % (ID: %)', NEW.email, NEW.id;
    ELSE
        RAISE LOG 'User profile created successfully for: % (ID: %)', NEW.email, NEW.id;
    END IF;
    
    -- Verification: Ensure the user profile was created/updated
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        RAISE WARNING 'User profile verification failed for: % (ID: %)', NEW.email, NEW.id;
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Handle specific constraint violations
        RAISE WARNING 'Unique constraint violation for user: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
    WHEN foreign_key_violation THEN
        -- Handle foreign key violations
        RAISE WARNING 'Foreign key violation for user: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Handle all other errors
        RAISE WARNING 'Error in handle_new_user for: % (ID: %) - %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger creation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        RAISE NOTICE 'SUCCESS: Auth trigger created and configured properly';
    ELSE
        RAISE EXCEPTION 'FAILED: Auth trigger was not created';
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;

COMMIT;