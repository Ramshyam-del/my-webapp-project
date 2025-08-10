-- Fix trading_orders status constraint for production
-- Drop the existing constraint and recreate it with all needed statuses

-- First, drop the existing constraint
ALTER TABLE trading_orders DROP CONSTRAINT IF EXISTS trading_orders_status_check;

-- Recreate the constraint with all needed statuses
ALTER TABLE trading_orders ADD CONSTRAINT trading_orders_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'failed', 'processing'));

-- Ensure all required columns exist
DO $$ 
BEGIN
    -- Add order_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_orders' AND column_name = 'order_number') THEN
        ALTER TABLE trading_orders ADD COLUMN order_number VARCHAR(50);
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_orders' AND column_name = 'expires_at') THEN
        ALTER TABLE trading_orders ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_orders' AND column_name = 'completed_at') THEN
        ALTER TABLE trading_orders ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add outcome column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_orders' AND column_name = 'outcome') THEN
        ALTER TABLE trading_orders ADD COLUMN outcome VARCHAR(20);
    END IF;

    -- Add profit_loss column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trading_orders' AND column_name = 'profit_loss') THEN
        ALTER TABLE trading_orders ADD COLUMN profit_loss DECIMAL(15,8);
    END IF;

    -- Add balance column to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'balance') THEN
        ALTER TABLE users ADD COLUMN balance DECIMAL(15,8) DEFAULT 0.00;
    END IF;
END $$;

-- Update admin user to ensure it exists with proper role
INSERT INTO users (id, email, role, status, balance, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    'admin',
    'active',
    10000.00,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'admin@quantex.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    balance = 10000.00,
    updated_at = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Ensure RLS policies are properly set
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trading_orders
DROP POLICY IF EXISTS "Users can view own orders" ON trading_orders;
CREATE POLICY "Users can view own orders" ON trading_orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON trading_orders;
CREATE POLICY "Users can insert own orders" ON trading_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON trading_orders;
CREATE POLICY "Users can update own orders" ON trading_orders
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON trading_orders;
CREATE POLICY "Admins can view all orders" ON trading_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all orders" ON trading_orders;
CREATE POLICY "Admins can update all orders" ON trading_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create RLS policies for users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Verify the setup
SELECT 'Database constraints and policies updated successfully!' as status;
