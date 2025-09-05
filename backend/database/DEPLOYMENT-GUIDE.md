# Quantex Trading Platform - Database Deployment Guide

This guide helps you deploy the Quantex Trading Platform database schema to Supabase, specifically addressing permission errors and RLS infinite recursion issues.

## 🚨 Important: Common Issues & Solutions

### Issue 1: Permission Error
If you encountered `ERROR: 42501: must be owner of table users`, this is because Supabase doesn't allow direct modification of the `auth.users` table.

### Issue 2: RLS Infinite Recursion
If you encountered infinite recursion errors with RLS policies, this happens when admin policies query `public.users` table while RLS is checking the same table.

**✅ SOLUTION: Use the Fixed RLS Schema**
We've created a **fixed schema** that resolves both issues using a SECURITY DEFINER function approach.

## 📋 Deployment Options

### Option 1: ⭐ RECOMMENDED - Fixed RLS Schema (Automated)

Use the latest fixed schema that resolves all known issues:

```bash
cd backend/database
node deploy-fixed-schema.js
```

### Option 2: Fixed RLS Schema (Manual)

Deploy manually via Supabase SQL Editor:

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `quantex-fixed-rls-schema.sql`
4. Paste and run in the SQL Editor

### Option 3: Legacy - Safe Schema (If needed)

For backward compatibility:

```bash
cd backend/database
node deploy-safe-schema.js
```

### Option 4: Manual Deployment via Supabase Dashboard

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the fixed schema:**
   - Open `quantex-fixed-rls-schema.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run"

## 🔧 Key Improvements in Fixed RLS Schema

### ✅ Resolves Infinite Recursion
- **SECURITY DEFINER Function**: `is_admin_user()` function bypasses RLS
- **Non-Recursive Policies**: Admin policies use the secure function
- **No Circular Dependencies**: Clean separation of concerns

### ✅ Maintains All Features
- **No modifications to `auth.users`** - avoids permission errors
- **Creates `public.users`** - extends user profiles safely
- **References `auth.users(id)`** - maintains authentication integration
- **Full RLS policies** - maintains security
- **All trading functionality** - complete feature set

### Schema Structure:
```
auth.users (Supabase managed)
├── id (UUID, primary key)
├── email
├── encrypted_password
└── ... (other auth fields)

public.users (Your profile extension)
├── id → auth.users(id)
├── username, first_name, last_name
├── role, status, account_type
├── trading permissions
├── KYC fields
└── preferences
```

## 🚀 Deployment Commands

### Automated Deployment:
```bash
# Deploy schema
node deploy-safe-schema.js

# Deploy schema + create admin user
node deploy-safe-schema.js --create-admin admin@yourcompany.com password123
```

### Manual SQL Execution:
```sql
-- In Supabase SQL Editor, run:
-- (Copy contents of quantex-supabase-safe-schema.sql)
```

## 👤 Creating Admin User

### Method 1: Using the Script
```bash
node deploy-safe-schema.js --create-admin admin@yourcompany.com yourpassword
```

### Method 2: Manual Creation

1. **Create auth user in Supabase Dashboard:**
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Note the User ID

2. **Add profile record:**
   ```sql
   INSERT INTO public.users (id, username, role, status) 
   VALUES ('your-auth-user-id', 'admin', 'super_admin', 'active');
   ```

## 🔍 Verification Steps

### 1. Check Tables Created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'portfolios', 'crypto_pairs', 'orders', 
    'trades', 'fund_transactions', 'crypto_deposits'
);
```

### 2. Verify RLS Policies:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. Test User Creation:
```sql
-- This should work without permission errors
SELECT * FROM public.users LIMIT 1;
```

## 🛠️ Environment Variables

Make sure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔧 Troubleshooting

### Common Issues:

1. **"exec_sql function not found"**
   - Use manual deployment via SQL Editor
   - Or create the function first:
   ```sql
   CREATE OR REPLACE FUNCTION exec_sql(sql text)
   RETURNS void AS $$
   BEGIN
       EXECUTE sql;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **"Permission denied for table"**
   - Ensure you're using the service role key
   - Check RLS policies are correctly applied

3. **"Table already exists"**
   - This is normal for re-deployments
   - The script handles conflicts gracefully

### Getting Help:

1. **Check deployment logs** for specific error messages
2. **Verify environment variables** are correctly set
3. **Use Supabase SQL Editor** for manual verification
4. **Check Supabase logs** in Dashboard → Logs

## 📊 Schema Summary

**Tables Created:** 11
- `public.users` (user profiles - safe from auth.users conflicts)
- `portfolios` (user balances)
- `crypto_pairs` (trading pairs)
- `orders` (trading orders)
- `trades` (completed trades)
- `fund_transactions` (deposits/withdrawals)
- `crypto_deposits` (blockchain deposits)
- `mining_payouts` (mining rewards)
- `operation_logs` (admin actions)
- `user_activities` (user actions)
- `configurations` (system settings)

**Security Features:**
- ✅ Fixed Row Level Security (RLS) - No infinite recursion
- ✅ SECURITY DEFINER Functions - Safe admin role checking
- ✅ User role-based access control
- ✅ Admin-only operations protection
- ✅ User data isolation
- ✅ Non-recursive policies for optimal performance

**Performance Features:**
- ✅ Optimized indexes
- ✅ Automatic timestamp updates
- ✅ Balance calculation functions
- ✅ Audit trails

## 🎉 Success!

Once deployed successfully, your Quantex Trading Platform database will be ready for:
- ✅ User registration and authentication
- ✅ Multi-currency portfolio management
- ✅ Advanced trading operations
- ✅ Cryptocurrency deposits/withdrawals
- ✅ Admin panel functionality
- ✅ Comprehensive audit logging

---

**Need help?** Check the deployment logs or contact your development team.