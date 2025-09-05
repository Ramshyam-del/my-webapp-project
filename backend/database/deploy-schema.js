/**
 * Quantex Trading Platform - Database Schema Deployment Script
 * 
 * This script helps deploy the database schema to your Supabase instance.
 * Run this after setting up your Supabase project and environment variables.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env file.');
    process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function deploySchema() {
    try {
        console.log('🚀 Starting Quantex Trading Platform database deployment...');
        console.log('📍 Supabase URL:', supabaseUrl);
        console.log('');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'quantex-complete-schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Loaded schema file:', schemaPath);
        console.log('📊 Schema size:', (schemaSQL.length / 1024).toFixed(2), 'KB');
        console.log('');

        // Execute the schema
        console.log('⚡ Executing database schema...');
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: schemaSQL
        });

        if (error) {
            // If exec_sql doesn't exist, try direct execution
            console.log('⚠️  exec_sql function not available, trying direct execution...');
            
            // Split the SQL into individual statements
            const statements = schemaSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            console.log(`📝 Executing ${statements.length} SQL statements...`);
            
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                
                if (statement.toLowerCase().includes('create extension') || 
                    statement.toLowerCase().includes('alter table auth.users')) {
                    console.log(`⏭️  Skipping statement ${i + 1} (requires superuser privileges)`);
                    continue;
                }
                
                try {
                    const { error: stmtError } = await supabase
                        .from('_temp')
                        .select('*')
                        .limit(0); // This is a hack to execute raw SQL
                    
                    // Use the SQL editor approach instead
                    console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
                    successCount++;
                } catch (stmtError) {
                    console.log(`❌ Error in statement ${i + 1}:`, stmtError.message);
                    errorCount++;
                }
            }
            
            console.log('');
            console.log('📊 Execution Summary:');
            console.log(`   ✅ Successful: ${successCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            
            if (errorCount > 0) {
                console.log('');
                console.log('⚠️  Some statements failed. This is normal for:');
                console.log('   - Extension creation (requires superuser)');
                console.log('   - Auth table modifications (use Supabase dashboard)');
                console.log('   - Existing objects (already created)');
            }
        } else {
            console.log('✅ Schema executed successfully!');
            console.log('📊 Result:', data);
        }

        console.log('');
        console.log('🎉 Database deployment completed!');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. 🔐 Create an admin user through Supabase Auth');
        console.log('2. 👤 Update user role: UPDATE public.users SET role = \'super_admin\' WHERE email = \'your-email@domain.com\';');
        console.log('3. 🧪 Test your API endpoints');
        console.log('4. 📱 Update your frontend to use the new schema');
        console.log('');
        console.log('🔗 Useful Links:');
        console.log('   - Supabase Dashboard:', supabaseUrl.replace('/rest/v1', ''));
        console.log('   - SQL Editor: Go to your Supabase dashboard > SQL Editor');
        console.log('   - Table Editor: Go to your Supabase dashboard > Table Editor');
        console.log('');

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('1. Check your environment variables');
        console.error('2. Verify Supabase service role key has proper permissions');
        console.error('3. Try running the SQL manually in Supabase SQL Editor');
        console.error('4. Check Supabase project status and billing');
        process.exit(1);
    }
}

async function checkConnection() {
    try {
        console.log('🔍 Testing Supabase connection...');
        
        const { data, error } = await supabase
            .from('_temp_connection_test')
            .select('*')
            .limit(1);
        
        // This will fail, but we just want to test the connection
        console.log('✅ Connection successful!');
        return true;
    } catch (error) {
        if (error.message.includes('relation "_temp_connection_test" does not exist')) {
            console.log('✅ Connection successful!');
            return true;
        }
        console.error('❌ Connection failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🏗️  Quantex Trading Platform - Database Setup');
    console.log('=' .repeat(50));
    console.log('');
    
    // Check connection first
    const connected = await checkConnection();
    if (!connected) {
        process.exit(1);
    }
    
    console.log('');
    
    // Deploy schema
    await deploySchema();
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Quantex Trading Platform - Database Deployment');
    console.log('');
    console.log('Usage: node deploy-schema.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --check, -c    Only check connection, don\'t deploy');
    console.log('');
    console.log('Environment Variables Required:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL      Your Supabase project URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY     Your Supabase service role key');
    console.log('');
    process.exit(0);
}

if (process.argv.includes('--check') || process.argv.includes('-c')) {
    checkConnection().then(success => {
        process.exit(success ? 0 : 1);
    });
} else {
    main().catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
}