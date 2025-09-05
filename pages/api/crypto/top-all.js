export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock crypto data - in production this would fetch from a real API
    const cryptoData = [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 43250.25,
        change_24h: 2.45,
        volume: 28450000000,
        market_cap: 845000000000,
        icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        price: 2650.80,
        change_24h: 1.23,
        volume: 15800000000,
        market_cap: 318000000000,
        icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
      },
      {
        id: 'binancecoin',
        symbol: 'BNB',
        name: 'BNB',
        price: 312.45,
        change_24h: -0.87,
        volume: 1200000000,
        market_cap: 48000000000,
        icon: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
      },
      {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        price: 98.75,
        change_24h: 5.67,
        volume: 2800000000,
        market_cap: 42000000000,
        icon: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
      },
      {
        id: 'cardano',
        symbol: 'ADA',
        name: 'Cardano',
        price: 0.485,
        change_24h: -1.23,
        volume: 850000000,
        market_cap: 17000000000,
        icon: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
      }
    ];

    res.status(200).json({
      success: true,
      data: cryptoData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Crypto API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crypto data',
      ...(process.env.NODE_ENV === 'development' && { message: error.message })
    });
  }
}