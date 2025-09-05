# Manual Fix: Add currency_pair Column to trades Table

## Problem
The `trades` table is missing the `currency_pair` column that the application expects, causing the error:
```
ERROR: 42703: column "currency_pair" does not exist
```

## Current State
- The `trades` table has a `pair` column (e.g., "BTC/USD")
- The application code expects a `currency_pair` column
- Automated deployment scripts fail due to missing `exec_sql` function

## Manual Solution

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query

### Step 2: Execute SQL Commands
Copy and paste the following SQL commands one by one:

```sql
-- Add the currency_pair column
ALTER TABLE trades ADD COLUMN IF NOT EXISTS currency_pair TEXT;

-- Copy data from pair column to currency_pair column
UPDATE trades SET currency_pair = pair WHERE currency_pair IS NULL;

-- Make currency_pair NOT NULL (after data is populated)
ALTER TABLE trades ALTER COLUMN currency_pair SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_trades_currency_pair ON trades(currency_pair);
```

### Step 3: Verify the Fix
Run this verification query:

```sql
-- Check that both columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trades' AND column_name IN ('pair', 'currency_pair');

-- Check sample data
SELECT id, pair, currency_pair, user_id, amount 
FROM trades 
LIMIT 5;
```

### Expected Results
- Both `pair` and `currency_pair` columns should exist
- Both columns should have the same values (e.g., "BTC/USD")
- The `currency_pair` column should be NOT NULL

## Alternative: Update Application Code
If you prefer not to add the column, you can update the application code to use `pair` instead of `currency_pair`. However, adding the column is recommended for consistency with the schema.

## Next Steps
After adding the `currency_pair` column:
1. Test your application to ensure the error is resolved
2. Consider running the full schema deployment from `quantex-fixed-rls-schema.sql` if other issues persist
3. The `pair` column can be kept for backward compatibility or removed if no longer needed

## Files Created
- `add-currency-pair-column.sql` - SQL commands for the fix
- `deploy-currency-pair-fix.js` - Automated deployment script (failed due to missing exec_sql)
- This manual instruction file