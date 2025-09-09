# Production Setup Guide

## Database Schema Fix Required

Your application is currently experiencing database errors because the `trading_orders` table is missing required columns. Follow these steps to fix the production database:

### Step 1: Execute Database Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration Script**
   - Copy the entire contents of `fix-missing-columns.sql`
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute the migration

### Step 2: Verify the Fix

After running the migration, your application should:
- ✅ Load active trades without errors
- ✅ Allow users to create new trades
- ✅ Display trade history properly
- ✅ Handle admin actions correctly

### Step 3: Test Trade Creation

1. **Access the Features Page**
   - Go to `http://localhost:3000/features`
   - Login with a test user account

2. **Create a Test Trade**
   - Select a trading pair (e.g., BTCUSDT)
   - Choose BUY UP or BUY FALL
   - Set amount and duration
   - Click "Place Order"

3. **Verify Trade Creation**
   - Check that the trade appears in Active Trades
   - Verify all columns are populated correctly
   - Confirm no database errors in console

## Files Created/Modified

### Database Migration Files
- `fix-missing-columns.sql` - Main migration script for production
- `backend/fix-trading-orders-columns.js` - Automated migration script
- `backend/fix-columns-supabase.js` - Supabase client migration script

### Key Columns Added
- `entry_price` - Price when trade was opened
- `admin_action` - Admin decision status (pending/approved/rejected)
- `expiry_ts` - Trade expiration timestamp
- `user_name` - User identifier for admin interface

### Indexes Created
- `idx_trading_orders_expiry_ts` - For efficient expiry queries
- `idx_trading_orders_admin_action` - For admin filtering
- `idx_trading_orders_entry_price` - For price-based queries

## Production Checklist

- [ ] Database migration executed successfully
- [ ] No console errors when loading pages
- [ ] Trade creation works without errors
- [ ] Active trades display correctly
- [ ] Admin interface shows all trade data
- [ ] User balances update properly after trades

## Troubleshooting

If you still see errors after migration:

1. **Check Migration Success**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'trading_orders' 
   AND column_name IN ('entry_price', 'admin_action', 'expiry_ts', 'user_name');
   ```

2. **Verify Indexes**
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'trading_orders';
   ```

3. **Check for Data Consistency**
   ```sql
   SELECT COUNT(*) as total_trades,
          COUNT(entry_price) as with_entry_price,
          COUNT(admin_action) as with_admin_action
   FROM trading_orders;
   ```

## Next Steps

Once the database migration is complete:
1. Restart your application servers
2. Test all trading functionality
3. Monitor for any remaining errors
4. Deploy to production environment

---

**Important**: Always backup your database before running migrations in production!