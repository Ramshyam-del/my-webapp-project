import { supabase } from '../../../lib/supabase';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid user ID in token' });
    }

    const { action, tradeId, stopLoss, takeProfit, trailingStop } = req.body;

    // Validate input
    if (!action || !tradeId) {
      return res.status(400).json({ error: 'Action and trade ID are required' });
    }

    switch (action) {
      case 'set_stop_loss':
        return await setStopLoss(userId, tradeId, stopLoss, res);
      case 'set_take_profit':
        return await setTakeProfit(userId, tradeId, takeProfit, res);
      case 'set_trailing_stop':
        return await setTrailingStop(userId, tradeId, trailingStop, res);
      case 'remove_risk_management':
        return await removeRiskManagement(userId, tradeId, res);
      case 'check_triggers':
        return await checkTriggers(userId, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Risk management API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Set stop loss for a trade
async function setStopLoss(userId, tradeId, stopLossPrice, res) {
  try {
    if (!stopLossPrice || stopLossPrice <= 0) {
      return res.status(400).json({ error: 'Valid stop loss price is required' });
    }

    // Verify trade exists and belongs to user
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', userId)
      .eq('status', 'OPEN')
      .single();

    if (tradeError || !trade) {
      return res.status(404).json({ error: 'Trade not found or already closed' });
    }

    // Validate stop loss price
    const entryPrice = parseFloat(trade.entry_price);
    const isValidStopLoss = trade.side === 'buy' 
      ? stopLossPrice < entryPrice 
      : stopLossPrice > entryPrice;

    if (!isValidStopLoss) {
      return res.status(400).json({ 
        error: `Stop loss must be ${trade.side === 'buy' ? 'below' : 'above'} entry price` 
      });
    }

    // Update trade with stop loss
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({ 
        stop_loss: stopLossPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to set stop loss' });
    }

    return res.status(200).json({
      success: true,
      message: 'Stop loss set successfully',
      data: { trade: updatedTrade }
    });

  } catch (error) {
    console.error('Set stop loss error:', error);
    return res.status(500).json({ error: 'Failed to set stop loss' });
  }
}

// Set take profit for a trade
async function setTakeProfit(userId, tradeId, takeProfitPrice, res) {
  try {
    if (!takeProfitPrice || takeProfitPrice <= 0) {
      return res.status(400).json({ error: 'Valid take profit price is required' });
    }

    // Verify trade exists and belongs to user
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', userId)
      .eq('status', 'OPEN')
      .single();

    if (tradeError || !trade) {
      return res.status(404).json({ error: 'Trade not found or already closed' });
    }

    // Validate take profit price
    const entryPrice = parseFloat(trade.entry_price);
    const isValidTakeProfit = trade.side === 'buy' 
      ? takeProfitPrice > entryPrice 
      : takeProfitPrice < entryPrice;

    if (!isValidTakeProfit) {
      return res.status(400).json({ 
        error: `Take profit must be ${trade.side === 'buy' ? 'above' : 'below'} entry price` 
      });
    }

    // Update trade with take profit
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({ 
        take_profit: takeProfitPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to set take profit' });
    }

    return res.status(200).json({
      success: true,
      message: 'Take profit set successfully',
      data: { trade: updatedTrade }
    });

  } catch (error) {
    console.error('Set take profit error:', error);
    return res.status(500).json({ error: 'Failed to set take profit' });
  }
}

// Set trailing stop for a trade
async function setTrailingStop(userId, tradeId, trailingStopDistance, res) {
  try {
    if (!trailingStopDistance || trailingStopDistance <= 0) {
      return res.status(400).json({ error: 'Valid trailing stop distance is required' });
    }

    // Verify trade exists and belongs to user
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', userId)
      .eq('status', 'OPEN')
      .single();

    if (tradeError || !trade) {
      return res.status(404).json({ error: 'Trade not found or already closed' });
    }

    // Update trade with trailing stop
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({ 
        trailing_stop: trailingStopDistance,
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to set trailing stop' });
    }

    return res.status(200).json({
      success: true,
      message: 'Trailing stop set successfully',
      data: { trade: updatedTrade }
    });

  } catch (error) {
    console.error('Set trailing stop error:', error);
    return res.status(500).json({ error: 'Failed to set trailing stop' });
  }
}

// Remove all risk management settings
async function removeRiskManagement(userId, tradeId, res) {
  try {
    // Update trade to remove risk management settings
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({ 
        stop_loss: null,
        take_profit: null,
        trailing_stop: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .eq('user_id', userId)
      .eq('status', 'OPEN')
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to remove risk management' });
    }

    if (!updatedTrade) {
      return res.status(404).json({ error: 'Trade not found or already closed' });
    }

    return res.status(200).json({
      success: true,
      message: 'Risk management settings removed successfully',
      data: { trade: updatedTrade }
    });

  } catch (error) {
    console.error('Remove risk management error:', error);
    return res.status(500).json({ error: 'Failed to remove risk management' });
  }
}

// Check and trigger stop loss/take profit orders
async function checkTriggers(userId, res) {
  try {
    // Get all open trades with risk management settings
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'OPEN')
      .or('stop_loss.not.is.null,take_profit.not.is.null,trailing_stop.not.is.null');

    if (tradesError) {
      return res.status(500).json({ error: 'Failed to fetch trades' });
    }

    const triggeredTrades = [];

    for (const trade of trades) {
      try {
        // Get current market price
        const priceResponse = await fetch(`${req.headers.origin}/api/trading/price/${trade.pair}`);
        if (!priceResponse.ok) continue;
        
        const priceData = await priceResponse.json();
        const currentPrice = priceData.data.price;

        let shouldClose = false;
        let closeReason = '';

        // Check stop loss
        if (trade.stop_loss) {
          const stopLossTriggered = trade.side === 'buy' 
            ? currentPrice <= trade.stop_loss
            : currentPrice >= trade.stop_loss;
          
          if (stopLossTriggered) {
            shouldClose = true;
            closeReason = 'Stop Loss';
          }
        }

        // Check take profit
        if (trade.take_profit && !shouldClose) {
          const takeProfitTriggered = trade.side === 'buy' 
            ? currentPrice >= trade.take_profit
            : currentPrice <= trade.take_profit;
          
          if (takeProfitTriggered) {
            shouldClose = true;
            closeReason = 'Take Profit';
          }
        }

        // Check trailing stop (simplified implementation)
        if (trade.trailing_stop && !shouldClose) {
          const trailingStopPrice = trade.side === 'buy'
            ? currentPrice - trade.trailing_stop
            : currentPrice + trade.trailing_stop;
          
          // Update trailing stop if price moved favorably
          if (trade.side === 'buy' && currentPrice > trade.entry_price) {
            const newStopLoss = Math.max(trade.stop_loss || 0, trailingStopPrice);
            if (newStopLoss > (trade.stop_loss || 0)) {
              await supabase
                .from('trades')
                .update({ stop_loss: newStopLoss })
                .eq('id', trade.id);
            }
          } else if (trade.side === 'sell' && currentPrice < trade.entry_price) {
            const newStopLoss = trade.stop_loss 
              ? Math.min(trade.stop_loss, trailingStopPrice)
              : trailingStopPrice;
            if (newStopLoss < (trade.stop_loss || Infinity)) {
              await supabase
                .from('trades')
                .update({ stop_loss: newStopLoss })
                .eq('id', trade.id);
            }
          }
        }

        // Close trade if triggered
        if (shouldClose) {
          // Calculate P&L
          const entryPrice = parseFloat(trade.entry_price);
          const amount = parseFloat(trade.amount);
          const leverage = parseFloat(trade.leverage);
          
          let pnl = 0;
          if (trade.side === 'buy') {
            pnl = (currentPrice - entryPrice) * amount * leverage;
          } else {
            pnl = (entryPrice - currentPrice) * amount * leverage;
          }

          const investedAmount = (entryPrice * amount) / leverage;
          const pnlPercentage = (pnl / investedAmount) * 100;

          // Update trade
          const { data: closedTrade, error: closeError } = await supabase
            .from('trades')
            .update({
              status: 'CLOSED',
              pnl: pnl,
              pnl_percentage: pnlPercentage,
              exit_price: currentPrice,
              close_reason: closeReason,
              closed_at: new Date().toISOString()
            })
            .eq('id', trade.id)
            .select()
            .single();

          if (!closeError) {
            triggeredTrades.push({
              trade: closedTrade,
              reason: closeReason,
              pnl: pnl
            });

            // Update user balance
            const { data: portfolio } = await supabase
              .from('portfolios')
              .select('balance')
              .eq('user_id', userId)
              .single();

            if (portfolio) {
              const newBalance = parseFloat(portfolio.balance) + pnl;
              await supabase
                .from('portfolios')
                .update({ balance: newBalance })
                .eq('user_id', userId);

              // Record transaction
              await supabase
                .from('fund_transactions')
                .insert({
                  user_id: userId,
                  type: pnl >= 0 ? 'profit' : 'loss',
                  amount: Math.abs(pnl),
                  description: `${closeReason} - Trade #${trade.id}`,
                  status: 'completed',
                  trade_id: trade.id
                });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing trade ${trade.id}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${trades.length} trades, triggered ${triggeredTrades.length} closures`,
      data: { triggeredTrades }
    });

  } catch (error) {
    console.error('Check triggers error:', error);
    return res.status(500).json({ error: 'Failed to check triggers' });
  }
}