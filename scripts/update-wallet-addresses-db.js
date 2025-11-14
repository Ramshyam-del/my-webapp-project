require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateWalletAddresses() {
  try {
    console.log('Updating wallet addresses in the database...');
    
    // New wallet addresses provided by user
    const newWalletAddresses = {
      usdt: '19RAJKBpy663RXA767p2umFRWfSPbo71B4',
      btc: 'bc1qjqm6eamdr7rdz5jj3v2wlu56akjnzc932sy35f',
      eth: '0xCB2008F629Ad57Ea770Bb1Bd3BD7c4E956e25819'
    };
    
    // First, try to get the existing configuration record
    const { data: existingConfig, error: fetchError } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('Warning: Error fetching existing config:', fetchError.message);
    }
    
    // Prepare update data
    let updateData = {
      updated_at: new Date().toISOString()
    };
    
    // If we have existing config, merge with it
    if (existingConfig) {
      updateData = {
        ...existingConfig,
        deposit_addresses: newWalletAddresses,
        updated_at: new Date().toISOString()
      };
    } else {
      // Create new config with wallet addresses
      updateData = {
        deposit_addresses: newWalletAddresses,
        system_settings: {
          maintenance_mode: false,
          trading_enabled: true,
          deposit_enabled: true,
          withdrawal_enabled: true
        },
        updated_at: new Date().toISOString()
      };
    }
    
    // Update or insert the configuration record
    const { data: updatedConfig, error: updateError } = await supabase
      .from('configurations')
      .upsert({
        id: 1,
        ...updateData
      }, {
        onConflict: 'id'
      })
      .select()
      .single();
    
    if (updateError) {
      console.warn('Warning: Could not update configuration:', updateError.message);
    } else {
      console.log('✅ Configuration updated successfully!');
    }
    
    console.log('\nNew wallet addresses have been set:');
    console.log('USDT (TRC-20):', newWalletAddresses.usdt);
    console.log('BTC:', newWalletAddresses.btc);
    console.log('ETH:', newWalletAddresses.eth);
    
    console.log('\n✅ All wallet addresses updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating wallet addresses:', error.message);
    process.exit(1);
  }
}

// Run the update
updateWalletAddresses();