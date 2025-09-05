# Quantex Trading Platform Database Schema

This directory contains the complete database schema for the Quantex Trading Platform, designed for use with Supabase PostgreSQL.

## 📁 Files Overview

### `quantex-complete-schema.sql`
The master database schema file containing all tables, indexes, functions, and security policies needed for the trading platform.

## 🚀 Quick Setup

### 1. Run the Schema
```sql
-- In your Supabase SQL editor, run:
\i quantex-complete-schema.sql
```

### 2. Create Admin User
After running the schema, create an admin user through your application and update their role:
```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'your-admin@email.com';
```

## 📊 Database Structure

### Core Tables

#### 👥 Users Management
- **`auth.users`** - Enhanced Supabase auth users with trading-specific columns
- **`public.users`** - Additional user profile data and preferences
- **`user_activities`** - User action logging and audit trail

#### 💰 Financial System
- **`portfolios`** - User cryptocurrency and fiat balances
- **`fund_transactions`** - All deposit/withdrawal transactions
- **`crypto_deposits`** - Blockchain deposit tracking with confirmations
- **`mining_payouts`** - Mining reward distributions

#### 📈 Trading Engine
- **`crypto_pairs`** - Available trading pairs (BTC/USDT, ETH/USDT, etc.)
- **`orders`** - Buy/sell orders (market, limit, stop)
- **`trades`** - Executed trades and positions

#### ⚙️ Administration
- **`operation_logs`** - Admin action logging
- **`configurations`** - System settings and parameters

## 🔐 Security Features

### Row Level Security (RLS)
All tables have comprehensive RLS policies:
- Users can only access their own data
- Admins have full access to all records
- Public data (like crypto pairs) is accessible to all

### User Roles
- **`user`** - Standard trading account
- **`admin`** - Platform administrator
- **`super_admin`** - Full system access
- **`moderator`** - Limited admin privileges

### Account Status
- **`active`** - Normal trading account
- **`inactive`** - Temporarily disabled
- **`suspended`** - Admin suspended
- **`pending_verification`** - Awaiting KYC
- **`banned`** - Permanently banned
- **`frozen`** - Temporarily frozen

## 💡 Key Features

### 1. Precision Balance Management
- Uses `NUMERIC(20,8)` for cryptocurrency precision
- Automatic balance validation and constraints
- `adjust_balance()` function for safe balance updates

### 2. Comprehensive Trading Support
- Multiple order types (market, limit, stop, stop-limit)
- Leverage trading up to 100x
- Stop-loss and take-profit functionality
- Time-in-force options (GTC, IOC, FOK)

### 3. Multi-Currency Support
Supported currencies:
- **Cryptocurrencies**: BTC, ETH, USDT, USDC, BNB, ADA, DOT, LINK, LTC
- **Fiat**: USD, EUR

### 4. Advanced Security
- Two-factor authentication support
- Login attempt tracking and account locking
- IP address and device tracking
- Comprehensive audit logging

### 5. KYC/Compliance
- Multiple verification levels
- Document verification tracking
- Country-based restrictions
- Daily withdrawal/deposit limits

## 🔧 Utility Functions

### `adjust_balance(user_id, currency, amount, transaction_id, updated_by)`
Safely adjusts user portfolio balances with validation:
```sql
-- Add 100 USDT to user balance
SELECT adjust_balance(
    'user-uuid-here',
    'USDT',
    100.00000000,
    'transaction-uuid',
    'admin-uuid'
);
```

### `update_updated_at_column()`
Automatically updates `updated_at` timestamps on record changes.

## 📈 Performance Optimizations

### Indexes
Comprehensive indexing strategy:
- User lookup indexes (email, username, status)
- Portfolio balance queries
- Trading pair lookups
- Transaction history queries
- Admin reporting queries

### Generated Columns
- `available_balance` = `balance` - `locked_balance`
- `remaining_amount` = `amount` - `filled_amount`

## 🎯 Default Data

### Crypto Trading Pairs
Pre-configured with popular trading pairs:
- BTC/USDT, ETH/USDT, ADA/USDT
- DOT/USDT, LINK/USDT, LTC/USDT
- BNB/USDT, USDC/USDT

### System Configurations
Default platform settings:
- Trading fees (0.1% maker/taker)
- Withdrawal limits by account type
- Supported currencies list
- Platform maintenance settings

## 🔄 Migration from Old Schema

If you have existing data, follow these steps:

1. **Backup existing data**
2. **Run the new schema**
3. **Migrate user data** to the enhanced users table
4. **Update API endpoints** to use new table structure
5. **Test all functionality** thoroughly

## 🚨 Important Notes

### Balance Precision
- Always use `NUMERIC(20,8)` for cryptocurrency amounts
- Never use floating-point arithmetic for financial calculations
- Use the `adjust_balance()` function for all balance changes

### Security
- All financial operations require proper authentication
- Admin actions are logged in `operation_logs`
- User activities are tracked in `user_activities`

### Performance
- Use appropriate indexes for your query patterns
- Consider partitioning large tables (trades, transactions) by date
- Monitor query performance and add indexes as needed

## 📞 Support

For questions about the database schema:
1. Check the inline SQL comments
2. Review the RLS policies for access patterns
3. Examine the constraints for business rules
4. Test with sample data before production use

---

**Generated for Quantex Trading Platform**  
*Production-ready PostgreSQL schema for Supabase*