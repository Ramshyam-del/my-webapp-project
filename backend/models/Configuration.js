"use strict";

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration management using database configurations table
module.exports = {
  async getConfig() {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('config_key, config_value, is_public')
        .or('is_public.eq.true,is_public.eq.false'); // Get all configs for admin
      
      if (error) throw error;
      
      // Transform to key-value object
      const config = {};
      data.forEach(item => {
        config[item.config_key] = item.config_value;
      });
      
      return config;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      // Return safe defaults
      return {
        platform_maintenance: { enabled: false, message: "" },
        trading_enabled: { enabled: true },
        deposit_minimums: { BTC: 0.0001, ETH: 0.001, USDT: 1.0 }
      };
    }
  },

  async updateConfig(configKey, configValue, configType = 'system', description = '') {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .upsert({
          config_key: configKey,
          config_value: configValue,
          config_type: configType,
          description: description,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'config_key'
        })
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  },

  async updateDepositAddresses(addresses) {
    try {
      return await this.updateConfig(
        'deposit_addresses',
        addresses || {},
        'blockchain',
        'Cryptocurrency deposit addresses'
      );
    } catch (error) {
      console.error('Error updating deposit addresses:', error);
      throw error;
    }
  },

  async getPublicConfig() {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('config_key, config_value')
        .eq('is_public', true);
      
      if (error) throw error;
      
      const config = {};
      data.forEach(item => {
        config[item.config_key] = item.config_value;
      });
      
      return config;
    } catch (error) {
      console.error('Error fetching public configuration:', error);
      return {};
    }
  },

  async initializeDatabase() {
    // Database is already initialized by schema
    // Verify connection
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('count', { count: 'exact' })
        .limit(1);
      
      if (error) throw error;
      console.log('✅ Configuration database connection verified');
      return true;
    } catch (error) {
      console.error('❌ Configuration database connection failed:', error);
      return false;
    }
  },
}; 