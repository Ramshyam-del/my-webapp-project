import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get configuration from database
      const { data: config, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Database error:', error);
        // Return default config if database fails
        const defaultConfig = {
          deposit_addresses: {
            usdt: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            eth: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
          },
          system_settings: {
            maintenance_mode: false,
            trading_enabled: true,
            deposit_enabled: true,
            withdrawal_enabled: true
          }
        };
        return res.status(200).json({
          success: true,
          ...defaultConfig,
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        success: true,
        ...config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Config API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch configuration',
        message: error.message
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { deposit_addresses, system_settings } = req.body;
      
      // Update configuration in database
      const updateData = {};
      if (deposit_addresses) updateData.deposit_addresses = deposit_addresses;
      if (system_settings) updateData.system_settings = system_settings;
      updateData.updated_at = new Date().toISOString();

      const { data: updatedConfig, error } = await supabase
        .from('configurations')
        .update(updateData)
        .eq('id', 1)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update configuration in database',
          message: error.message
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: updatedConfig,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Config update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
        message: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}