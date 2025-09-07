const router = require('express').Router();
const axios = require('axios');

// Mapping of trading pairs to CoinMarketCap symbols
const PAIR_TO_SYMBOL = {
  'BTCUSDT': 'BTC',
  'ETHUSDT': 'ETH',
  'BNBUSDT': 'BNB',
  'SOLUSDT': 'SOL',
  'ADAUSDT': 'ADA'
};

// GET /api/trading/price/:pair - Get real-time price data for trading pairs
router.get('/price/:pair', async (req, res) => {
  try {
    const { pair } = req.params;
    const symbol = PAIR_TO_SYMBOL[pair.toUpperCase()];
    
    if (!symbol) {
      return res.status(404).json({
        success: false,
        error: 'Trading pair not found',
        message: `Pair ${pair} is not supported`
      });
    }

    // Fetch live data from CoinMarketCap API
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    
    if (!apiKey) {
      throw new Error('CoinMarketCap API key not configured');
    }

    const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });

    const cmcData = response.data;
    
    if (!cmcData.data || !cmcData.data[symbol]) {
      throw new Error('Invalid response format from CoinMarketCap API');
    }

    const coinData = cmcData.data[symbol];
    const quote = coinData.quote.USD;

    const data = {
      price: quote.price,
      change_24h: quote.percent_change_24h,
      volume: quote.volume_24h,
      high_24h: quote.price * (1 + Math.abs(quote.percent_change_24h) / 100), // Approximate high
      low_24h: quote.price * (1 - Math.abs(quote.percent_change_24h) / 100)   // Approximate low
    };

    res.status(200).json({
      success: true,
      data: {
        pair: pair.toUpperCase(),
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
});

module.exports = router;