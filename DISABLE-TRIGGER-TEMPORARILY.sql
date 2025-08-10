-- =====================================================
-- TEMPORARILY DISABLE AUTH TRIGGER
-- =====================================================

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now you can create the admin user manually in Supabase dashboard
-- After creating the user, run the FIX-AUTH-TRIGGER.sql script to re-enable it
