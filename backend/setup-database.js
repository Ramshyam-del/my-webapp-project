const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🔧 Setting up database tables...');

  try {
    // Create users table
    console.log('📋 Creating users table...');
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError && !usersError.message.includes('already exists')) {
      console.error('❌ Error creating users table:', usersError);
    } else {
      console.log('✅ Users table ready');
    }

    // Create trading_orders table
    console.log('📋 Creating trading_orders table...');
    const { error: ordersError } = await supabase.rpc('create_trading_orders_table');
    if (ordersError && !ordersError.message.includes('already exists')) {
      console.error('❌ Error creating trading_orders table:', ordersError);
    } else {
      console.log('✅ Trading orders table ready');
    }

    // Create transactions table
    console.log('📋 Creating transactions table...');
    const { error: transactionsError } = await supabase.rpc('create_transactions_table');
    if (transactionsError && !transactionsError.message.includes('already exists')) {
      console.error('❌ Error creating transactions table:', transactionsError);
    } else {
      console.log('✅ Transactions table ready');
    }

    // Create web_config table
    console.log('📋 Creating web_config table...');
    const { error: configError } = await supabase.rpc('create_web_config_table');
    if (configError && !configError.message.includes('already exists')) {
      console.error('❌ Error creating web_config table:', configError);
    } else {
      console.log('✅ Web config table ready');
    }

    // Insert default configuration
    console.log('⚙️ Setting up default configuration...');
    const { error: insertError } = await supabase
      .from('web_config')
      .upsert({
        key: 'site_config',
        value: {
          site_name: 'Quantex',
          site_description: 'Advanced Cryptocurrency Exchange Platform',
          maintenance_mode: false,
          registration_enabled: true,
          trading_enabled: true,
          deposit_addresses: {
            btc: '',
            eth: '',
            usdt: '',
            usdc: '',
            pyusd: ''
          }
        }
      }, { onConflict: 'key' });

    if (insertError) {
      console.error('❌ Error inserting default config:', insertError);
    } else {
      console.log('✅ Default configuration set');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase(); 