export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pair } = req.query;

  try {
    // Mock price data for different pairs
    const priceData = {
      'BTC/USDT': {
        price: 43250.25,
        change_24h: 2.45,
        volume: 28450000000,
        high_24h: 44500,
        low_24h: 42000
      },
      'ETH/USDT': {
        price: 2650.80,
        change_24h: 1.23,
        volume: 15800000000,
        high_24h: 2700,
        low_24h: 2600
      },
      'BNB/USDT': {
        price: 312.45,
        change_24h: -0.87,
        volume: 1200000000,
        high_24h: 320,
        low_24h: 310
      },
      'SOL/USDT': {
        price: 98.75,
        change_24h: 5.67,
        volume: 2800000000,
        high_24h: 100,
        low_24h: 95
      },
      'ADA/USDT': {
        price: 0.485,
        change_24h: -1.23,
        volume: 850000000,
        high_24h: 0.50,
        low_24h: 0.48
      }
    };

    const data = priceData[pair];
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Trading pair not found',
        message: `Pair ${pair} is not supported`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        pair,
        ...data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Trading price API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price data',
      message: error.message
    });
  }
} 