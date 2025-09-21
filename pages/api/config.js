import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('ETag', `"${Date.now()}"`);

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
            usdt: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
            btc: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
            eth: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
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