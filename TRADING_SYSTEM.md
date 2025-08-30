# Trading System Documentation

## Overview

This document describes the comprehensive trading system implementation that includes order placement, portfolio management, trade history, risk management, and testing capabilities.

## Architecture

### Backend API Endpoints

#### Trading Operations
- `POST /api/trading/order` - Place buy/sell orders
- `GET /api/trading/price/[pair]` - Get current market prices
- `POST /api/trading/risk-management` - Manage stop-loss and take-profit

#### Trade Management
- `GET /api/trades` - Fetch user trade history with filtering
- `POST /api/trades/[id]/close` - Close specific trades

#### Portfolio
- `GET /api/portfolio/balance` - Get user balance and portfolio stats

### Frontend Components

#### Core Trading Components
- `TradingInterface.jsx` - Main trading interface for placing orders
- `Portfolio.jsx` - Portfolio overview and balance display
- `TradeHistory.jsx` - Trade history and position management
- `pages/trading.js` - Main trading page integrating all components

## Features

### 1. Order Placement System

**Supported Order Types:**
- Market Orders (immediate execution at current price)
- Limit Orders (execution at specified price)

**Supported Trading Pairs:**
- BTC/USDT
- ETH/USDT
- BNB/USDT
- SOL/USDT
- ADA/USDT

**Order Parameters:**
- `pair`: Trading pair (required)
- `side`: 'buy' or 'sell' (required)
- `type`: 'market' or 'limit' (required)
- `amount`: Order amount (required)
- `price`: Limit price (required for limit orders)
- `leverage`: Leverage multiplier (1-100)
- `duration`: Order duration ('1h', '4h', '1d', '1w')

**Example Order Placement:**
```javascript
const orderData = {
  pair: 'BTC/USDT',
  side: 'buy',
  type: 'market',
  amount: 0.1,
  leverage: 10,
  duration: '1h'
};

const response = await fetch('/api/trading/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(orderData)
});
```

### 2. Portfolio Management

**Portfolio Features:**
- Real-time balance tracking
- Available vs. margin used calculation
- Unrealized P&L calculation
- Trading statistics (win rate, total P&L)
- Open positions overview

**Balance Updates:**
- Automatic balance deduction on order placement
- Balance restoration on trade closure
- Margin calculation based on leverage
- Transaction logging for audit trail

### 3. Trade History & Management

**Trade Tracking:**
- Complete trade history with filtering
- Status-based filtering (OPEN, CLOSED, CANCELLED)
- Search functionality
- Pagination support
- Sorting by date, amount, P&L

**Trade Information:**
- Entry/exit prices
- Real-time P&L calculation
- Trade duration
- Leverage used
- Transaction fees

### 4. Risk Management

**Stop-Loss Orders:**
- Automatic trade closure when price hits stop level
- Validation to prevent invalid stop levels
- Trailing stop functionality

**Take-Profit Orders:**
- Automatic profit-taking at target price
- Multiple take-profit levels support

**Risk Management API:**
```javascript
// Set stop-loss
const riskData = {
  action: 'set_stop_loss',
  tradeId: 'trade-123',
  stopLoss: 45000
};

// Set take-profit
const riskData = {
  action: 'set_take_profit',
  tradeId: 'trade-123',
  takeProfit: 55000
};

// Set trailing stop
const riskData = {
  action: 'set_trailing_stop',
  tradeId: 'trade-123',
  trailingDistance: 1000
};
```

### 5. Price Data & Market Information

**Real-time Price Feeds:**
- Current market prices for all supported pairs
- 24-hour price change percentage
- Trading volume data
- High/low prices

**Price API Response:**
```json
{
  "success": true,
  "data": {
    "pair": "BTC/USDT",
    "price": 50000,
    "change24h": 2.5,
    "volume24h": 1500000000,
    "high24h": 51000,
    "low24h": 48500
  }
}
```

## Database Schema

### Trades Table
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  pair VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
  type VARCHAR(10) NOT NULL, -- 'market' or 'limit'
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8),
  leverage INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'OPEN',
  entry_price DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  pnl_percentage DECIMAL(10,4),
  pnl_amount DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  trailing_stop DECIMAL(20,8),
  duration VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Portfolios Table
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  balance DECIMAL(20,8) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USDT',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Fund Transactions Table
```sql
CREATE TABLE fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(20) NOT NULL, -- 'trade_open', 'trade_close', 'deposit', 'withdrawal'
  amount DECIMAL(20,8) NOT NULL,
  balance_after DECIMAL(20,8) NOT NULL,
  reference_id UUID, -- trade_id or other reference
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

### Comprehensive Test Suite

The system includes a comprehensive test suite located at `tests/trading-system.test.js`.

**Test Categories:**
1. **Authentication Tests** - Token validation and security
2. **Order Placement Tests** - All order types and validation
3. **Trade History Tests** - Filtering, pagination, and data integrity
4. **Portfolio Tests** - Balance calculations and updates
5. **Price Data Tests** - Market data accuracy
6. **Risk Management Tests** - Stop-loss and take-profit functionality
7. **Trade Closure Tests** - P&L calculations and balance updates

**Running Tests:**
```bash
# Run all tests
node tests/trading-system.test.js

# Run performance tests
node tests/trading-system.test.js --performance

# Run load tests
node tests/trading-system.test.js --load
```

### Test Results Interpretation

- ✅ **PASSED** - Test completed successfully
- ❌ **FAILED** - Test failed with specific error
- ⚠️ **WARNING** - Test completed with warnings
- 📊 **METRICS** - Performance or statistical data

## Security Features

### Authentication & Authorization
- JWT token-based authentication
- User-specific data isolation
- Protected API endpoints
- Token expiration handling

### Input Validation
- Comprehensive parameter validation
- SQL injection prevention
- XSS protection
- Rate limiting considerations

### Financial Security
- Balance verification before trades
- Atomic transaction processing
- Audit trail maintenance
- Error handling and rollback

## Performance Considerations

### Optimization Features
- Database indexing on frequently queried fields
- Pagination for large datasets
- Efficient SQL queries with proper joins
- Caching for price data (when implemented)

### Scalability
- Stateless API design
- Database connection pooling
- Async/await pattern usage
- Error boundary implementation

## Usage Examples

### Frontend Integration

```jsx
import TradingInterface from '../components/TradingInterface';
import Portfolio from '../components/Portfolio';
import TradeHistory from '../components/TradeHistory';

function TradingPage() {
  return (
    <div className="trading-page">
      <div className="trading-grid">
        <TradingInterface />
        <Portfolio />
      </div>
      <TradeHistory />
    </div>
  );
}
```

### API Integration

```javascript
// Place a market buy order
async function placeBuyOrder(pair, amount, leverage = 1) {
  try {
    const response = await fetch('/api/trading/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        pair,
        side: 'buy',
        type: 'market',
        amount,
        leverage,
        duration: '1h'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Order placed:', result.data.trade);
      return result.data.trade;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Order placement failed:', error);
    throw error;
  }
}

// Get portfolio balance
async function getPortfolioBalance() {
  try {
    const response = await fetch('/api/portfolio/balance', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw error;
  }
}

// Close a trade
async function closeTrade(tradeId) {
  try {
    const response = await fetch(`/api/trades/${tradeId}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Trade closed:', result.data);
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Trade closure failed:', error);
    throw error;
  }
}
```

## Error Handling

### Common Error Codes
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (trade/user not found)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Insufficient balance for this trade",
  "code": "INSUFFICIENT_BALANCE",
  "details": {
    "required": 1000,
    "available": 500
  }
}
```

## Future Enhancements

### Planned Features
1. **Real-time WebSocket Updates** - Live price feeds and order updates
2. **Advanced Order Types** - OCO, Iceberg, TWAP orders
3. **Social Trading** - Copy trading and signal sharing
4. **Advanced Analytics** - Technical indicators and charting
5. **Mobile App** - React Native implementation
6. **API Rate Limiting** - Request throttling and quotas
7. **Multi-currency Support** - Additional base currencies
8. **Automated Trading** - Bot integration and strategy execution

### Technical Improvements
1. **Caching Layer** - Redis for price data and session management
2. **Message Queue** - Background job processing
3. **Microservices** - Service decomposition for scalability
4. **Load Balancing** - Multiple server instances
5. **Database Sharding** - Horizontal scaling
6. **Monitoring** - Application performance monitoring
7. **CI/CD Pipeline** - Automated testing and deployment

## Troubleshooting

### Common Issues

1. **Orders Not Executing**
   - Check user balance
   - Verify trading pair availability
   - Confirm price parameters for limit orders

2. **Balance Discrepancies**
   - Review fund_transactions table
   - Check for pending trades
   - Verify margin calculations

3. **Authentication Errors**
   - Validate JWT token expiration
   - Check token format and signature
   - Verify user permissions

4. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Review API response times

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG=trading:*
LOG_LEVEL=debug
```

## Support

For technical support or questions about the trading system:

1. Check the test suite results for system health
2. Review error logs for specific issues
3. Consult the API documentation for endpoint details
4. Run performance tests to identify bottlenecks

---

*This trading system is designed for educational and development purposes. Always implement proper risk management and comply with financial regulations in production environments.*