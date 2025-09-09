const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
    process.exit(1);
}

// Extract database URL from Supabase URL
const dbUrl = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${dbUrl}.supabase.co:5432/postgres`;

async function fixTradingOrdersColumns() {
    let pool;
    try {
        console.log('Connecting to database...');
        
        // Try using direct PostgreSQL connection if available
        if (process.env.SUPABASE_DB_PASSWORD) {
            pool = new Pool({
                connectionString,
                ssl: { rejectUnauthorized: false }
            });
            
            const client = await pool.connect();
            
            console.log('Adding missing columns to trading_orders table...');
            
            // Add entry_price column
            console.log('Adding entry_price column...');
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_orders' AND column_name = 'entry_price' AND table_schema = 'public') THEN
                        ALTER TABLE trading_orders ADD COLUMN entry_price NUMERIC(20,8);
                        RAISE NOTICE 'Added entry_price column';
                    ELSE
                        RAISE NOTICE 'entry_price column already exists';
                    END IF;
                END $$;
            `);
            
            // Add admin_action column
            console.log('Adding admin_action column...');
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_orders' AND column_name = 'admin_action' AND table_schema = 'public') THEN
                        ALTER TABLE trading_orders ADD COLUMN admin_action VARCHAR(20) DEFAULT NULL;
                        RAISE NOTICE 'Added admin_action column';
                    ELSE
                        RAISE NOTICE 'admin_action column already exists';
                    END IF;
                END $$;
            `);
            
            // Add expiry_ts column
            console.log('Adding expiry_ts column...');
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_orders' AND column_name = 'expiry_ts' AND table_schema = 'public') THEN
                        ALTER TABLE trading_orders ADD COLUMN expiry_ts TIMESTAMP DEFAULT NULL;
                        RAISE NOTICE 'Added expiry_ts column';
                    ELSE
                        RAISE NOTICE 'expiry_ts column already exists';
                    END IF;
                END $$;
            `);
            
            // Add user_name column
            console.log('Adding user_name column...');
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trading_orders' AND column_name = 'user_name' AND table_schema = 'public') THEN
                        ALTER TABLE trading_orders ADD COLUMN user_name VARCHAR(255) DEFAULT NULL;
                        RAISE NOTICE 'Added user_name column';
                    ELSE
                        RAISE NOTICE 'user_name column already exists';
                    END IF;
                END $$;
            `);
            
            // Update existing records
            console.log('Updating existing records with default values...');
            await client.query(`
                UPDATE trading_orders SET 
                    entry_price = COALESCE(entry_price, price)
                WHERE entry_price IS NULL AND price IS NOT NULL;
            `);
            
            // Create indexes
            console.log('Creating indexes...');
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_trading_orders_expiry_ts ON trading_orders(expiry_ts);
            `);
            
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_trading_orders_admin_action ON trading_orders(admin_action);
            `);
            
            client.release();
            console.log('✅ Trading orders columns migration completed successfully!');
            
        } else {
            console.log('No direct database connection available.');
            console.log('Please run the following SQL manually in your Supabase SQL editor:');
            console.log('\n--- START SQL ---');
            console.log(`
-- Add missing columns to trading_orders table
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8);
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS admin_action VARCHAR(20) DEFAULT NULL;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS expiry_ts TIMESTAMP DEFAULT NULL;
ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) DEFAULT NULL;

-- Update existing records
UPDATE trading_orders SET entry_price = COALESCE(entry_price, price) WHERE entry_price IS NULL AND price IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trading_orders_expiry_ts ON trading_orders(expiry_ts);
CREATE INDEX IF NOT EXISTS idx_trading_orders_admin_action ON trading_orders(admin_action);
            `);
            console.log('--- END SQL ---\n');
        }
        
    } catch (error) {
        console.error('Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run the migration
fixTradingOrdersColumns().then(() => {
    console.log('Migration script completed.');
    process.exit(0);
}).catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
});