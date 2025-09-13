import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug supabaseAdmin initialization
    console.log('🔍 [API] supabaseAdmin status:', supabaseAdmin ? 'initialized' : 'null');
    console.log('🔍 [API] Environment check:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing'
    });
    
    if (!supabaseAdmin) {
      console.error('❌ [API] supabaseAdmin is null - missing environment variables');
      return res.status(500).json({ error: 'Database configuration error' });
    }
    
    // Get user ID from query params or headers (you may need to adjust this based on your auth setup)
    const userId = req.query.userId || req.headers['x-user-id'];
    
    console.log('🔍 [API] Balance API called with userId:', userId);
    console.log('🔍 [API] Query params:', req.query);
    console.log('🔍 [API] Headers x-user-id:', req.headers['x-user-id']);
    
    if (!userId) {
      console.log('❌ [API] No user ID provided');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch user's portfolio balances
    console.log('🔍 [API] Querying portfolios table for user_id:', userId);
    const { data: portfolios, error } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔍 [API] Supabase query result:', { portfolios, error });

    if (error) {
      console.error('Error fetching portfolio balances:', error);
      return res.status(500).json({ error: 'Failed to fetch portfolio balances' });
    }

    // Calculate totalBalance using current crypto prices
    console.log('🔍 [API] Raw portfolio data:', portfolios);
    
    let totalBalance = 0;
    const currenciesWithValues = [];
    
    // Fetch real-time prices from CoinMarketCap API
    let cryptoPrices = {};
    try {
      const cryptoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/crypto/top-all`);
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json();
        if (cryptoData.success && cryptoData.data) {
          // Create a price mapping from symbol to price
          cryptoData.data.forEach(coin => {
            cryptoPrices[coin.symbol] = coin.price;
          });
          console.log('🔍 [API] Fetched live crypto prices:', cryptoPrices);
        }
      }
    } catch (error) {
      console.error('🔍 [API] Error fetching crypto prices:', error);
    }
    
    // Fallback to hardcoded prices if API fails
    if (Object.keys(cryptoPrices).length === 0) {
      cryptoPrices = {
        'BTC': 43250.75,
        'ETH': 2650.30,
        'USDT': 1.00,
        'BNB': 315.80,
        'SOL': 98.45,
        'USDC': 1.00,
        'XRP': 0.625,
        'ADA': 0.485,
        'DOGE': 0.085,
        'AVAX': 28.75
      };
      console.log('🔍 [API] Using fallback prices:', cryptoPrices);
    }
    
    for (const portfolio of portfolios) {
      const currency = portfolio.currency;
      const balance = Number(portfolio.balance);
      const price = cryptoPrices[currency] || 0;
      const value = balance * price;
      
      totalBalance += value;
      
      currenciesWithValues.push({
        currency,
        balance,
        price,
        value,
        updatedAt: portfolio.updated_at
      });
      
      console.log(`🔍 [API] ${currency}: ${balance} × $${price} = $${value}`);
    }

    // Format the response with totalBalance
    const response = {
      totalBalance,
      currencies: currenciesWithValues,
      summary: {
        totalCurrencies: portfolios.length,
        totalBalance,
        lastUpdated: portfolios.length > 0 ? Math.max(...portfolios.map(p => new Date(p.updated_at).getTime())) : null
      }
    };
    
    console.log('🔍 [API] Final response:', JSON.stringify(response, null, 2));
    res.status(200).json(response);

  } catch (error) {
    console.error('Portfolio balance API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
