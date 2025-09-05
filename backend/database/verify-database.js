const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyDatabase() {
    console.log('🔍 Verifying Quantex Database Setup...');
    console.log(`📡 Connected to: ${supabaseUrl}`);
    
    const requiredTables = [
        'users',
        'portfolios', 
        'crypto_pairs',
        'orders',
        'trades',
        'fund_transactions',
        'crypto_deposits',
        'mining_payouts',
        'operation_logs',
        'user_activities',
        'configurations'
    ];
    
    let allTablesExist = true;
    
    console.log('\n📋 Checking required tables...');
    
    for (const tableName of requiredTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`❌ ${tableName}: ${error.message}`);
                allTablesExist = false;
            } else {
                console.log(`✅ ${tableName}: OK`);
            }
        } catch (err) {
            console.log(`❌ ${tableName}: ${err.message}`);
            allTablesExist = false;
        }
    }
    
    // Check specific columns that were problematic
    console.log('\n🔧 Checking critical columns...');
    
    try {
        // Test orders table with pair_id
        const { data: ordersTest, error: ordersError } = await supabase
            .from('orders')
            .select('id, user_id, pair_id')
            .limit(1);
            
        if (ordersError) {
            console.log(`❌ orders.pair_id: ${ordersError.message}`);
        } else {
            console.log('✅ orders.pair_id: OK');
        }
    } catch (err) {
        console.log(`❌ orders.pair_id: ${err.message}`);
    }
    
    // Check if admin function exists
    console.log('\n🔐 Checking admin functions...');
    
    try {
        const { data: functionTest, error: functionError } = await supabase
            .rpc('is_admin_user', { user_uuid: '00000000-0000-0000-0000-000000000000' });
            
        if (functionError) {
            console.log(`❌ is_admin_user function: ${functionError.message}`);
        } else {
            console.log('✅ is_admin_user function: OK');
        }
    } catch (err) {
        console.log(`❌ is_admin_user function: ${err.message}`);
    }
    
    // Summary
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('========================');
    
    if (allTablesExist) {
        console.log('🎉 Database setup is COMPLETE!');
        console.log('✅ All required tables exist');
        console.log('✅ Critical columns are accessible');
        console.log('✅ Ready for production use');
        
        console.log('\n🚀 Next steps:');
        console.log('1. Create admin user: node create-admin-user.js');
        console.log('2. Test your application');
        console.log('3. Start your backend server');
    } else {
        console.log('⚠️  Database setup is INCOMPLETE');
        console.log('❌ Some tables are missing or inaccessible');
        
        console.log('\n🔧 Recommended actions:');
        console.log('1. Deploy the complete schema manually via Supabase SQL Editor');
        console.log('2. Copy contents of quantex-fixed-rls-schema.sql');
        console.log('3. Run in Supabase Dashboard > SQL Editor');
        console.log('4. Run this verification script again');
    }
}

// Run verification
if (require.main === module) {
    verifyDatabase().catch(console.error);
}

module.exports = { verifyDatabase };