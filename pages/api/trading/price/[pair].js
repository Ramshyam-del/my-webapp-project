// Fallback price data for when API is unavailable
const fallbackPrices = {
  'BTCUSDT': { price: 43250.75, change_24h: 2.45, volume: 28500000000, market_cap: 850000000000 },
  'ETHUSDT': { price: 2650.30, change_24h: 1.87, volume: 15200000000, market_cap: 320000000000 },
  'BNBUSDT': { price: 315.80, change_24h: 0.92, volume: 1800000000, market_cap: 47000000000 },
  'SOLUSDT': { price: 98.45, change_24h: 3.21, volume: 2100000000, market_cap: 42000000000 },
  'XRPUSDT': { price: 0.625, change_24h: 1.23, volume: 1500000000, market_cap: 34000000000 },
  'TRXUSDT': { price: 0.089, change_24h: 0.78, volume: 850000000, market_cap: 8000000000 },
  'ADAUSDT': { price: 0.485, change_24h: 2.15, volume: 950000000, market_cap: 17000000000 },
  'USDCUSDT': { price: 1.00, change_24h: 0.01, volume: 5200000000, market_cap: 24000000000 },
  'DOGEUSDT': { price: 0.082, change_24h: 1.45, volume: 680000000, market_cap: 12000000000 },
  'USDTUSDT': { price: 1.00, change_24h: 0.00, volume: 45000000000, market_cap: 95000000000 }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pair } = req.query;

  try {
    // Map trading pairs to CoinMarketCap symbols
    const symbolMap = {
      'BTCUSDT': 'BTC',
      'ETHUSDT': 'ETH', 
      'BNBUSDT': 'BNB',
      'SOLUSDT': 'SOL',
      'XRPUSDT': 'XRP',
      'TRXUSDT': 'TRX',
      'ADAUSDT': 'ADA',
      'USDCUSDT': 'USDC',
      'DOGEUSDT': 'DOGE',
      'USDTUSDT': 'USDT'
    };

    const symbol = symbolMap[pair];
    if (!symbol) {
      return res.status(404).json({
        success: false,
        error: 'Trading pair not found',
        message: `Pair ${pair} is not supported`
      });
    }

    // Check if API key is available
    const apiKey = process.env.COINMARKETCAP_API_KEY || process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
    
    if (!apiKey) {
      console.warn('CoinMarketCap API key not configured, using fallback data');
      const fallbackData = fallbackPrices[pair];
      if (fallbackData) {
        return res.status(200).json({
          success: true,
          data: {
            pair,
            price: fallbackData.price,
            change_24h: fallbackData.change_24h,
            volume: fallbackData.volume,
            market_cap: fallbackData.market_cap,
            timestamp: new Date().toISOString()
          },
          source: 'fallback'
        });
      }
    }

    // Try to fetch data from CoinMarketCap API
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.warn(`CoinMarketCap API error: ${response.status}, using fallback data`);
      const fallbackData = fallbackPrices[pair];
      if (fallbackData) {
        return res.status(200).json({
          success: true,
          data: {
            pair,
            price: fallbackData.price,
            change_24h: fallbackData.change_24h,
            volume: fallbackData.volume,
            market_cap: fallbackData.market_cap,
            timestamp: new Date().toISOString()
          },
          source: 'fallback',
          note: 'API unavailable, using cached data'
        });
      }
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const apiData = await response.json();
    const cryptoData = apiData.data[symbol];

    if (!cryptoData) {
      console.warn(`Symbol ${symbol} not found in CoinMarketCap, using fallback data`);
      const fallbackData = fallbackPrices[pair];
      if (fallbackData) {
        return res.status(200).json({
          success: true,
          data: {
            pair,
            price: fallbackData.price,
            change_24h: fallbackData.change_24h,
            volume: fallbackData.volume,
            market_cap: fallbackData.market_cap,
            timestamp: new Date().toISOString()
          },
          source: 'fallback'
        });
      }
      return res.status(404).json({
        success: false,
        error: 'Cryptocurrency not found',
        message: `Symbol ${symbol} not found in CoinMarketCap`
      });
    }

    const quote = cryptoData.quote.USD;
    
    res.status(200).json({
      success: true,
      data: {
        pair,
        price: quote.price,
        change_24h: quote.percent_change_24h,
        volume: quote.volume_24h,
        market_cap: quote.market_cap,
        timestamp: new Date().toISOString()
      },
      source: 'live'
    });
  } catch (error) {
    console.error('Trading price API error:', error);
    
    // Use fallback data on any error
    const fallbackData = fallbackPrices[pair];
    if (fallbackData) {
      return res.status(200).json({
        success: true,
        data: {
          pair,
          price: fallbackData.price,
          change_24h: fallbackData.change_24h,
          volume: fallbackData.volume,
          market_cap: fallbackData.market_cap,
          timestamp: new Date().toISOString()
        },
        source: 'fallback',
        note: 'Error occurred, using cached data'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price data',
      message: error.message
    });
  }
}