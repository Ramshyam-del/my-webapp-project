const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class Configuration {
  static async getConfig() {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching configuration:', error);
        return null;
      }
      
      return data || this.getDefaultConfig();
    } catch (error) {
      console.error('Error in getConfig:', error);
      return this.getDefaultConfig();
    }
  }

  static async updateConfig(updates) {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .upsert({
          id: 1,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error updating configuration:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateConfig:', error);
      return null;
    }
  }

  static async updateDepositAddresses(addresses) {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .upsert({
          id: 1,
          deposit_addresses: addresses,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error updating deposit addresses:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateDepositAddresses:', error);
      return null;
    }
  }

  static getDefaultConfig() {
    return {
      id: 1,
      deposit_addresses: {
        usdt: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        eth: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        bnb: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      },
      system_settings: {
        maintenance_mode: false,
        trading_enabled: true,
        deposit_enabled: true,
        withdrawal_enabled: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async initializeDatabase() {
    try {
      // Check if configurations table exists, if not create it
      const { error } = await supabase
        .from('configurations')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, create it via SQL
        console.log('Creating configurations table...');
        // Note: In production, you'd want to use proper migrations
        // This is a simplified approach for development
      }
      
      // Insert default configuration if none exists
      const existing = await this.getConfig();
      if (!existing) {
        const defaultConfig = this.getDefaultConfig();
        await this.updateConfig(defaultConfig);
        console.log('Default configuration created');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      return false;
    }
  }
}

module.exports = Configuration; 