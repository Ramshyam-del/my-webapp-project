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

async function runMigration() {
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
            
            console.log('Adding missing columns to trades table...');
            
            // Add entry_price column
            console.log('Adding entry_price column...');
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_price' AND table_schema = 'public') THEN
                        ALTER TABLE trades ADD COLUMN entry_price NUMERIC(20,8);
                        RAISE NOTICE 'Added entry_price column';
                    ELSE
                        RAISE NOTICE 'entry_price column already exists';
                    END IF;
                END $$;
            `);
            
            // Add trade_type column
            console.log('Adding trade_type column...');
            await client.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_type' AND table_schema = 'public') THEN
                        ALTER TABLE trades ADD COLUMN trade_type TEXT;
                        RAISE NOTICE 'Added trade_type column';
                    ELSE
                        RAISE NOTICE 'trade_type column already exists';
                    END IF;
                END $$;
            `);
            
            // Update existing records
            console.log('Updating existing records with default values...');
            await client.query(`
                UPDATE trades SET 
                    entry_price = COALESCE(entry_price, 50000),
                    trade_type = COALESCE(trade_type, 'buy')
                WHERE entry_price IS NULL OR trade_type IS NULL;
            `);
            
            client.release();
            console.log('Migration completed successfully!');
            
        } else {
            console.log('No direct database connection available.');
            console.log('Please run the following SQL manually in your Supabase SQL editor:');
            console.log('\n--- START SQL ---');
            console.log(`
-- Add entry_price column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'entry_price' AND table_schema = 'public') THEN
        ALTER TABLE trades ADD COLUMN entry_price NUMERIC(20,8);
        RAISE NOTICE 'Added entry_price column';
    ELSE
        RAISE NOTICE 'entry_price column already exists';
    END IF;
END $$;

-- Add trade_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_type' AND table_schema = 'public') THEN
        ALTER TABLE trades ADD COLUMN trade_type TEXT;
        RAISE NOTICE 'Added trade_type column';
    ELSE
        RAISE NOTICE 'trade_type column already exists';
    END IF;
END $$;

-- Update existing records with default values
UPDATE trades SET 
    entry_price = COALESCE(entry_price, 50000),
    trade_type = COALESCE(trade_type, 'buy')
WHERE entry_price IS NULL OR trade_type IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trades' 
AND table_schema = 'public'
ORDER BY ordinal_position;
            `);
            console.log('--- END SQL ---\n');
        }
        
        // Test the trades table
        console.log('Testing trades table access...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: testData, error: testError } = await supabase
            .from('trades')
            .select('id, entry_price, trade_type')
            .limit(1);
            
        if (testError) {
            console.error('Error testing trades table:', testError);
            console.log('The migration may need to be run manually.');
        } else {
            console.log('Trades table test successful:', testData);
        }
        
    } catch (error) {
        console.error('Migration failed:', error);
        console.log('\nPlease run the SQL manually in your Supabase dashboard.');
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

runMigration();