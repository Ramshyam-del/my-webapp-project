const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
    try {
        console.log('🔧 Adding missing columns to trading_orders table...');
        
        // SQL commands to add missing columns
        const sqlCommands = [
            `ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8);`,
            `ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS admin_action VARCHAR(20) DEFAULT NULL;`,
            `ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS expiry_ts TIMESTAMP DEFAULT NULL;`,
            `ALTER TABLE trading_orders ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) DEFAULT NULL;`,
            `UPDATE trading_orders SET entry_price = COALESCE(entry_price, price) WHERE entry_price IS NULL AND price IS NOT NULL;`,
            `CREATE INDEX IF NOT EXISTS idx_trading_orders_expiry_ts ON trading_orders(expiry_ts);`,
            `CREATE INDEX IF NOT EXISTS idx_trading_orders_admin_action ON trading_orders(admin_action);`
        ];
        
        // Execute each SQL command
        for (let i = 0; i < sqlCommands.length; i++) {
            const sql = sqlCommands[i];
            console.log(`Executing command ${i + 1}/${sqlCommands.length}...`);
            
            try {
                // Use Supabase RPC to execute raw SQL
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: sql
                });
                
                if (error) {
                    console.warn(`⚠️  Warning on command ${i + 1}:`, error.message);
                    // Continue with other commands
                } else {
                    console.log(`✅ Command ${i + 1} executed successfully`);
                }
            } catch (err) {
                console.warn(`⚠️  Error on command ${i + 1}:`, err.message);
                // Continue with other commands
            }
        }
        
        console.log('\n🎉 Migration completed!');
        
        // Verify the columns were added
        console.log('\n🔍 Verifying table structure...');
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'trading_orders')
            .eq('table_schema', 'public')
            .in('column_name', ['entry_price', 'admin_action', 'expiry_ts', 'user_name']);
            
        if (columnsError) {
            console.error('❌ Error verifying columns:', columnsError);
        } else {
            console.log('📋 New columns in trading_orders table:');
            columns.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        
        // Provide manual SQL as fallback
        console.log('\n📝 Manual SQL to run in Supabase SQL Editor:');
        console.log('\n--- COPY AND PASTE THIS SQL ---');
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
        
        process.exit(1);
    }
}

// Run the migration
addMissingColumns().then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
});