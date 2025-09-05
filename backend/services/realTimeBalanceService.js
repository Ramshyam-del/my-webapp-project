const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with real-time configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

class RealTimeBalanceService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.isRunning = false;
  }

  start(server) {
    if (this.isRunning) return;

    console.log('Starting Real-Time Balance Service...');
    
    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/balance'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.removeClient(ws);
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });

    // Set up Supabase real-time subscriptions
    this.setupSupabaseSubscriptions();
    
    this.isRunning = true;
    console.log('Real-Time Balance Service started successfully');
  }

  async handleMessage(ws, data) {
    const { type, userId, token } = data;

    switch (type) {
      case 'authenticate':
        await this.authenticateClient(ws, userId, token);
        break;
      case 'subscribe_balance':
        await this.subscribeToBalance(ws, userId);
        break;
      case 'unsubscribe_balance':
        this.unsubscribeFromBalance(ws, userId);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  async authenticateClient(ws, userId, token) {
    try {
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user || user.id !== userId) {
        ws.send(JSON.stringify({ 
          type: 'auth_error', 
          message: 'Authentication failed' 
        }));
        ws.close();
        return;
      }

      // Store authenticated user info
      ws.userId = userId;
      ws.authenticated = true;
      
      ws.send(JSON.stringify({ 
        type: 'auth_success', 
        message: 'Authentication successful' 
      }));
      
    } catch (error) {
      console.error('Authentication error:', error);
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Authentication failed' 
      }));
      ws.close();
    }
  }

  async subscribeToBalance(ws, userId) {
    if (!ws.authenticated || ws.userId !== userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not authenticated' 
      }));
      return;
    }

    // Add client to the user's connection set
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Send current balance immediately
    await this.sendCurrentBalance(userId);
    
    ws.send(JSON.stringify({ 
      type: 'subscription_success', 
      message: 'Subscribed to balance updates' 
    }));
  }

  unsubscribeFromBalance(ws, userId) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  removeClient(ws) {
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId).delete(ws);
      if (this.clients.get(ws.userId).size === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  async sendCurrentBalance(userId) {
    try {
      // Fetch current portfolio balances
      const { data: portfolios, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching portfolio balances:', error);
        return;
      }

      const balanceData = {
        type: 'balance_update',
        userId,
        balances: {},
        totalBalance: 0,
        timestamp: new Date().toISOString()
      };

      // Process portfolio data
      if (portfolios) {
        portfolios.forEach(portfolio => {
          const balance = Number(portfolio.balance);
          balanceData.balances[portfolio.currency] = {
            balance,
            updatedAt: portfolio.updated_at
          };
          balanceData.totalBalance += balance;
        });
      }

      // Send to all connected clients for this user
      this.broadcastToUser(userId, balanceData);
      
    } catch (error) {
      console.error('Error sending current balance:', error);
    }
  }

  broadcastToUser(userId, data) {
    if (!this.clients.has(userId)) return;

    const userClients = this.clients.get(userId);
    const message = JSON.stringify(data);
    
    userClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        userClients.delete(ws);
      }
    });

    // Clean up empty client sets
    if (userClients.size === 0) {
      this.clients.delete(userId);
    }
  }

  setupSupabaseSubscriptions() {
    console.log('Setting up Supabase real-time subscriptions...');
    
    // Subscribe to portfolio changes
    const portfolioChannel = supabase
      .channel('portfolio_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'portfolios' 
        }, 
        async (payload) => {
          console.log('🔄 Portfolio change detected:', JSON.stringify(payload, null, 2));
          
          const userId = payload.new?.user_id || payload.old?.user_id;
          console.log('📧 User ID from payload:', userId);
          console.log('👥 Connected clients:', Array.from(this.clients.keys()));
          
          if (userId && this.clients.has(userId)) {
            console.log('📤 Sending balance update to user:', userId);
            await this.sendCurrentBalance(userId);
          } else {
            console.log('⚠️ User not connected or no user ID found');
          }
        }
      )
      .subscribe((status) => {
        console.log('📊 Portfolio subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Portfolio real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Portfolio subscription error');
        }
      });

    // Subscribe to fund transaction changes
    const transactionChannel = supabase
      .channel('fund_transaction_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'fund_transactions' 
        }, 
        async (payload) => {
          console.log('💰 Fund transaction detected:', JSON.stringify(payload, null, 2));
          
          const userId = payload.new?.user_id;
          console.log('📧 Transaction user ID:', userId);
          console.log('👥 Connected clients:', Array.from(this.clients.keys()));
          
          if (userId && this.clients.has(userId)) {
            console.log('📤 Sending transaction notification to user:', userId);
            
            // Send notification about the transaction
            this.broadcastToUser(userId, {
              type: 'transaction_notification',
              transaction: {
                id: payload.new.id,
                type: payload.new.type,
                amount: payload.new.amount,
                currency: payload.new.currency,
                status: payload.new.status,
                description: payload.new.description,
                createdAt: payload.new.created_at
              },
              timestamp: new Date().toISOString()
            });
            
            // Update balance after a short delay to ensure DB consistency
            setTimeout(() => {
              console.log('🔄 Sending delayed balance update for user:', userId);
              this.sendCurrentBalance(userId);
            }, 1000);
          } else {
            console.log('⚠️ User not connected for transaction notification');
          }
        }
      )
      .subscribe((status) => {
        console.log('💳 Fund transaction subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Fund transaction real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Fund transaction subscription error');
        }
      });

    console.log('Supabase real-time subscriptions established');
  }

  stop() {
    if (!this.isRunning) return;

    console.log('Stopping Real-Time Balance Service...');
    
    if (this.wss) {
      this.wss.close();
    }
    
    this.clients.clear();
    this.isRunning = false;
    
    console.log('Real-Time Balance Service stopped');
  }

  // Method to manually trigger balance update for a user
  async triggerBalanceUpdate(userId) {
    if (this.clients.has(userId)) {
      await this.sendCurrentBalance(userId);
    }
  }

  // Get connection stats
  getStats() {
    const totalConnections = Array.from(this.clients.values())
      .reduce((sum, clientSet) => sum + clientSet.size, 0);
    
    return {
      isRunning: this.isRunning,
      connectedUsers: this.clients.size,
      totalConnections,
      userConnections: Array.from(this.clients.entries()).map(([userId, clients]) => ({
        userId,
        connections: clients.size
      }))
    };
  }
}

module.exports = RealTimeBalanceService;