"use strict";

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Transaction model with complete Supabase operations
module.exports = {
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('fund_transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error finding transaction by ID:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction findById error:', error);
      return null;
    }
  },

  async findByUser(userId, options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        status = null, 
        type = null,
        currency = null,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options;

      let query = supabase
        .from('fund_transactions')
        .select('*')
        .eq('user_id', userId)
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);
      if (currency) query = query.eq('currency', currency);

      const { data, error } = await query;
      
      if (error) {
        console.error('Error finding transactions by user:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Transaction findByUser error:', error);
      return [];
    }
  },

  async create(transactionData) {
    try {
      const {
        user_id,
        currency,
        amount,
        type,
        status = 'pending',
        transaction_reference = null,
        blockchain_tx_hash = null,
        remark = null,
        admin_id = null,
        fee_amount = 0,
        fee_currency = null,
        balance_before = null,
        balance_after = null
      } = transactionData;

      // Validate required fields
      if (!user_id || !currency || !amount || !type) {
        throw new Error('Missing required transaction fields: user_id, currency, amount, type');
      }

      const { data, error } = await supabase
        .from('fund_transactions')
        .insert({
          user_id,
          currency,
          amount,
          type,
          status,
          transaction_reference,
          blockchain_tx_hash,
          remark,
          admin_id,
          fee_amount,
          fee_currency,
          balance_before,
          balance_after,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating transaction:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction create error:', error);
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('fund_transactions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating transaction:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction update error:', error);
      throw error;
    }
  },

  async updateStatus(id, status, processedBy = null, failureReason = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed' || status === 'failed') {
        updateData.processed_at = new Date().toISOString();
        updateData.processed_by = processedBy;
      }

      if (status === 'failed' && failureReason) {
        updateData.failure_reason = failureReason;
      }

      const { data, error } = await supabase
        .from('fund_transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating transaction status:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction updateStatus error:', error);
      throw error;
    }
  },

  async getTransactionsSummary(userId, dateRange = null) {
    try {
      let query = supabase
        .from('fund_transactions')
        .select('type, currency, amount, status')
        .eq('user_id', userId);

      if (dateRange && dateRange.start && dateRange.end) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error getting transaction summary:', error);
        throw error;
      }
      
      // Process summary data
      const summary = {
        total_deposits: 0,
        total_withdrawals: 0,
        pending_deposits: 0,
        pending_withdrawals: 0,
        completed_deposits: 0,
        completed_withdrawals: 0,
        by_currency: {}
      };

      data.forEach(tx => {
        const amount = parseFloat(tx.amount);
        
        // Initialize currency tracking
        if (!summary.by_currency[tx.currency]) {
          summary.by_currency[tx.currency] = {
            deposits: 0,
            withdrawals: 0,
            pending_deposits: 0,
            pending_withdrawals: 0
          };
        }

        // Normalize transaction type to lowercase for consistent processing
        const normalizedType = tx.type ? tx.type.toLowerCase() : '';
        
        if (normalizedType === 'deposit' || normalizedType === 'recharge') {
          summary.total_deposits += amount;
          summary.by_currency[tx.currency].deposits += amount;
          
          if (tx.status === 'pending' || tx.status === 'processing') {
            summary.pending_deposits += amount;
            summary.by_currency[tx.currency].pending_deposits += amount;
          } else if (tx.status === 'completed') {
            summary.completed_deposits += amount;
          }
        } else if (normalizedType === 'withdraw') {
          summary.total_withdrawals += amount;
          summary.by_currency[tx.currency].withdrawals += amount;
          
          if (tx.status === 'pending' || tx.status === 'processing') {
            summary.pending_withdrawals += amount;
            summary.by_currency[tx.currency].pending_withdrawals += amount;
          } else if (tx.status === 'completed') {
            summary.completed_withdrawals += amount;
          }
        }
      });
      
      return summary;
    } catch (error) {
      console.error('Transaction summary error:', error);
      return null;
    }
  },

  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('fund_transactions')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Transaction delete error:', error);
      throw error;
    }
  },

  // Admin functions
  async getAllTransactions(filters = {}, limit = 100, offset = 0) {
    try {
      let query = supabase
        .from('fund_transactions')
        .select(`
          *,
          users!fund_transactions_user_id_fkey(id, email, username, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply admin filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.currency) query = query.eq('currency', filters.currency);
      if (filters.user_id) query = query.eq('user_id', filters.user_id);
      if (filters.date_from) query = query.gte('created_at', filters.date_from);
      if (filters.date_to) query = query.lte('created_at', filters.date_to);

      const { data, error } = await query;
      
      if (error) {
        console.error('Error getting all transactions:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Transaction getAllTransactions error:', error);
      return [];
    }
  }
}; 