require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateWalletAddresses() {
  try {
    console.log('Updating wallet addresses in the database...');
    
    // New wallet addresses (these are the default production addresses)
    const newWalletAddresses = {
      usdt: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
      btc: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
      eth: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
    };
    
    // Update the configurations table
    const { data, error } = await supabase
      .from('configurations')
      .upsert({
        config_key: 'deposit_addresses',
        config_value: newWalletAddresses,
        config_type: 'blockchain',
        description: 'Cryptocurrency deposit addresses',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'config_key'
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Wallet addresses updated successfully!');
    console.log('Updated addresses:', data[0]);
    
    // Also update system settings with individual address fields
    const systemSettingsUpdate = {
      usdt_address: newWalletAddresses.usdt,
      btc_address: newWalletAddresses.btc,
      eth_address: newWalletAddresses.eth
    };
    
    const { data: systemData, error: systemError } = await supabase
      .from('configurations')
      .upsert({
        config_key: 'system_settings',
        config_value: systemSettingsUpdate,
        config_type: 'system',
        description: 'System configuration settings',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'config_key'
      })
      .select();
    
    if (systemError) {
      console.warn('Warning: Could not update system settings:', systemError.message);
    } else {
      console.log('✅ System settings updated successfully!');
    }
    
    console.log('\nNew wallet addresses:');
    console.log('USDT (TRC-20):', newWalletAddresses.usdt);
    console.log('BTC:', newWalletAddresses.btc);
    console.log('ETH:', newWalletAddresses.eth);
    
  } catch (error) {
    console.error('❌ Error updating wallet addresses:', error.message);
    process.exit(1);
  }
}

// Run the update
updateWalletAddresses();