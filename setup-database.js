// Script to set up missing database tables
// Run this in browser console

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...');
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('❌ No session found - please login first');
      return;
    }
    
    console.log('✅ User logged in:', session.user.email);
    
    // Create configurations table
    console.log('📋 Creating configurations table...');
    const { data: configData, error: configError } = await supabase
      .from('configurations')
      .insert([{
        id: 1,
        deposit_addresses: {
          "usdt": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "btc": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          "eth": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
          "bnb": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        },
        system_settings: {
          "maintenance_mode": false,
          "trading_enabled": true,
          "deposit_enabled": true,
          "withdrawal_enabled": true
        }
      }])
      .select()
      .single();
    
    if (configError) {
      if (configError.code === '23505') { // Unique constraint violation
        console.log('✅ Configurations table already exists');
      } else {
        console.log('❌ Error creating configurations:', configError);
        console.log('💡 You need to run the complete SQL setup in Supabase');
      }
    } else {
      console.log('✅ Configurations table created:', configData);
    }
    
    // Test trading_orders table
    console.log('📊 Testing trading_orders table...');
    const { data: testOrder, error: orderError } = await supabase
      .from('trading_orders')
      .insert([{
        user_id: session.user.id,
        pair: 'BTCUSDT',
        symbol: 'BTCUSDT',
        side: 'buy',
        type: 'binary',
        amount: 1,
        leverage: 1,
        duration: 60,
        duration_percentage: 30,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (orderError) {
      console.log('❌ trading_orders table error:', orderError);
      console.log('💡 You need to run the complete SQL setup in Supabase');
    } else {
      console.log('✅ trading_orders table working - test order created');
      
      // Clean up test order
      await supabase
        .from('trading_orders')
        .delete()
        .eq('id', testOrder.id);
      console.log('🧹 Test order cleaned up');
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
}

// Run the setup
setupDatabase(); 