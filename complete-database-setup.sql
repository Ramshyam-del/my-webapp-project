-- Complete Quantex Platform Database Setup
-- Copy and paste this entire file into Supabase SQL Editor

-- Drop existing tables if needed
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS trading_orders CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS web_config CASCADE;
DROP TABLE IF EXISTS configurations CASCADE;

-- Create users table (FIXED)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR, -- Removed NOT NULL constraint
  username VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR,
  kyc_status VARCHAR DEFAULT 'pending',
  balance_btc DECIMAL(18,8) DEFAULT 0,
  balance_eth DECIMAL(18,8) DEFAULT 0,
  balance_usdt DECIMAL(18,8) DEFAULT 0,
  balance_usdc DECIMAL(18,8) DEFAULT 0,
  balance_pyusd DECIMAL(18,8) DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table (FIXED)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'transfer')),
  amount DECIMAL(18,8) NOT NULL,
  currency VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rejected')),
  description TEXT,
  tx_hash VARCHAR,
  wallet_address VARCHAR,
  network VARCHAR,
  fee DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trading_orders table (FIXED)
CREATE TABLE trading_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pair VARCHAR NOT NULL,
  symbol VARCHAR,
  side VARCHAR NOT NULL CHECK (side IN ('buy', 'sell')),
  type VARCHAR NOT NULL CHECK (type IN ('spot', 'binary')),
  amount DECIMAL(18,8) NOT NULL,
  price DECIMAL(18,8),
  leverage INTEGER DEFAULT 1,
  duration INTEGER DEFAULT 60,
  duration_percentage DECIMAL(5,2) DEFAULT 100.0,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'filled', 'cancelled', 'expired')),
  result VARCHAR CHECK (result IN ('win', 'loss', 'draw')),
  profit_loss DECIMAL(18,8) DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table (FIXED)
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create price_alerts table (FIXED)
CREATE TABLE price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pair VARCHAR NOT NULL,
  target_price DECIMAL(18,8) NOT NULL,
  condition VARCHAR NOT NULL CHECK (condition IN ('above', 'below')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create web_config table (FIXED)
CREATE TABLE web_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value TEXT,
  value_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create configurations table (NEW)
CREATE TABLE configurations (
  id INTEGER PRIMARY KEY DEFAULT 1,
  deposit_addresses JSONB DEFAULT '{
    "usdt": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "btc": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "eth": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "bnb": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }',
  system_settings JSONB DEFAULT '{
    "maintenance_mode": false,
    "trading_enabled": true,
    "deposit_enabled": true,
    "withdrawal_enabled": true
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO configurations (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert default web configuration (UPDATED BRANDING)
INSERT INTO web_config (key, value, value_json) VALUES 
('site_title', 'Quantex', '"Quantex"'),
('site_description', 'Advanced cryptocurrency trading platform', '"Advanced cryptocurrency trading platform"'),
('contact_email', 'support@quantex.com', '"support@quantex.com"'),
('contact_whatsapp', '+1234567890', '"+1234567890"'),
('working_hours', '24/7', '"24/7"'),
('btc_wallet_address', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', '"bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"'),
('eth_wallet_address', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '"0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"'),
('usdt_wallet_address', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', '"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"'),
('usdc_wallet_address', '0xA0b86a33E6441b8C4C8C2C8C2C8C2C8C2C8C2C8C', '"0xA0b86a33E6441b8C4C8C2C8C2C8C2C8C2C8C2C8C"'),
('pyusd_wallet_address', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '"0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"'),
('site_config', '{"site_name": "Quantex", "site_description": "Advanced Cryptocurrency Exchange Platform", "maintenance_mode": false, "registration_enabled": true, "trading_enabled": true}', '{"site_name": "Quantex", "site_description": "Advanced Cryptocurrency Exchange Platform", "maintenance_mode": false, "registration_enabled": true, "trading_enabled": true}'),
('deposit_addresses', '{"btc": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "eth": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", "usdt": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "usdc": "0xA0b86a33E6441b8C4C8C2C8C2C8C2C8C2C8C2C8C", "pyusd": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"}', '{"btc": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "eth": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", "usdt": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "usdc": "0xA0b86a33E6441b8C4C8C2C8C2C8C2C8C2C8C2C8C", "pyusd": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"}');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX idx_trading_orders_status ON trading_orders(status);
CREATE INDEX idx_trading_orders_created_at ON trading_orders(created_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users (COMPLETE)
CREATE POLICY "Users can view own data" ON users 
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own data" ON users 
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users 
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update all users" ON users 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create RLS policies for transactions (COMPLETE)
CREATE POLICY "Users can view own transactions" ON transactions 
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own transactions" ON transactions 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own transactions" ON transactions 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all transactions" ON transactions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update all transactions" ON transactions 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create RLS policies for trading_orders (COMPLETE)
CREATE POLICY "Users can view own orders" ON trading_orders 
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own orders" ON trading_orders 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own orders" ON trading_orders 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all orders" ON trading_orders 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update all orders" ON trading_orders 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create RLS policies for notifications (COMPLETE)
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all notifications" ON notifications 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create RLS policies for price_alerts (COMPLETE)
CREATE POLICY "Users can view own alerts" ON price_alerts 
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own alerts" ON price_alerts 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own alerts" ON price_alerts 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own alerts" ON price_alerts 
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for web_config (FIXED)
CREATE POLICY "Public can view web config" ON web_config 
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage web config" ON web_config 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create RLS policies for configurations
CREATE POLICY "Public can read configurations" ON configurations 
  FOR SELECT USING (true);

CREATE POLICY "Admins can update configurations" ON configurations 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, status, role)
  VALUES (NEW.id, NEW.email, 'active', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update configurations
CREATE OR REPLACE FUNCTION update_configuration(
  p_deposit_addresses JSONB DEFAULT NULL,
  p_system_settings JSONB DEFAULT NULL
) RETURNS configurations AS $$
DECLARE
  updated_config configurations;
BEGIN
  UPDATE configurations 
  SET 
    deposit_addresses = COALESCE(p_deposit_addresses, deposit_addresses),
    system_settings = COALESCE(p_system_settings, system_settings),
    updated_at = NOW()
  WHERE id = 1
  RETURNING * INTO updated_config;
  
  RETURN updated_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get configuration
CREATE OR REPLACE FUNCTION get_configuration()
RETURNS configurations AS $$
DECLARE
  config configurations;
BEGIN
  SELECT * INTO config FROM configurations WHERE id = 1;
  RETURN config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if system is in maintenance mode
CREATE OR REPLACE FUNCTION is_maintenance_mode()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT system_settings->>'maintenance_mode' = 'true' FROM configurations WHERE id = 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if trading is enabled
CREATE OR REPLACE FUNCTION is_trading_enabled()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT system_settings->>'trading_enabled' = 'true' FROM configurations WHERE id = 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync configurations with web_config
CREATE OR REPLACE FUNCTION sync_configurations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update web_config when configurations change
  UPDATE web_config 
  SET value_json = jsonb_set(
    COALESCE(value_json, '{}'::jsonb),
    '{deposit_addresses}',
    NEW.deposit_addresses
  )
  WHERE key = 'deposit_addresses';
  
  UPDATE web_config 
  SET value_json = jsonb_set(
    COALESCE(value_json, '{}'::jsonb),
    '{system_settings}',
    NEW.system_settings
  )
  WHERE key = 'site_config';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic sync
DROP TRIGGER IF EXISTS sync_configurations_trigger ON configurations;
CREATE TRIGGER sync_configurations_trigger
  AFTER UPDATE ON configurations
  FOR EACH ROW EXECUTE FUNCTION sync_configurations();

-- Create view for admin dashboard with configuration info
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM trading_orders) as total_orders,
  (SELECT COUNT(*) FROM transactions) as total_transactions,
  (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_24h,
  (SELECT COUNT(*) FROM trading_orders WHERE created_at >= NOW() - INTERVAL '24 hours') as new_orders_24h,
  (SELECT system_settings->>'maintenance_mode' FROM configurations WHERE id = 1) as maintenance_mode,
  (SELECT system_settings->>'trading_enabled' FROM configurations WHERE id = 1) as trading_enabled,
  (SELECT system_settings->>'deposit_enabled' FROM configurations WHERE id = 1) as deposit_enabled,
  (SELECT system_settings->>'withdrawal_enabled' FROM configurations WHERE id = 1) as withdrawal_enabled;

-- Success message
SELECT 'Complete Quantex database setup completed successfully!' as status; 