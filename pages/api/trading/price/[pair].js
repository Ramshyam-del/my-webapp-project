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

    // Fetch data from CoinMarketCap API
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const apiData = await response.json();
    const cryptoData = apiData.data[symbol];

    if (!cryptoData) {
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