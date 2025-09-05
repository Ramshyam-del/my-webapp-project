const { supabaseAdmin } = require('../lib/supabaseAdmin');
const axios = require('axios');

class BlockchainMonitor {
  constructor() {
    this.isRunning = false;
    this.intervals = new Map();
    this.lastCheckedBlocks = new Map();
  }

  async start() {
    if (this.isRunning) {
      console.log('Blockchain monitor is already running');
      return;
    }

    console.log('Starting blockchain monitor...');
    this.isRunning = true;

    // Load monitoring configuration
    await this.loadMonitoringConfig();

    // Start monitoring for each enabled currency
    const configs = await this.getMonitoringConfigs();
    for (const config of configs) {
      if (config.is_enabled) {
        this.startCurrencyMonitoring(config);
      }
    }
  }

  async stop() {
    console.log('Stopping blockchain monitor...');
    this.isRunning = false;

    // Clear all intervals
    for (const [currency, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`Stopped monitoring for ${currency}`);
    }
    this.intervals.clear();
  }

  async loadMonitoringConfig() {
    try {
      const { data: configs, error } = await supabaseAdmin
        .from('deposit_monitoring_config')
        .select('*')
        .eq('is_enabled', true);

      if (error) {
        console.error('Error loading monitoring config:', error);
        return;
      }

      // Store last checked blocks
      configs.forEach(config => {
        this.lastCheckedBlocks.set(config.currency, config.last_checked_block || 0);
      });

      console.log(`Loaded monitoring config for ${configs.length} currencies`);
    } catch (error) {
      console.error('Error in loadMonitoringConfig:', error);
    }
  }

  async getMonitoringConfigs() {
    try {
      const { data: configs, error } = await supabaseAdmin
        .from('deposit_monitoring_config')
        .select('*');

      if (error) {
        console.error('Error fetching monitoring configs:', error);
        return [];
      }

      return configs || [];
    } catch (error) {
      console.error('Error in getMonitoringConfigs:', error);
      return [];
    }
  }

  startCurrencyMonitoring(config) {
    const { currency, check_interval_seconds } = config;
    
    console.log(`Starting monitoring for ${currency} (interval: ${check_interval_seconds}s)`);

    const intervalId = setInterval(async () => {
      try {
        await this.checkCurrencyDeposits(config);
      } catch (error) {
        console.error(`Error monitoring ${currency}:`, error);
      }
    }, check_interval_seconds * 1000);

    this.intervals.set(currency, intervalId);

    // Run initial check
    this.checkCurrencyDeposits(config).catch(error => {
      console.error(`Error in initial ${currency} check:`, error);
    });
  }

  async checkCurrencyDeposits(config) {
    const { currency, network } = config;

    try {
      // Get all user wallet addresses for this currency
      const { data: walletAddresses, error: walletError } = await supabaseAdmin
        .from('user_wallet_addresses')
        .select('*')
        .eq('currency', currency)
        .eq('is_active', true);

      if (walletError) {
        console.error(`Error fetching wallet addresses for ${currency}:`, walletError);
        return;
      }

      if (!walletAddresses || walletAddresses.length === 0) {
        console.log(`No wallet addresses found for ${currency}`);
        return;
      }

      console.log(`Checking ${walletAddresses.length} ${currency} addresses for deposits`);

      // Check each address for new transactions
      for (const wallet of walletAddresses) {
        await this.checkAddressTransactions(wallet, config);
      }

    } catch (error) {
      console.error(`Error in checkCurrencyDeposits for ${currency}:`, error);
    }
  }

  async checkAddressTransactions(wallet, config) {
    const { currency, network, min_deposit_amount, min_confirmations } = config;
    const { address, user_id } = wallet;

    try {
      let transactions = [];

      // Use different APIs based on currency
      switch (currency) {
        case 'BTC':
          transactions = await this.getBitcoinTransactions(address);
          break;
        case 'ETH':
          transactions = await this.getEthereumTransactions(address);
          break;
        case 'USDT':
          transactions = await this.getUSDTTransactions(address);
          break;
        default:
          console.log(`Unsupported currency: ${currency}`);
          return;
      }

      // Process each transaction
      for (const tx of transactions) {
        await this.processTransaction(tx, wallet, config);
      }

    } catch (error) {
      console.error(`Error checking transactions for ${address} (${currency}):`, error);
    }
  }

  async getBitcoinTransactions(address) {
    try {
      // Using BlockCypher API (free tier)
      const response = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full?limit=10`);
      
      if (!response.data.txs) {
        return [];
      }

      return response.data.txs.map(tx => ({
        hash: tx.hash,
        amount: this.calculateBitcoinReceived(tx, address),
        confirmations: tx.confirmations || 0,
        block_height: tx.block_height,
        timestamp: new Date(tx.confirmed || tx.received),
        from_address: tx.inputs[0]?.addresses?.[0] || 'unknown',
        network: 'bitcoin'
      })).filter(tx => tx.amount > 0); // Only incoming transactions

    } catch (error) {
      console.error('Error fetching Bitcoin transactions:', error);
      return [];
    }
  }

  async getEthereumTransactions(address) {
    try {
      // Using Etherscan API (requires API key for production)
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
      const response = await axios.get(`https://api.etherscan.io/api`, {
        params: {
          module: 'account',
          action: 'txlist',
          address: address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 10,
          sort: 'desc',
          apikey: apiKey
        }
      });

      if (!response.data.result || !Array.isArray(response.data.result)) {
        return [];
      }

      return response.data.result
        .filter(tx => tx.to.toLowerCase() === address.toLowerCase() && tx.value !== '0')
        .map(tx => ({
          hash: tx.hash,
          amount: parseFloat(tx.value) / Math.pow(10, 18), // Convert from wei to ETH
          confirmations: tx.confirmations || 0,
          block_height: parseInt(tx.blockNumber),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          from_address: tx.from,
          network: 'ethereum',
          gas_fee: (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / Math.pow(10, 18)
        }));

    } catch (error) {
      console.error('Error fetching Ethereum transactions:', error);
      return [];
    }
  }

  async getUSDTTransactions(address) {
    try {
      // USDT on Ethereum - using Etherscan API for ERC-20 token transfers
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
      const usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT contract on Ethereum
      
      const response = await axios.get(`https://api.etherscan.io/api`, {
        params: {
          module: 'account',
          action: 'tokentx',
          contractaddress: usdtContractAddress,
          address: address,
          page: 1,
          offset: 10,
          sort: 'desc',
          apikey: apiKey
        }
      });

      if (!response.data.result || !Array.isArray(response.data.result)) {
        return [];
      }

      return response.data.result
        .filter(tx => tx.to.toLowerCase() === address.toLowerCase())
        .map(tx => ({
          hash: tx.hash,
          amount: parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal)), // Convert from smallest unit
          confirmations: tx.confirmations || 0,
          block_height: parseInt(tx.blockNumber),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          from_address: tx.from,
          network: 'ethereum',
          gas_fee: 0 // Gas fee is paid by sender
        }));

    } catch (error) {
      console.error('Error fetching USDT transactions:', error);
      return [];
    }
  }

  calculateBitcoinReceived(tx, address) {
    let received = 0;
    if (tx.outputs) {
      for (const output of tx.outputs) {
        if (output.addresses && output.addresses.includes(address)) {
          received += output.value / 100000000; // Convert from satoshis to BTC
        }
      }
    }
    return received;
  }

  async processTransaction(tx, wallet, config) {
    const { currency, min_deposit_amount, min_confirmations } = config;
    const { user_id, address } = wallet;

    try {
      // Check if transaction already exists
      const { data: existingDeposit, error: checkError } = await supabaseAdmin
        .from('crypto_deposits')
        .select('id, status, confirmations')
        .eq('transaction_hash', tx.hash)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing deposit:', checkError);
        return;
      }

      // Skip if amount is below minimum
      if (tx.amount < min_deposit_amount) {
        console.log(`Transaction ${tx.hash} amount ${tx.amount} below minimum ${min_deposit_amount}`);
        return;
      }

      if (existingDeposit) {
        // Update existing deposit if confirmations changed
        if (existingDeposit.confirmations !== tx.confirmations) {
          await this.updateDepositConfirmations(existingDeposit.id, tx.confirmations, min_confirmations);
        }
      } else {
        // Create new deposit record
        await this.createNewDeposit(tx, wallet, config);
      }

    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  }

  async createNewDeposit(tx, wallet, config) {
    const { currency, min_confirmations } = config;
    const { user_id, address } = wallet;

    try {
      const depositData = {
        user_id,
        currency,
        deposit_address: address,
        transaction_hash: tx.hash,
        amount: tx.amount,
        confirmations: tx.confirmations,
        required_confirmations: min_confirmations,
        status: tx.confirmations >= min_confirmations ? 'completed' : 'confirming',
        block_number: tx.block_height,
        network: tx.network,
        from_address: tx.from_address,
        gas_fee: tx.gas_fee || 0,
        detected_at: new Date(),
        confirmed_at: tx.confirmations >= min_confirmations ? new Date() : null,
        metadata: {
          timestamp: tx.timestamp,
          api_source: this.getApiSource(currency)
        }
      };

      const { data: deposit, error: insertError } = await supabaseAdmin
        .from('crypto_deposits')
        .insert(depositData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating deposit record:', insertError);
        return;
      }

      console.log(`New ${currency} deposit detected: ${tx.amount} ${currency} (${tx.confirmations}/${min_confirmations} confirmations)`);

      // If deposit is confirmed, update user balance
      if (tx.confirmations >= min_confirmations) {
        await this.processConfirmedDeposit(deposit);
      }

    } catch (error) {
      console.error('Error in createNewDeposit:', error);
    }
  }

  async updateDepositConfirmations(depositId, newConfirmations, minConfirmations) {
    try {
      const updateData = {
        confirmations: newConfirmations,
        status: newConfirmations >= minConfirmations ? 'completed' : 'confirming',
        confirmed_at: newConfirmations >= minConfirmations ? new Date() : null
      };

      const { data: updatedDeposit, error: updateError } = await supabaseAdmin
        .from('crypto_deposits')
        .update(updateData)
        .eq('id', depositId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating deposit confirmations:', updateError);
        return;
      }

      // If deposit just became confirmed, update user balance
      if (newConfirmations >= minConfirmations && updatedDeposit.status === 'completed' && !updatedDeposit.processed_at) {
        await this.processConfirmedDeposit(updatedDeposit);
      }

    } catch (error) {
      console.error('Error in updateDepositConfirmations:', error);
    }
  }

  async processConfirmedDeposit(deposit) {
    const { user_id, currency, amount, id: depositId } = deposit;

    try {
      // Update user's portfolio balance using the existing adjust_balance function
      const { data: balanceResult, error: balanceError } = await supabaseAdmin
        .rpc('adjust_balance', {
          p_user_id: user_id,
          p_currency: currency,
          p_delta: amount
        });

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        return;
      }

      // Create fund transaction record
      const { error: txError } = await supabaseAdmin
        .from('fund_transactions')
        .insert({
          user_id,
          currency,
          amount,
          type: 'deposit',
          status: 'completed',
          remark: `Crypto deposit confirmed - TX: ${deposit.transaction_hash}`,
          created_by: 'blockchain_monitor'
        });

      if (txError) {
        console.error('Error creating fund transaction:', txError);
      }

      // Mark deposit as processed
      await supabaseAdmin
        .from('crypto_deposits')
        .update({ processed_at: new Date() })
        .eq('id', depositId);

      console.log(`✅ Processed confirmed deposit: ${amount} ${currency} for user ${user_id}`);

    } catch (error) {
      console.error('Error in processConfirmedDeposit:', error);
    }
  }

  getApiSource(currency) {
    switch (currency) {
      case 'BTC': return 'blockcypher';
      case 'ETH': return 'etherscan';
      case 'USDT': return 'etherscan';
      default: return 'unknown';
    }
  }

  // Utility method to generate deposit address for a user
  async generateDepositAddress(userId, currency) {
    try {
      // In a real implementation, you would generate actual wallet addresses
      // For demo purposes, we'll create mock addresses
      const mockAddresses = {
        BTC: `1${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        ETH: `0x${Math.random().toString(16).substring(2, 42)}`,
        USDT: `0x${Math.random().toString(16).substring(2, 42)}`
      };

      const address = mockAddresses[currency];
      if (!address) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      // Store the address in the database
      const { data: walletAddress, error } = await supabaseAdmin
        .from('user_wallet_addresses')
        .upsert({
          user_id: userId,
          currency,
          address,
          network: currency === 'BTC' ? 'bitcoin' : 'ethereum',
          is_active: true
        }, {
          onConflict: 'user_id,currency,network'
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing wallet address:', error);
        throw error;
      }

      return walletAddress;

    } catch (error) {
      console.error('Error generating deposit address:', error);
      throw error;
    }
  }
}

module.exports = BlockchainMonitor;