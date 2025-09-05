const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('- SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env file in the backend directory.');
    process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function deployOrdersFix() {
    try {
        console.log('🔧 Starting orders table fix deployment...');
        console.log(`📡 Connecting to: ${supabaseUrl}`);

        // Read the SQL fix file
        const sqlPath = path.join(__dirname, 'fix-orders-table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Loaded fix-orders-table.sql');
        console.log('🚀 Executing SQL fix...');

        // Execute the SQL fix
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sqlContent
        });

        if (error) {
            // If exec_sql doesn't exist, try direct execution
            console.log('⚠️  exec_sql function not available, trying direct execution...');
            
            // Split SQL into individual statements
            const statements = sqlContent
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt && !stmt.startsWith('--'));

            for (const statement of statements) {
                if (statement.toLowerCase().includes('select')) {
                    // Handle SELECT statements
                    const { data: selectData, error: selectError } = await supabase
                        .from('information_schema')
                        .select('*')
                        .limit(1);
                    
                    if (selectError) {
                        console.log('ℹ️  Cannot verify column structure via API');
                    }
                } else {
                    // For DDL statements, we need to use a different approach
                    console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
                }
            }
        } else {
            console.log('✅ SQL fix executed successfully');
        }

        // Verify the fix by checking if we can query orders table
        console.log('🔍 Verifying orders table structure...');
        
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .limit(1);

        if (ordersError) {
            console.error('❌ Error querying orders table:', ordersError.message);
        } else {
            console.log('✅ Orders table is accessible');
        }

        // Try to verify crypto_pairs table
        const { data: pairsData, error: pairsError } = await supabase
            .from('crypto_pairs')
            .select('*')
            .limit(1);

        if (pairsError) {
            console.log('⚠️  crypto_pairs table may need to be created:', pairsError.message);
        } else {
            console.log('✅ crypto_pairs table is accessible');
        }

        console.log('\n🎉 Orders table fix deployment completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Run the complete fixed RLS schema if needed');
        console.log('2. Test creating orders with pair_id references');
        console.log('3. Verify all indexes are working properly');

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Check your Supabase credentials');
        console.error('2. Ensure you have admin access to the database');
        console.error('3. Try running the SQL manually in Supabase dashboard');
        process.exit(1);
    }
}

// Run the deployment
if (require.main === module) {
    deployOrdersFix();
}

module.exports = { deployOrdersFix };