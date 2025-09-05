const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env file.');
    process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    try {
        console.log('🚀 Creating Admin User for Quantex Trading Platform...');
        console.log('📧 Email: ramshyamgopalhari@gmail.com');
        console.log('');

        // Admin user credentials
        const adminEmail = 'ramshyamgopalhari@gmail.com';
        const adminPassword = '@Million2026';
        const adminUsername = 'admin';
        const adminFirstName = 'Ram';
        const adminLastName = 'Shyam';

        // Step 1: Create user in auth.users
        console.log('📝 Step 1: Creating user in Supabase Auth...');
        let authUser;
        const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                username: adminUsername,
                first_name: adminFirstName,
                last_name: adminLastName,
                role: 'super_admin'
            }
        });

        if (authError) {
            if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
                console.log('⚠️  User already exists in auth.users, fetching existing user...');
                
                // Try to get existing user by email
                const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) {
                    throw new Error(`Failed to list users: ${listError.message}`);
                }
                
                const existingUser = existingUsers.users.find(u => u.email === adminEmail);
                if (!existingUser) {
                    throw new Error('User exists but could not be found in user list');
                }
                
                console.log(`✅ Found existing user with ID: ${existingUser.id}`);
                
                // Use existing user data
                authUser = { user: existingUser };
            } else {
                throw authError;
            }
        } else {
            console.log(`✅ Auth user created successfully with ID: ${newAuthUser.user.id}`);
            authUser = newAuthUser;
        }

        const userId = authUser.user.id;

        // Step 2: Create or update user profile in public.users
        console.log('📝 Step 2: Creating admin profile in public.users...');
        
        // First check if profile already exists
        const { data: existingProfile, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (existingProfile) {
            console.log('⚠️  Profile already exists, updating to super_admin...');
            
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    role: 'super_admin',
                    username: adminUsername,
                    first_name: adminFirstName,
                    last_name: adminLastName,
                    status: 'active',
                    account_type: 'premium',
                    verification_level: 'enhanced_verified',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) {
                throw new Error(`Failed to update profile: ${updateError.message}`);
            }
            
            console.log('✅ Profile updated successfully');
        } else {
            // Create new profile
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    username: adminUsername,
                    first_name: adminFirstName,
                    last_name: adminLastName,
                    role: 'super_admin',
                    status: 'active',
                    account_type: 'premium',
                    verification_level: 'enhanced_verified',
                    trading_enabled: true,
                    withdrawal_enabled: true,
                    deposit_enabled: true,
                    max_daily_withdrawal: 1000000.00,
                    max_daily_deposit: 1000000.00,
                    email_notifications: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (insertError) {
                throw new Error(`Failed to create profile: ${insertError.message}`);
            }
            
            console.log('✅ Profile created successfully');
        }

        // Step 3: Create initial portfolios for major currencies
        console.log('📝 Step 3: Setting up initial portfolios...');
        
        const currencies = ['USDT', 'BTC', 'ETH', 'USD'];
        
        for (const currency of currencies) {
            const { data: existingPortfolio } = await supabase
                .from('portfolios')
                .select('id')
                .eq('user_id', userId)
                .eq('currency', currency)
                .single();

            if (!existingPortfolio) {
                const { error: portfolioError } = await supabase
                    .from('portfolios')
                    .insert({
                        user_id: userId,
                        currency: currency,
                        balance: currency === 'USDT' ? 100000.00000000 : 0.00000000, // Give admin 100k USDT for testing
                        locked_balance: 0.00000000
                    });

                if (portfolioError) {
                    console.log(`⚠️  Could not create ${currency} portfolio: ${portfolioError.message}`);
                } else {
                    console.log(`✅ Created ${currency} portfolio`);
                }
            } else {
                console.log(`✅ ${currency} portfolio already exists`);
            }
        }

        // Step 4: Verify admin access
        console.log('📝 Step 4: Verifying admin access...');
        
        const { data: adminProfile, error: verifyError } = await supabase
            .from('users')
            .select('id, username, role, status')
            .eq('id', userId)
            .single();

        if (verifyError) {
            throw new Error(`Verification failed: ${verifyError.message}`);
        }

        console.log('');
        console.log('🎉 ADMIN USER SETUP COMPLETED!');
        console.log('');
        console.log('👤 ADMIN CREDENTIALS:');
        console.log(`   📧 Email: ${adminEmail}`);
        console.log(`   🔑 Password: ${adminPassword}`);
        console.log(`   👤 Username: ${adminProfile.username}`);
        console.log(`   🛡️  Role: ${adminProfile.role}`);
        console.log(`   📊 Status: ${adminProfile.status}`);
        console.log(`   🆔 User ID: ${userId}`);
        console.log('');
        console.log('💰 INITIAL BALANCES:');
        console.log('   💵 USDT: 100,000.00 (for testing)');
        console.log('   ₿ BTC: 0.00');
        console.log('   Ξ ETH: 0.00');
        console.log('   💲 USD: 0.00');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('1. Deploy the fixed RLS schema if not already done:');
        console.log('   node deploy-fixed-schema.js');
        console.log('');
        console.log('2. Test admin login:');
        console.log('   - Go to your admin login page');
        console.log(`   - Use email: ${adminEmail}`);
        console.log(`   - Use password: ${adminPassword}`);
        console.log('');
        console.log('3. Verify admin functionality:');
        console.log('   - Access admin dashboard');
        console.log('   - Check user management');
        console.log('   - Test trading operations');
        console.log('');
        console.log('✅ Admin user is ready for production use!');
        
    } catch (error) {
        console.error('');
        console.error('💥 ADMIN USER CREATION FAILED!');
        console.error('Error:', error.message);
        console.error('');
        console.error('🔧 TROUBLESHOOTING:');
        console.error('1. Verify your Supabase credentials are correct');
        console.error('2. Ensure the database schema has been deployed');
        console.error('3. Check if the public.users table exists');
        console.error('4. Verify RLS policies allow admin operations');
        console.error('');
        console.error('📖 Manual steps if needed:');
        console.error('1. Create user in Supabase Auth UI');
        console.error('2. Run this SQL in Supabase SQL Editor:');
        console.error(`   INSERT INTO public.users (id, username, first_name, last_name, role)`);
        console.error(`   VALUES ('<auth_user_id>', 'admin', 'Ram', 'Shyam', 'super_admin');`);
        console.error('');
        process.exit(1);
    }
}

// Run admin user creation
if (require.main === module) {
    createAdminUser();
}

module.exports = { createAdminUser };