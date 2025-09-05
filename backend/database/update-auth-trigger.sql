-- Enhanced handle_new_user function with proper metadata extraction and safety features
-- Combines the metadata extraction improvements with critical safety features from Script 11

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert new user with proper metadata extraction and conflict handling
    INSERT INTO public.users (id, email, username, first_name, last_name, phone, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'username')::text, 
                 SPLIT_PART(NEW.email, '@', 1)), -- Generate username from email if not provided
        COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'phone')::text, ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user'), -- Default to 'user' role
        'active', -- Set status to active for new users
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        username = CASE 
            WHEN users.username IS NULL OR users.username = '' 
            THEN EXCLUDED.username 
            ELSE users.username 
        END,
        first_name = CASE 
            WHEN users.first_name IS NULL OR users.first_name = '' 
            THEN EXCLUDED.first_name 
            ELSE users.first_name 
        END,
        last_name = CASE 
            WHEN users.last_name IS NULL OR users.last_name = '' 
            THEN EXCLUDED.last_name 
            ELSE users.last_name 
        END,
        phone = CASE 
            WHEN users.phone IS NULL OR users.phone = '' 
            THEN EXCLUDED.phone 
            ELSE users.phone 
        END,
        updated_at = NOW();
    
    -- Verification: Check if user was created/updated successfully
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        RAISE WARNING 'User profile creation verification failed for user ID: %', NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log the error but don't prevent auth user creation
        RAISE WARNING 'Failed to create user profile for % (ID: %): %', NEW.email, NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created successfully
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        RAISE EXCEPTION 'Failed to create auth trigger';
    ELSE
        RAISE NOTICE 'Auth trigger created successfully';
    END IF;
END $$;

COMMIT;