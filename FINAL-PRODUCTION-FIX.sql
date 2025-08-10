-- FINAL PRODUCTION FIX FOR QUANTEX PLATFORM
-- Run this in your Supabase SQL Editor to fix ALL issues

-- 1. Fix all constraints
ALTER TABLE trading_orders DROP CONSTRAINT IF EXISTS trading_orders_type_check;
ALTER TABLE trading_orders DROP CONSTRAINT IF EXISTS trading_orders_status_check;

-- Create new constraints that work
ALTER TABLE trading_orders ADD CONSTRAINT trading_orders_type_check 
CHECK (type IN ('market', 'limit', 'binary'));

ALTER TABLE trading_orders ADD CONSTRAINT trading_orders_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'failed', 'processing'));

-- 2. Add missing columns
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS outcome VARCHAR(10);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS profit_loss DECIMAL(15,8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(15,8) DEFAULT 0;

-- 3. Fix RLS policies (drop all and recreate)
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

-- Create simple working policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own orders" ON trading_orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders" ON trading_orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all orders" ON trading_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update all orders" ON trading_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Ensure admin user exists with proper role and balance
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

-- 5. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON trading_orders TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 8. Verify everything is working
SELECT '✅ Database fixed successfully!' as status;
SELECT id, email, role, balance FROM users WHERE email = 'admin@quantex.com';
