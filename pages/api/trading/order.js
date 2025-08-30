import { supabase } from '../../../lib/supabase';

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
        const priceResponse = await fetch(`${req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000'}/api/trading/price/${pair}`);
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

    // Check user balance (simplified - assumes USDT balance)
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'USDT')
      .single();

    if (portfolioError && portfolioError.code !== 'PGRST116') {
      console.error('Portfolio error:', portfolioError);
      return res.status(500).json({ error: 'Failed to check balance' });
    }

    const currentBalance = portfolio?.balance || 0;
    
    if (side === 'buy' && currentBalance < requiredMargin) {
      return res.status(400).json({ 
        error: 'Insufficient balance', 
        required: requiredMargin,
        available: currentBalance
      });
    }

    // Create the trade record
    const now = new Date();
    const expiry = new Date(now.getTime() + parseDurationToMs(duration));

    const tradeData = {
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      currency: 'USDT',
      pair: pair,
      leverage: orderLeverage,
      duration: duration,
      amount: requiredMargin,
      start_ts: now.toISOString(),
      expiry_ts: expiry.toISOString(),
      status: 'OPEN',
      // Additional fields for order tracking
      entry_price: executionPrice,
      order_type: type,
      order_side: side,
      original_amount: orderAmount
    };

    // Insert trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert([tradeData])
      .select()
      .single();

    if (tradeError) {
      console.error('Trade creation error:', tradeError);
      return res.status(500).json({ error: 'Failed to create trade' });
    }

    // Update user balance (deduct margin for buy orders)
    if (side === 'buy') {
      const newBalance = currentBalance - requiredMargin;
      
      const { error: balanceError } = await supabase
        .from('portfolios')
        .upsert({
          user_id: user.id,
          currency: 'USDT',
          balance: newBalance,
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id,currency'
        });

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        // Rollback trade creation
        await supabase.from('trades').delete().eq('id', trade.id);
        return res.status(500).json({ error: 'Failed to update balance' });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        trade,
        execution: {
          price: executionPrice,
          totalValue,
          requiredMargin,
          newBalance: side === 'buy' ? currentBalance - requiredMargin : currentBalance
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