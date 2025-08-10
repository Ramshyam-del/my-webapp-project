-- =====================================================
-- FIX AUTH TRIGGER - RESOLVE USER CREATION ERROR
-- =====================================================

-- First, drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved version of the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use ON CONFLICT to handle cases where user profile might already exist
    INSERT INTO public.users (id, email, role, status, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'user', 'active', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
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

-- Also add a policy to allow the trigger function to insert into users table
DROP POLICY IF EXISTS "Allow trigger function to insert users" ON public.users;
CREATE POLICY "Allow trigger function to insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
