-- Fix empty usernames and prevent future issues
-- This script updates any users with empty usernames and ensures robust username generation

-- Function to generate username from email
CREATE OR REPLACE FUNCTION generate_username_from_email(email_address TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Extract username part from email and make it unique if needed
    RETURN SPLIT_PART(email_address, '@', 1);
END;
$$ LANGUAGE plpgsql;

-- Update any users with empty or null usernames
UPDATE public.users 
SET username = generate_username_from_email(email),
    updated_at = NOW()
WHERE username IS NULL OR username = '' OR TRIM(username) = '';

-- Enhanced trigger function to ensure usernames are always set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    generated_username TEXT;
    username_counter INTEGER := 0;
    final_username TEXT;
BEGIN
    -- Generate base username from metadata or email
    generated_username := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Ensure username uniqueness
    final_username := generated_username;
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username AND id != NEW.id) LOOP
        username_counter := username_counter + 1;
        final_username := generated_username || username_counter;
    END LOOP;
    
    -- Insert or update user profile
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
        final_username,
        COALESCE(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
        COALESCE(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
        COALESCE(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
        'user',
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = CASE 
            WHEN users.username IS NULL OR users.username = '' OR TRIM(users.username) = ''
            THEN EXCLUDED.username 
            ELSE users.username 
        END,
        first_name = CASE 
            WHEN users.first_name IS NULL OR users.first_name = '' OR TRIM(users.first_name) = ''
            THEN EXCLUDED.first_name 
            ELSE users.first_name 
        END,
        last_name = CASE 
            WHEN users.last_name IS NULL OR users.last_name = '' OR TRIM(users.last_name) = ''
            THEN EXCLUDED.last_name 
            ELSE users.last_name 
        END,
        phone = CASE 
            WHEN users.phone IS NULL OR users.phone = '' OR TRIM(users.phone) = ''
            THEN EXCLUDED.phone 
            ELSE users.phone 
        END,
        updated_at = NOW();
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add constraint to prevent empty usernames in the future
ALTER TABLE public.users 
ADD CONSTRAINT check_username_not_empty 
CHECK (username IS NOT NULL AND TRIM(username) != '');

-- Create index for username uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique 
ON public.users(LOWER(username)) 
WHERE username IS NOT NULL AND TRIM(username) != '';

COMMIT;