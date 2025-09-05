-- AUTHENTICATION SYSTEM DIAGNOSTIC QUERIES
-- Run these queries in Supabase SQL Editor to check the current state

-- 1. Check if the trigger function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 2. Check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Additional diagnostics for comprehensive check
-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if users table has RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 6. Check for any existing user profiles
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
       COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM public.users;

-- 7. Test if auth.uid() function works (should return NULL if not authenticated)
SELECT auth.uid() as current_auth_user;

-- 8. Check auth.users table structure (to understand what metadata is available)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;