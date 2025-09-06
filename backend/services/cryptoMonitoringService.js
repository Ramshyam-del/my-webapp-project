const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const crypto = require('crypto');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CryptoMonitoringService {
  constructor() {
    this.monitoringIntervals = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('Starting crypto monitoring service...');
    this.isRunning = true;
    
    // Start monitoring for all active deposits
    await this.startMonitoringActiveDeposits();
    
    // Set up periodic cleanup of completed deposits
    setInterval(() => {
      this.cleanupCompletedDeposits();
    }, 60000); // Every minute
  }

  async stop() {
    console.log('Stopping crypto monitoring service...');
    this.isRunning = false;
    
    // Clear all monitoring intervals
    for (const [depositId, intervalId] of this.monitoringIntervals) {
      clearInterval(intervalId);
    }
    this.monitoringIntervals.clear();
  }

  async startMonitoringActiveDeposits() {
    try {
      const { data: deposits, error } = await supabase
        .from('crypto_deposits')
        .select('*')
        .in('status', ['pending', 'confirming']);

      if (error) {
        console.error('Error fetching active deposits:', error);
        return;
      }

      for (const deposit of deposits) {
        await this.startMonitoringDeposit(deposit.id);
      }

      console.log(`Started monitoring ${deposits.length} active deposits`);
    } catch (error) {
      console.error('Error starting monitoring for active deposits:', error);
    }
  }

  async startMonitoringDeposit(depositId) {
    if (this.monitoringIntervals.has(depositId)) {
      return; // Already monitoring
    }

    try {
      const { data: deposit, error } = await supabase
        .from('crypto_deposits')
        .select('*')
        .eq('id', depositId)
        .single();

      if (error || !deposit) {
        console.error('Error fetching deposit:', error);
        return;
      }

      // Get monitoring configuration
      const { data: config } = await supabase
        .from('deposit_monitoring_config')
        .select('*')
        .eq('crypto_type', deposit.currency)
        .single();

      const checkInterval = config?.check_interval_seconds * 1000 || 30000; // Default 30 seconds

      const intervalId = setInterval(async () => {
        await this.checkDepositStatus(depositId);
      }, checkInterval);

      this.monitoringIntervals.set(depositId, intervalId);
      console.log(`Started monitoring deposit ${depositId} for ${deposit.currency}`);
    } catch (error) {
      console.error(`Error starting monitoring for deposit ${depositId}:`, error);
    }
  }

  async stopMonitoringDeposit(depositId) {
    const intervalId = this.monitoringIntervals.get(depositId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(depositId);
      console.log(`Stopped monitoring deposit ${depositId}`);
    }
  }

  async checkDepositStatus(depositId) {
    try {
      const { data: deposit, error } = await supabase
        .from('crypto_deposits')
        .select('*')
        .eq('id', depositId)
        .single();

      if (error || !deposit) {
        console.error('Error fetching deposit for status check:', error);
        return;
      }

      // Skip if deposit is already completed or failed
      if (['completed', 'failed', 'expired'].includes(deposit.status)) {
        await this.stopMonitoringDeposit(depositId);
        return;
      }

      let balance = 0;
      let confirmations = 0;
      let transactionHash = null;

      // Check balance based on crypto type
      switch (deposit.currency) {
        case 'BTC':
          ({ balance, confirmations, transactionHash } = await this.checkBitcoinAddress(deposit.wallet_address));
          break;
        case 'ETH':
          ({ balance, confirmations, transactionHash } = await this.checkEthereumAddress(deposit.wallet_address));
          break;
        case 'USDT':
          ({ balance, confirmations, transactionHash } = await this.checkUSDTAddress(deposit.wallet_address));
          break;
        default:
          console.error(`Unsupported crypto type: ${deposit.currency}`);
          return;
      }

      // Update deposit status based on balance and confirmations
      await this.updateDepositStatus(deposit, balance, confirmations, transactionHash);

    } catch (error) {
      console.error(`Error checking deposit status for ${depositId}:`, error);
    }
  }

  async checkBitcoinAddress(address) {
    try {
      // Using BlockCypher API for Bitcoin
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);
      const data = response.data;
      
      return {
        balance: data.balance / 100000000, // Convert satoshis to BTC
        confirmations: data.n_tx > 0 ? 6 : 0, // Simplified - assume 6 confirmations if there are transactions
        transactionHash: data.n_tx > 0 ? 'detected' : null
      };
    } catch (error) {
      console.error('Error checking Bitcoin address:', error);
      return { balance: 0, confirmations: 0, transactionHash: null };
    }
  }

  async checkEthereumAddress(address) {
    try {
      // Using Etherscan API for Ethereum
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourEtherscanAPIKey';
      const response = await axios.get(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`);
      
      if (response.data.status === '1') {
        const balance = parseFloat(response.data.result) / Math.pow(10, 18); // Convert wei to ETH
        return {
          balance,
          confirmations: balance > 0 ? 12 : 0, // Simplified - assume 12 confirmations if balance > 0
          transactionHash: balance > 0 ? 'detected' : null
        };
      }
      
      return { balance: 0, confirmations: 0, transactionHash: null };
    } catch (error) {
      console.error('Error checking Ethereum address:', error);
      return { balance: 0, confirmations: 0, transactionHash: null };
    }
  }

  async checkUSDTAddress(address) {
    try {
      // Using Etherscan API for USDT (ERC-20 token)
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourEtherscanAPIKey';
      const usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
      
      const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${usdtContractAddress}&address=${address}&tag=latest&apikey=${apiKey}`);
      
      if (response.data.status === '1') {
        const balance = parseFloat(response.data.result) / Math.pow(10, 6); // USDT has 6 decimals
        return {
          balance,
          confirmations: balance > 0 ? 12 : 0, // Simplified - assume 12 confirmations if balance > 0
          transactionHash: balance > 0 ? 'detected' : null
        };
      }
      
      return { balance: 0, confirmations: 0, transactionHash: null };
    } catch (error) {
      console.error('Error checking USDT address:', error);
      return { balance: 0, confirmations: 0, transactionHash: null };
    }
  }

  async updateDepositStatus(deposit, currentBalance, confirmations, transactionHash) {
    try {
      let newStatus = deposit.status;
      let updates = {
        current_balance: currentBalance,
        confirmations: confirmations,
        last_checked: new Date().toISOString()
      };

      if (transactionHash && !deposit.transaction_hash) {
        updates.transaction_hash = transactionHash;
      }

      // Determine new status
      if (currentBalance >= deposit.expected_amount) {
        if (confirmations >= deposit.required_confirmations) {
          newStatus = 'completed';
          updates.completed_at = new Date().toISOString();
          
          // Create fund transaction record
          await this.createFundTransaction(deposit, currentBalance);
          
          // Stop monitoring this deposit
          await this.stopMonitoringDeposit(deposit.id);
        } else if (currentBalance > 0) {
          newStatus = 'confirming';
        }
      } else if (currentBalance > 0) {
        newStatus = 'partial';
      }

      // Check for expiration
      const expiresAt = new Date(deposit.expires_at);
      if (new Date() > expiresAt && newStatus !== 'completed') {
        newStatus = 'expired';
        await this.stopMonitoringDeposit(deposit.id);
      }

      // Update deposit if status changed
      if (newStatus !== deposit.status || Object.keys(updates).length > 3) {
        updates.status = newStatus;
        
        const { error } = await supabase
          .from('crypto_deposits')
          .update(updates)
          .eq('id', deposit.id);

        if (error) {
          console.error('Error updating deposit status:', error);
        } else {
          console.log(`Updated deposit ${deposit.id}: ${deposit.status} -> ${newStatus}, balance: ${currentBalance}`);
        }
      }
    } catch (error) {
      console.error('Error updating deposit status:', error);
    }
  }

  async createFundTransaction(deposit, amount) {
    try {
      const { error } = await supabase
        .from('fund_transactions')
        .insert({
          user_id: deposit.user_id,
          type: 'deposit',
          amount: amount,
          currency: deposit.currency,
          status: 'completed',
          description: `Crypto deposit - ${deposit.currency}`,
          reference_id: deposit.id,
          transaction_hash: deposit.transaction_hash
        });

      if (error) {
        console.error('Error creating fund transaction:', error);
      } else {
        console.log(`Created fund transaction for deposit ${deposit.id}`);
      }
    } catch (error) {
      console.error('Error creating fund transaction:', error);
    }
  }

  async cleanupCompletedDeposits() {
    try {
      // Remove monitoring for deposits that are no longer active
      const activeDepositIds = Array.from(this.monitoringIntervals.keys());
      
      if (activeDepositIds.length === 0) return;

      const { data: activeDeposits, error } = await supabase
        .from('crypto_deposits')
        .select('id')
        .in('id', activeDepositIds)
        .in('status', ['pending', 'confirming', 'partial']);

      if (error) {
        console.error('Error fetching active deposits for cleanup:', error);
        return;
      }

      const activeIds = new Set(activeDeposits.map(d => d.id));
      
      // Stop monitoring deposits that are no longer active
      for (const depositId of activeDepositIds) {
        if (!activeIds.has(depositId)) {
          await this.stopMonitoringDeposit(depositId);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Method to manually trigger monitoring for a new deposit
  async monitorNewDeposit(depositId) {
    await this.startMonitoringDeposit(depositId);
  }

  // Get monitoring status
  getMonitoringStatus() {
    return {
      isRunning: this.isRunning,
      activeDeposits: this.monitoringIntervals.size,
      monitoredDepositIds: Array.from(this.monitoringIntervals.keys())
    };
  }
}

module.exports = CryptoMonitoringService;