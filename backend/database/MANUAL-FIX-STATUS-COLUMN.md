# Manual Fix: Add status Column to public.users Table

## Problem
The `public.users` table is missing the `status` column that the application expects, causing the error:
```
ERROR: 42703: column "status" does not exist
```

## Root Cause
The auth trigger function `handle_new_user()` tries to insert new users into `public.users` with a `status` column, but this column doesn't exist in the table schema.

## Manual Solution

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**

### Step 2: Add the Missing Column
Execute the following SQL commands:

```sql
-- Add status column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'banned', 'frozen'));

-- Update any existing NULL status values to 'active'
UPDATE public.users SET status = 'active' WHERE status IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
```

### Step 3: Verify the Fix
Run this verification query:

```sql
-- Check that the status column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'status';

-- Check sample data
SELECT id, email, role, status 
FROM public.users 
LIMIT 5;
```

### Expected Results
- The first query should return one row showing the `status` column details
- The second query should show user records with `status` values (should be 'active' for existing users)

## Alternative: Complete Schema Deployment

If you continue to encounter missing column errors, consider running the complete schema deployment:

1. Go to Supabase Dashboard > SQL Editor
2. Execute the complete schema from `quantex-fixed-rls-schema.sql`

This will ensure all tables have the correct structure and all required columns.

## Verification After Fix

After applying the fix:
1. Test user registration/login functionality
2. Check that admin user management works
3. Verify that no more "column 'status' does not exist" errors occur

## Files Created for This Fix
- `fix-users-status-column.sql` - SQL commands to add the status column
- `deploy-status-fix.js` - Automated deployment script (requires Supabase credentials)
- `MANUAL-FIX-STATUS-COLUMN.md` - This manual instruction file

## Next Steps
Once you've manually added the status column, your application should work without the "column 'status' does not exist" error.