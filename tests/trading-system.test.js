// Trading System Comprehensive Test Suite
// This file contains tests for all trading functionality

const { supabase } = require('../lib/supabase');
const jwt = require('jsonwebtoken');

// Mock data for testing
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

const mockTrade = {
  pair: 'BTC/USDT',
  side: 'buy',
  type: 'market',
  amount: 0.1,
  leverage: 10,
  duration: '1h'
};

// Test utilities
class TradingSystemTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.authToken = null;
  }

  // Generate test JWT token
  generateTestToken(userId = mockUser.id) {
    return jwt.sign(
      { sub: userId, email: mockUser.email },
      process.env.SUPABASE_JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Setup test environment
  async setup() {
    console.log('🔧 Setting up test environment...');
    this.authToken = this.generateTestToken();
    
    // Create test user portfolio if not exists
    try {
      await supabase
        .from('portfolios')
        .upsert({
          user_id: mockUser.id,
          balance: 10000, // $10,000 test balance
          currency: 'USDT'
        });
      console.log('✅ Test portfolio created');
    } catch (error) {
      console.error('❌ Failed to create test portfolio:', error);
    }
  }

  // Cleanup test data
  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    try {
      // Delete test trades
      await supabase
        .from('trades')
        .delete()
        .eq('user_id', mockUser.id);
      
      // Delete test transactions
      await supabase
        .from('fund_transactions')
        .delete()
        .eq('user_id', mockUser.id);
      
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  // Test 1: Order Placement
  async testOrderPlacement() {
    console.log('\n📊 Testing Order Placement...');
    
    const testCases = [
      {
        name: 'Valid Market Buy Order',
        data: { ...mockTrade },
        expectedStatus: 200
      },
      {
        name: 'Valid Limit Sell Order',
        data: { ...mockTrade, side: 'sell', type: 'limit', price: 50000 },
        expectedStatus: 200
      },
      {
        name: 'Invalid Pair',
        data: { ...mockTrade, pair: 'INVALID/PAIR' },
        expectedStatus: 400
      },
      {
        name: 'Insufficient Balance',
        data: { ...mockTrade, amount: 100, leverage: 100 },
        expectedStatus: 400
      },
      {
        name: 'Missing Required Fields',
        data: { pair: 'BTC/USDT' },
        expectedStatus: 400
      }
    ];

    for (const testCase of testCases) {
      try {
        const result = await this.makeRequest('/api/trading/order', {
          method: 'POST',
          body: JSON.stringify(testCase.data)
        });

        if (result.status === testCase.expectedStatus) {
          console.log(`  ✅ ${testCase.name}: PASSED`);
          if (result.ok && result.data.data?.trade) {
            console.log(`     Trade ID: ${result.data.data.trade.id}`);
          }
        } else {
          console.log(`  ❌ ${testCase.name}: FAILED (Expected ${testCase.expectedStatus}, got ${result.status})`);
        }
      } catch (error) {
        console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
      }
    }
  }

  // Test 2: Trade History
  async testTradeHistory() {
    console.log('\n📋 Testing Trade History...');
    
    try {
      const result = await this.makeRequest('/api/trades');
      
      if (result.ok) {
        console.log('  ✅ Fetch trades: PASSED');
        console.log(`     Found ${result.data.trades?.length || 0} trades`);
        
        // Test filtering
        const filteredResult = await this.makeRequest('/api/trades?status=OPEN&limit=5');
        if (filteredResult.ok) {
          console.log('  ✅ Filter trades: PASSED');
        } else {
          console.log('  ❌ Filter trades: FAILED');
        }
      } else {
        console.log('  ❌ Fetch trades: FAILED');
      }
    } catch (error) {
      console.log(`  ❌ Trade history test: ERROR - ${error.message}`);
    }
  }

  // Test 3: Portfolio Balance
  async testPortfolioBalance() {
    console.log('\n💰 Testing Portfolio Balance...');
    
    try {
      const result = await this.makeRequest('/api/portfolio/balance');
      
      if (result.ok && result.data.balance !== undefined) {
        console.log('  ✅ Fetch balance: PASSED');
        console.log(`     Balance: $${result.data.balance}`);
      } else {
        console.log('  ❌ Fetch balance: FAILED');
      }
    } catch (error) {
      console.log(`  ❌ Portfolio balance test: ERROR - ${error.message}`);
    }
  }

  // Test 4: Price Data
  async testPriceData() {
    console.log('\n💹 Testing Price Data...');
    
    const pairs = ['BTC/USDT', 'ETH/USDT', 'INVALID/PAIR'];
    
    for (const pair of pairs) {
      try {
        const result = await this.makeRequest(`/api/trading/price/${pair}`);
        
        if (pair === 'INVALID/PAIR') {
          if (result.status === 404) {
            console.log(`  ✅ ${pair}: PASSED (correctly rejected)`);
          } else {
            console.log(`  ❌ ${pair}: FAILED (should be 404)`);
          }
        } else {
          if (result.ok && result.data.data?.price) {
            console.log(`  ✅ ${pair}: PASSED ($${result.data.data.price})`);
          } else {
            console.log(`  ❌ ${pair}: FAILED`);
          }
        }
      } catch (error) {
        console.log(`  ❌ ${pair}: ERROR - ${error.message}`);
      }
    }
  }

  // Test 5: Risk Management
  async testRiskManagement() {
    console.log('\n🛡️ Testing Risk Management...');
    
    // First create a test trade
    const orderResult = await this.makeRequest('/api/trading/order', {
      method: 'POST',
      body: JSON.stringify(mockTrade)
    });

    if (!orderResult.ok || !orderResult.data.data?.trade) {
      console.log('  ❌ Could not create test trade for risk management');
      return;
    }

    const tradeId = orderResult.data.data.trade.id;
    console.log(`     Using trade ID: ${tradeId}`);

    const riskTests = [
      {
        name: 'Set Stop Loss',
        data: { action: 'set_stop_loss', tradeId, stopLoss: 45000 },
        expectedStatus: 200
      },
      {
        name: 'Set Take Profit',
        data: { action: 'set_take_profit', tradeId, takeProfit: 55000 },
        expectedStatus: 200
      },
      {
        name: 'Invalid Stop Loss (above entry for buy)',
        data: { action: 'set_stop_loss', tradeId, stopLoss: 60000 },
        expectedStatus: 400
      },
      {
        name: 'Remove Risk Management',
        data: { action: 'remove_risk_management', tradeId },
        expectedStatus: 200
      }
    ];

    for (const test of riskTests) {
      try {
        const result = await this.makeRequest('/api/trading/risk-management', {
          method: 'POST',
          body: JSON.stringify(test.data)
        });

        if (result.status === test.expectedStatus) {
          console.log(`  ✅ ${test.name}: PASSED`);
        } else {
          console.log(`  ❌ ${test.name}: FAILED (Expected ${test.expectedStatus}, got ${result.status})`);
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  // Test 6: Trade Closure
  async testTradeClosure() {
    console.log('\n🔒 Testing Trade Closure...');
    
    // Get open trades
    const tradesResult = await this.makeRequest('/api/trades?status=OPEN');
    
    if (!tradesResult.ok || !tradesResult.data.trades?.length) {
      console.log('  ⚠️ No open trades to close');
      return;
    }

    const tradeId = tradesResult.data.trades[0].id;
    
    try {
      const result = await this.makeRequest(`/api/trades/${tradeId}/close`, {
        method: 'POST'
      });

      if (result.ok) {
        console.log('  ✅ Close trade: PASSED');
        console.log(`     P&L: $${result.data.data?.pnl || 0}`);
      } else {
        console.log('  ❌ Close trade: FAILED');
      }
    } catch (error) {
      console.log(`  ❌ Trade closure test: ERROR - ${error.message}`);
    }
  }

  // Test 7: Authentication
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    // Test without token
    const noTokenResult = await this.makeRequest('/api/trades', {
      headers: { 'Authorization': '' }
    });
    
    if (noTokenResult.status === 401) {
      console.log('  ✅ No token rejection: PASSED');
    } else {
      console.log('  ❌ No token rejection: FAILED');
    }

    // Test with invalid token
    const invalidTokenResult = await this.makeRequest('/api/trades', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    
    if (invalidTokenResult.status === 401) {
      console.log('  ✅ Invalid token rejection: PASSED');
    } else {
      console.log('  ❌ Invalid token rejection: FAILED');
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Trading System Tests\n');
    console.log('=' .repeat(50));
    
    await this.setup();
    
    try {
      await this.testAuthentication();
      await this.testPriceData();
      await this.testPortfolioBalance();
      await this.testOrderPlacement();
      await this.testTradeHistory();
      await this.testRiskManagement();
      await this.testTradeClosure();
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🏁 Trading System Tests Completed');
  }
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Running Performance Tests...');
  
  const tester = new TradingSystemTester();
  await tester.setup();
  
  const startTime = Date.now();
  const promises = [];
  
  // Test concurrent order placement
  for (let i = 0; i < 10; i++) {
    promises.push(
      tester.makeRequest('/api/trading/order', {
        method: 'POST',
        body: JSON.stringify({
          ...mockTrade,
          amount: 0.01 // Small amount to avoid balance issues
        })
      })
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(r => r.ok).length;
    console.log(`  ✅ Processed ${successCount}/10 concurrent orders in ${duration}ms`);
    console.log(`  📊 Average response time: ${duration / 10}ms per request`);
  } catch (error) {
    console.log('  ❌ Performance test failed:', error.message);
  }
  
  await tester.cleanup();
}

// Load test
async function loadTest() {
  console.log('\n🔥 Running Load Test...');
  
  const tester = new TradingSystemTester();
  await tester.setup();
  
  const testDuration = 30000; // 30 seconds
  const startTime = Date.now();
  let requestCount = 0;
  let errorCount = 0;
  
  const makeRequest = async () => {
    try {
      const result = await tester.makeRequest('/api/trading/price/BTC/USDT');
      requestCount++;
      if (!result.ok) errorCount++;
    } catch (error) {
      errorCount++;
    }
  };
  
  // Send requests continuously for test duration
  const interval = setInterval(makeRequest, 100); // Every 100ms
  
  setTimeout(() => {
    clearInterval(interval);
    const duration = Date.now() - startTime;
    const rps = (requestCount / duration) * 1000;
    
    console.log(`  📊 Load Test Results:`);
    console.log(`     Duration: ${duration}ms`);
    console.log(`     Total Requests: ${requestCount}`);
    console.log(`     Errors: ${errorCount}`);
    console.log(`     Success Rate: ${((requestCount - errorCount) / requestCount * 100).toFixed(2)}%`);
    console.log(`     Requests/Second: ${rps.toFixed(2)}`);
    
    tester.cleanup();
  }, testDuration);
}

// Export for use in other files
module.exports = {
  TradingSystemTester,
  performanceTest,
  loadTest
};

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new TradingSystemTester();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--performance')) {
    performanceTest();
  } else if (args.includes('--load')) {
    loadTest();
  } else {
    tester.runAllTests();
  }
}