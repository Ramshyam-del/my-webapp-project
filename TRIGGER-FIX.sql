-- =====================================================
-- FIX FOR TRIGGER CONFLICT
-- =====================================================

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status, created_at, updated_at)
    VALUES (NEW.id, NEW.email, 'user', 'active', NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DROP EXISTING TRIGGERS TO AVOID CONFLICTS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_configuration_updated_at ON public.configuration;
DROP TRIGGER IF EXISTS update_crypto_pairs_updated_at ON public.crypto_pairs;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
DROP TRIGGER IF EXISTS update_deposits_updated_at ON public.deposits;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.withdrawals;
DROP TRIGGER IF EXISTS update_mining_pools_updated_at ON public.mining_pools;
DROP TRIGGER IF EXISTS update_mining_payouts_updated_at ON public.mining_payouts;
DROP TRIGGER IF EXISTS update_system_notifications_updated_at ON public.system_notifications;

-- =====================================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view configuration" ON public.configuration;
DROP POLICY IF EXISTS "Only admins can modify configuration" ON public.configuration;
DROP POLICY IF EXISTS "Anyone can view crypto pairs" ON public.crypto_pairs;
DROP POLICY IF EXISTS "Only admins can modify crypto pairs" ON public.crypto_pairs;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can view trades" ON public.trades;
DROP POLICY IF EXISTS "Only admins can create trades" ON public.trades;
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can create own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can create own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Anyone can view mining pools" ON public.mining_pools;
DROP POLICY IF EXISTS "Only admins can modify mining pools" ON public.mining_pools;
DROP POLICY IF EXISTS "Users can view own mining payouts" ON public.mining_payouts;
DROP POLICY IF EXISTS "Admins can view all mining payouts" ON public.mining_payouts;
DROP POLICY IF EXISTS "Only admins can view operation logs" ON public.operation_logs;
DROP POLICY IF EXISTS "Anyone can view system notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Only admins can modify system notifications" ON public.system_notifications;

-- Now you can run the main COMPLETE-SUPABASE-SETUP.sql script without conflicts
