# MANUAL DEPLOYMENT GUIDE - STATUS COLUMN FIX

## Problem
Your application is showing the error: `ERROR: 42703: column "status" does not exist`

This happens because either:
1. The `public.users` table doesn't have a `status` column
2. The auth trigger is trying to insert into a column that doesn't exist
3. The wrong schema was deployed

## SOLUTION - Manual Steps

### Step 1: Run Diagnostic Script

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the entire content of `diagnose-status-error.sql`
4. Click **Run** to execute the diagnostic script

### Step 2: Alternative - Deploy Complete Schema

If the diagnostic script shows missing tables or columns, deploy the complete schema:

1. In **Supabase SQL Editor**, copy and paste the entire content of `quantex-fixed-rls-schema.sql`
2. Click **Run** to execute the complete schema

### Step 3: Verify the Fix

Run this query in the SQL Editor to verify:

```sql
-- Check if status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'status';

-- Test a status query
SELECT COUNT(*) as user_count, status 
FROM public.users 
GROUP BY status;
```

### Step 4: Test Your Application

1. Try to register a new user or perform the action that was causing the error
2. The error should be resolved

## Files to Use

1. **Primary Fix**: `diagnose-status-error.sql` - Comprehensive diagnostic and fix
2. **Complete Schema**: `quantex-fixed-rls-schema.sql` - Full database schema
3. **Backup Option**: `fix-users-status-column.sql` - Simple status column fix

## What These Scripts Do

- **Add the missing `status` column** to `public.users` table
- **Update the auth trigger** to handle user creation properly
- **Set default values** for existing users
- **Create necessary indexes** for performance
- **Add proper constraints** for data integrity

## Expected Result

After running the fix:
- No more "column status does not exist" errors
- User registration and authentication will work properly
- All existing users will have `status = 'active'`
- New users will automatically get `status = 'active'`

## If You Still Get Errors

If you still see the error after running the scripts:

1. Check the **Supabase Logs** in your dashboard
2. Look for the exact query causing the error
3. Verify that you ran the scripts in the correct database/project
4. Make sure you're using the **Service Role** key, not the **Anon** key for admin operations

## Need Help?

If the error persists, please:
1. Run the diagnostic script first
2. Share the output of the diagnostic queries
3. Check your application logs for the exact error context