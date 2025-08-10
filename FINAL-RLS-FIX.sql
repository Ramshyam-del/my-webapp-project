-- FINAL RLS FIX - HANDLES EXISTING POLICIES
-- Run this in your Supabase SQL Editor

-- 1. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Users can view own orders" ON trading_orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON trading_orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON trading_orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON trading_orders;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON transactions;

-- 2. Create new policies with unique names
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_view_all_users" ON users
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

CREATE POLICY "admin_update_all_users" ON users
    FOR UPDATE USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

CREATE POLICY "users_view_own_orders" ON trading_orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_orders" ON trading_orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_view_all_orders" ON trading_orders
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

CREATE POLICY "admin_update_all_orders" ON trading_orders
    FOR UPDATE USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

CREATE POLICY "users_view_own_transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_transactions" ON transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_view_all_transactions" ON transactions
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

-- 3. Ensure admin user exists
INSERT INTO users (id, email, role, balance, created_at, updated_at)
VALUES (
    '1c2de2e1-7aa3-47f5-b11b-9a11d2532868',
    'admin@quantex.com',
    'admin',
    10000,
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    balance = 10000,
    updated_at = NOW();

-- 4. Verify the fix
SELECT '✅ RLS policies fixed successfully!' as status;
SELECT id, email, role FROM users WHERE email = 'admin@quantex.com';
