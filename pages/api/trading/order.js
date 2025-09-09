import { supabase } from '../../../lib/supabase';
const { supabaseAdmin } = require('../../../backend/lib/supabaseAdmin');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { 
      pair, 
      side, // 'buy' or 'sell'
      type, // 'market' or 'limit'
      amount, 
      price, // required for limit orders
      leverage = 1,
      duration = '1h' // for futures/options trading
    } = req.body;

    // Validation
    if (!pair || !side || !type || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: pair, side, type, amount' 
      });
    }

    if (!['buy', 'sell'].includes(side)) {
      return res.status(400).json({ error: 'Side must be "buy" or "sell"' });
    }

    if (!['market', 'limit'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "market" or "limit"' });
    }

    if (type === 'limit' && !price) {
      return res.status(400).json({ error: 'Price is required for limit orders' });
    }

    const orderAmount = parseFloat(amount);
    const orderPrice = price ? parseFloat(price) : null;
    const orderLeverage = parseFloat(leverage);

    if (isNaN(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (orderPrice && (isNaN(orderPrice) || orderPrice <= 0)) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    if (isNaN(orderLeverage) || orderLeverage < 1 || orderLeverage > 100) {
      return res.status(400).json({ error: 'Leverage must be between 1 and 100' });
    }

    // Get current market price for market orders
    let executionPrice = orderPrice;
    if (type === 'market') {
      try {
        const baseUrl = req.headers.host ? 
        `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}` : 
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const priceResponse = await fetch(`${baseUrl}/api/trading/price/${pair}`);
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          executionPrice = priceData.data.price;
        } else {
          // Fallback prices
          const fallbackPrices = {
            'BTC/USDT': 43250,
            'ETH/USDT': 2650,
            'BNB/USDT': 312,
            'SOL/USDT': 98,
            'ADA/USDT': 0.485
          };
          executionPrice = fallbackPrices[pair] || 1000;
        }
      } catch (error) {
        console.error('Error fetching market price:', error);
        return res.status(500).json({ error: 'Failed to get market price' });
      }
    }

    // Calculate total cost/value
    const totalValue = orderAmount * executionPrice;
    const requiredMargin = totalValue / orderLeverage;

    // Parse the trading pair to get base and quote currencies
    const pairParts = pair.replace('/', '').match(/^([A-Z]+)(USDT|BTC|ETH|BNB)$/);
    if (!pairParts) {
      return res.status(400).json({ error: 'Invalid trading pair format' });
    }
    
    const baseCurrency = pairParts[1];
    const quoteCurrency = pairParts[2];
    
    // For trading, users need the quote currency (e.g., USDT) to place orders
    // This represents the currency they're spending to buy/sell
    const requiredCurrency = quoteCurrency;
    
    // Check user balance for the required currency
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', requiredCurrency)
      .single();

    if (portfolioError && portfolioError.code !== 'PGRST116') {
      console.error('Portfolio error:', portfolioError);
      return res.status(500).json({ error: 'Failed to check balance' });
    }

    const currentBalance = portfolio?.balance || 0;
    
    // For both buy and sell orders, user needs sufficient balance to cover the trade amount
    // This represents the amount at risk in the trade
    const tradeAmount = orderAmount; // The actual amount the user is trading with
    
    if (currentBalance < tradeAmount) {
      return res.status(400).json({ 
        error: `Insufficient ${requiredCurrency} balance`, 
        required: tradeAmount,
        available: currentBalance,
        currency: requiredCurrency
      });
    }

    // Create the trade record
    const now = new Date();
    const durationMs = parseDurationToMs(duration);
    const expiry = new Date(now.getTime() + durationMs);
    const durationSeconds = Math.floor(durationMs / 1000);

    const tradeData = {
      user_id: user.id,
      user_name: user.email,
      currency: 'USDT',
      pair: pair, // Required by database schema
      currency_pair: pair,
      leverage: orderLeverage,
      duration: duration,
      duration_seconds: durationSeconds,
      amount: tradeAmount,
      start_ts: now.toISOString(),
      expiry_ts: expiry.toISOString(),
      status: 'OPEN', // Use 'OPEN' as valid status for new trades
      entry_price: executionPrice,
      side: side,
      trade_type: side === 'buy' ? 'BUY UP' : 'BUY FALL', // Map side to trade_type
      // New fields for admin trade management
      admin_action: 'pending',
      trade_result: 'pending',
      auto_expired: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    // Insert trade
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .insert([tradeData])
      .select()
      .single();

    if (tradeError) {
      console.error('Trade creation error:', tradeError);
      return res.status(500).json({ error: 'Failed to create trade' });
    }

    // Update user balance (deduct trade amount for all orders)
    // The trade amount is deducted immediately when the trade is created
    // This amount will be returned with profit/loss when the trade is settled
    const newBalance = currentBalance - tradeAmount;
    
    const { error: balanceError } = await supabaseAdmin
      .from('portfolios')
      .upsert({
        user_id: user.id,
        currency: requiredCurrency, // Use the required currency instead of hardcoded USDT
        balance: newBalance,
        updated_at: now.toISOString()
      }, {
        onConflict: 'user_id,currency'
      });

    if (balanceError) {
      console.error('Balance update error:', balanceError);
      // Rollback trade creation
      await supabaseAdmin.from('trades').delete().eq('id', trade.id);
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    res.status(200).json({
      success: true,
      data: {
        trade,
        execution: {
          price: executionPrice,
          totalValue,
          requiredMargin,
          newBalance: currentBalance - tradeAmount
        }
      },
      message: `${side.toUpperCase()} order executed successfully`
    });

  } catch (error) {
    console.error('Trading order API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Helper function to parse duration
function parseDurationToMs(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 60 * 1000; // default 1 hour
  
  const [, num, unit] = match;
  const value = parseInt(num);
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}