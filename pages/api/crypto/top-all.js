// Mock data for fallback when API limits are exceeded
const mockCryptoData = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.75,
    change_24h: 2.45,
    volume: 28500000000,
    market_cap: 847000000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2650.30,
    change_24h: -1.25,
    volume: 15200000000,
    market_cap: 318000000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether',
    price: 1.00,
    change_24h: 0.01,
    volume: 45000000000,
    market_cap: 95000000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png'
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    price: 315.80,
    change_24h: 0.85,
    volume: 1800000000,
    market_cap: 47200000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png'
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 98.45,
    change_24h: 3.20,
    volume: 2100000000,
    market_cap: 43800000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png'
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.00,
    change_24h: -0.01,
    volume: 8500000000,
    market_cap: 34000000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png'
  },
  {
    id: 'xrp',
    symbol: 'XRP',
    name: 'XRP',
    price: 0.625,
    change_24h: 1.85,
    volume: 1200000000,
    market_cap: 33500000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png'
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.485,
    change_24h: -0.75,
    volume: 580000000,
    market_cap: 17200000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png'
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.085,
    change_24h: 4.25,
    volume: 950000000,
    market_cap: 12200000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png'
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 28.75,
    change_24h: -2.15,
    volume: 420000000,
    market_cap: 11800000000,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png'
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to fetch live data from CoinMarketCap API
    const apiKey = process.env.COINMARKETCAP_API_KEY || process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
    
    if (!apiKey) {
      console.warn('CoinMarketCap API key not configured, using mock data');
      return res.status(200).json({
        success: true,
        data: mockCryptoData,
        timestamp: new Date().toISOString(),
        source: 'mock'
      });
    }

    const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD', {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`CoinMarketCap API error: ${response.status} ${response.statusText}, falling back to mock data`);
      return res.status(200).json({
        success: true,
        data: mockCryptoData,
        timestamp: new Date().toISOString(),
        source: 'mock',
        note: 'API limit exceeded, using mock data'
      });
    }

    const cmcData = await response.json();
    
    if (!cmcData.data || !Array.isArray(cmcData.data)) {
      console.warn('Invalid response format from CoinMarketCap API, using mock data');
      return res.status(200).json({
        success: true,
        data: mockCryptoData,
        timestamp: new Date().toISOString(),
        source: 'mock'
      });
    }

    // Transform CoinMarketCap data to our format
    const cryptoData = cmcData.data.map(coin => ({
      id: coin.slug,
      symbol: coin.symbol,
      name: coin.name,
      price: coin.quote.USD.price,
      change_24h: coin.quote.USD.percent_change_24h,
      volume: coin.quote.USD.volume_24h,
      market_cap: coin.quote.USD.market_cap,
      icon: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`
    }));

    res.status(200).json({
      success: true,
      data: cryptoData,
      timestamp: new Date().toISOString(),
      source: 'coinmarketcap'
    });
  } catch (error) {
    console.error('Crypto API error:', error);
    console.warn('Falling back to mock data due to API error');
    res.status(200).json({
      success: true,
      data: mockCryptoData,
      timestamp: new Date().toISOString(),
      source: 'mock',
      note: 'API error, using mock data'
    });
  }
}