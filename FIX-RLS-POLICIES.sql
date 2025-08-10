-- FIX RLS POLICIES - REMOVE INFINITE RECURSION
-- Run this in your Supabase SQL Editor

-- 1. Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Users can view own orders" ON trading_orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON trading_orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON trading_orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON trading_orders;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON transactions;

-- 2. Create simple, non-recursive policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can view all users (simple check)
CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

-- Admin can update all users (simple check)
CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON trading_orders
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON trading_orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin can view all orders (simple check)
CREATE POLICY "Admin can view all orders" ON trading_orders
    FOR SELECT USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

-- Admin can update all orders (simple check)
CREATE POLICY "Admin can update all orders" ON trading_orders
    FOR UPDATE USING (
        auth.uid() = '1c2de2e1-7aa3-47f5-b11b-9a11d2532868'
    );

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin can view all transactions (simple check)
CREATE POLICY "Admin can view all transactions" ON transactions
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
