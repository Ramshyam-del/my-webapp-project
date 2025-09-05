const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function deployPairIdFix() {
    console.log('🔧 Starting pair_id column fix...');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
        console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
        process.exit(1);
    }
    
    console.log('📡 Connecting to:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // First ensure crypto_pairs table exists
        console.log('🔍 Ensuring crypto_pairs table exists...');
        const { error: createTableError } = await supabase.rpc('exec_sql', {
            sql: `CREATE TABLE IF NOT EXISTS crypto_pairs (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                symbol TEXT UNIQUE NOT NULL,
                base_currency TEXT NOT NULL,
                quote_currency TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
            );`
        });
        
        if (createTableError) {
            console.log('⚠️ exec_sql not available, trying direct query...');
        }
        
        // Add the pair_id column
        console.log('➕ Adding pair_id column to orders table...');
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS pair_id UUID REFERENCES crypto_pairs(id);'
        });
        
        if (alterError) {
            console.log('⚠️ exec_sql failed, trying alternative approach...');
            // Try using a different approach
            const { error: directError } = await supabase
                .from('orders')
                .select('id, pair_id')
                .limit(1);
                
            if (directError && directError.code === '42703') {
                console.log('❌ Column still missing. Manual intervention required.');
                console.log('\n📋 Manual steps needed:');
                console.log('1. Go to Supabase Dashboard > SQL Editor');
                console.log('2. Execute: ALTER TABLE orders ADD COLUMN pair_id UUID REFERENCES crypto_pairs(id);');
                console.log('3. Execute: CREATE INDEX idx_orders_pair_id ON orders(pair_id);');
                process.exit(1);
            }
        }
        
        // Add index
        console.log('📊 Adding index for pair_id column...');
        await supabase.rpc('exec_sql', {
            sql: 'CREATE INDEX IF NOT EXISTS idx_orders_pair_id ON orders(pair_id);'
        });
        
        // Verify the column exists
        console.log('✅ Verifying pair_id column...');
        const { data, error } = await supabase
            .from('orders')
            .select('id, pair_id')
            .limit(1);
            
        if (error) {
            if (error.code === '42703') {
                console.log('❌ pair_id column still missing!');
                process.exit(1);
            } else {
                console.log('⚠️ Verification error:', error.message);
            }
        } else {
            console.log('✅ pair_id column successfully added!');
        }
        
        console.log('\n🎉 pair_id column fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

deployPairIdFix();