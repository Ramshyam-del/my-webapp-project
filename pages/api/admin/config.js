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
        .select('system_settings')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Database error:', error);
        // Return default config if database fails
        const defaultAdminConfig = {
          telegram: '',
          whatsapp: '',
          email: '',
          address: '',
          mobile: '',
          title: 'Quantex',
          logo: '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg',
          favicon: '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg',
          walletAddresses: {
            usdtAddress: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
            btcAddress: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
            ethAddress: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
          }
        };
        return res.status(200).json({
          success: true,
          data: defaultAdminConfig,
          timestamp: new Date().toISOString()
        });
      }

      // Include wallet addresses in response
      const responseData = {
        ...(config?.system_settings || {}),
        // Ensure walletAddresses are included
        walletAddresses: config?.system_settings?.walletAddresses || {
          usdtAddress: 'TURT2sJxx4XzGZnaeVEnkcTPfnazkjJ88W',
          btcAddress: '19yUq4CmyDiTRkFDxQdnqGS1dkD6dZEuN4',
          ethAddress: '0x251a6e4cd2b552b99bcbc6b96fc92fc6bd2b5975'
        }
      };

      res.status(200).json({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Admin config API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin configuration',
        message: error.message
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { system_settings, walletAddresses } = req.body || {};

      if (system_settings && typeof system_settings === 'object') {
        // Get current configuration
        const { data: currentConfig, error: fetchError } = await supabase
          .from('configurations')
          .select('system_settings')
          .eq('id', 1)
          .single();

        if (fetchError) {
          console.error('Database fetch error:', fetchError);
        }

        // Merge with existing system_settings
        const updatedSystemSettings = {
          ...(currentConfig?.system_settings || {}),
          ...system_settings
        };

        // Merge wallet addresses if provided
        if (walletAddresses && typeof walletAddresses === 'object') {
          updatedSystemSettings.walletAddresses = {
            ...(updatedSystemSettings.walletAddresses || {}),
            ...walletAddresses
          };
        }

        // Update configuration in database
        const { data: updatedConfig, error: updateError } = await supabase
          .from('configurations')
          .update({
            system_settings: updatedSystemSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1)
          .select()
          .single();

        if (updateError) {
          console.error('Database update error:', updateError);
          return res.status(500).json({
            success: false,
            error: 'Failed to update admin configuration in database',
            message: updateError.message
          });
        }

        console.log('Admin config updated:', updatedSystemSettings);

        res.status(200).json({
          success: true,
          data: updatedConfig?.system_settings || updatedSystemSettings,
          message: 'Admin configuration updated successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid system_settings provided'
        });
      }
    } catch (error) {
      console.error('Admin config update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update admin configuration',
        ...(process.env.NODE_ENV === 'development' && { message: error.message })
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
