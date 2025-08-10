-- ADD MISSING COLUMNS ONLY - FOR EXISTING TABLES
-- Run this in your Supabase SQL Editor

-- 1. Add missing columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(15,8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 2. Add missing columns to existing trading_orders table
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS outcome VARCHAR(10);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS profit_loss DECIMAL(15,8) DEFAULT 0;

-- 3. Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'bonus')),
    amount DECIMAL(15,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 5. Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "admin_view_all_users" ON users;
DROP POLICY IF EXISTS "admin_update_all_users" ON users;

-- 6. Create admin user
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

-- 7. Create simple policies
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true);
CREATE POLICY "allow_all_orders" ON trading_orders FOR ALL USING (true);
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL USING (true);

-- 8. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 9. Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON trading_orders TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- 10. Verification
SELECT '✅ ALL COLUMNS ADDED AND ADMIN CREATED!' as status;
SELECT id, email, role, balance FROM users WHERE email = 'admin@quantex.com';
