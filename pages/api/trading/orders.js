export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock orders data
    const orders = [
      {
        id: '1',
        userId: 'user123',
        pair: 'BTC/USDT',
        type: 'buy',
        side: 'buy',
        amount: 0.5,
        price: 43250,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        userId: 'user123',
        pair: 'ETH/USDT',
        type: 'sell',
        side: 'sell',
        amount: 2.0,
        price: 2650,
        status: 'executed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    res.status(200).json({
      success: true,
      data: orders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trading orders API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
} 