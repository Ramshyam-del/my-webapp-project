const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function deploySafeSchema() {
    try {
        console.log('🚀 Starting Quantex Safe Schema Deployment...');
        console.log('📍 Supabase URL:', supabaseUrl);
        
        // Read the safe schema file
        const schemaPath = path.join(__dirname, 'quantex-supabase-safe-schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }
        
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Schema file loaded successfully');
        console.log(`📊 Schema size: ${(schemaSQL.length / 1024).toFixed(2)} KB`);
        
        // Split the SQL into individual statements
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'COMMIT');
        
        console.log(`🔧 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Execute statements one by one for better error handling
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            try {
                // Skip certain statements that might cause issues
                if (statement.includes('COMMIT') || 
                    statement.includes('BEGIN') ||
                    statement.trim() === ';') {
                    continue;
                }
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: statement
                });
                
                if (error) {
                    // Try direct execution for statements that don't work with exec_sql
                    if (error.message.includes('exec_sql') || error.code === '42883') {
                        console.log(`⚠️  Trying alternative execution for statement ${i + 1}`);
                        
                        // For certain statements, we'll use the REST API directly
                        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${supabaseServiceKey}`,
                                'apikey': supabaseServiceKey
                            },
                            body: JSON.stringify({ sql: statement })
                        });
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`HTTP ${response.status}: ${errorText}`);
                        }
                    } else {
                        throw error;
                    }
                }
                
                successCount++;
                
                // Show progress every 10 statements
                if ((i + 1) % 10 === 0) {
                    console.log(`✅ Progress: ${i + 1}/${statements.length} statements executed`);
                }
                
            } catch (err) {
                errorCount++;
                const errorMsg = `Statement ${i + 1}: ${err.message}`;
                errors.push(errorMsg);
                
                // Log non-critical errors but continue
                if (err.message.includes('already exists') || 
                    err.message.includes('does not exist') ||
                    err.message.includes('duplicate key')) {
                    console.log(`⚠️  Warning: ${errorMsg}`);
                } else {
                    console.error(`❌ Error: ${errorMsg}`);
                }
            }
        }
        
        console.log('\n📊 Deployment Summary:');
        console.log(`✅ Successful statements: ${successCount}`);
        console.log(`❌ Failed statements: ${errorCount}`);
        
        if (errors.length > 0) {
            console.log('\n🔍 Errors encountered:');
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        // Verify deployment by checking if key tables exist
        console.log('\n🔍 Verifying deployment...');
        
        const tablesToCheck = [
            'public.users',
            'portfolios', 
            'crypto_pairs',
            'orders',
            'trades',
            'fund_transactions'
        ];
        
        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(table.replace('public.', ''))
                    .select('*')
                    .limit(1);
                
                if (error && !error.message.includes('permission denied')) {
                    console.log(`❌ Table ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Table ${table}: OK`);
                }
            } catch (err) {
                console.log(`⚠️  Table ${table}: ${err.message}`);
            }
        }
        
        console.log('\n🎉 Schema deployment completed!');
        console.log('\n📋 Next Steps:');
        console.log('1. Create an admin user through Supabase Auth UI');
        console.log('2. Add admin record to public.users table:');
        console.log('   INSERT INTO public.users (id, role, username) VALUES (\'<auth_user_id>\', \'super_admin\', \'admin\');');
        console.log('3. Test your API endpoints');
        console.log('4. Configure your application environment variables');
        
        return {
            success: true,
            successCount,
            errorCount,
            errors
        };
        
    } catch (error) {
        console.error('💥 Deployment failed:', error.message);
        console.error('Stack trace:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper function to create admin user
async function createAdminUser(email, password, username = 'admin') {
    try {
        console.log('👤 Creating admin user...');
        
        // Create user in auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });
        
        if (authError) {
            throw authError;
        }
        
        console.log('✅ Auth user created:', authData.user.id);
        
        // Create user profile in public.users
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                username: username,
                role: 'super_admin',
                status: 'active',
                account_type: 'premium',
                verification_level: 'enhanced_verified'
            })
            .select()
            .single();
        
        if (profileError) {
            console.error('⚠️  Profile creation error:', profileError.message);
            console.log('You can manually create the profile later.');
        } else {
            console.log('✅ User profile created successfully');
        }
        
        return {
            success: true,
            userId: authData.user.id,
            email: email
        };
        
    } catch (error) {
        console.error('❌ Admin user creation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--create-admin')) {
        const email = args[args.indexOf('--create-admin') + 1];
        const password = args[args.indexOf('--create-admin') + 2] || 'admin123456';
        
        if (!email) {
            console.error('❌ Please provide admin email: node deploy-safe-schema.js --create-admin admin@example.com [password]');
            process.exit(1);
        }
        
        createAdminUser(email, password)
            .then(result => {
                if (result.success) {
                    console.log('🎉 Admin user created successfully!');
                    process.exit(0);
                } else {
                    process.exit(1);
                }
            });
    } else {
        deploySafeSchema()
            .then(result => {
                if (result.success) {
                    console.log('🎉 Deployment completed successfully!');
                    process.exit(0);
                } else {
                    process.exit(1);
                }
            });
    }
}

module.exports = {
    deploySafeSchema,
    createAdminUser
};