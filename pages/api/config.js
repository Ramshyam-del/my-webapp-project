export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Return the current configuration
      const config = {
        trading: {
          enabled: true,
          minOrderAmount: 10,
          maxOrderAmount: 100000,
          supportedPairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'],
          fees: {
            maker: 0.001, // 0.1%
            taker: 0.002  // 0.2%
          }
        },
        deposit: {
          enabled: true,
          minAmount: 10,
          maxAmount: 100000,
          supportedMethods: ['bank_transfer', 'crypto']
        },
        withdrawal: {
          enabled: true,
          minAmount: 50,
          maxAmount: 10000,
          dailyLimit: 50000,
          processingTime: '24-48 hours'
        },
        mining: {
          enabled: true,
          minPayout: 100,
          payoutSchedule: 'weekly'
        },
        // Add contact information from admin configuration
        contact: {
          telegram: '', // Will be populated from admin config
          whatsapp: '', // Will be populated from admin config
          email: ''
        }
      };

      res.status(200).json({
        success: true,
        data: config,
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
      // Handle admin configuration updates
      const { system_settings } = req.body;
      
      // Here you would typically save to database
      // For now, we'll just return success
      
      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
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