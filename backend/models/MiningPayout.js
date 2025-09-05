const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * MiningPayout Model - Complete Supabase Implementation
 * Handles cryptocurrency mining payout operations with comprehensive CRUD operations
 */
module.exports = {
  /**
   * Find mining payout by ID
   * @param {string} id - Mining payout UUID
   * @returns {Object|null} Mining payout data or null if not found
   */
  findById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('mining_payouts')
        .select(`
          *,
          user:user_id(id, username, first_name, last_name),
          transaction:transaction_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error finding mining payout by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in findById:', error);
      return null;
    }
  },

  /**
   * Find mining payouts by user ID
   * @param {string} userId - User UUID
   * @param {Object} options - Query options (limit, offset, currency, status)
   * @returns {Array} Array of mining payouts
   */
  findByUser: async (userId, options = {}) => {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        currency, 
        status, 
        orderBy = 'created_at', 
        order = 'desc',
        startDate,
        endDate
      } = options;
      
      let query = supabase
        .from('mining_payouts')
        .select(`
          *,
          user:user_id(id, username, first_name, last_name),
          transaction:transaction_id(*)
        `)
        .eq('user_id', userId);

      // Apply filters
      if (currency) query = query.eq('currency', currency);
      if (status) query = query.eq('status', status);
      if (startDate) query = query.gte('payout_date', startDate);
      if (endDate) query = query.lte('payout_date', endDate);

      const { data, error } = await query
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error finding mining payouts by user:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in findByUser:', error);
      return [];
    }
  },

  /**
   * Find mining payouts by currency
   * @param {string} currency - Currency code (BTC, ETH, USDT)
   * @param {Object} options - Query options
   * @returns {Array} Array of mining payouts
   */
  findByCurrency: async (currency, options = {}) => {
    try {
      const { limit = 100, offset = 0, status, orderBy = 'created_at', order = 'desc' } = options;
      
      let query = supabase
        .from('mining_payouts')
        .select(`
          *,
          user:user_id(id, username, first_name, last_name),
          transaction:transaction_id(*)
        `)
        .eq('currency', currency);

      if (status) query = query.eq('status', status);

      const { data, error } = await query
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error finding mining payouts by currency:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in findByCurrency:', error);
      return [];
    }
  },

  /**
   * Find mining payouts by date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @param {Object} options - Query options
   * @returns {Array} Array of mining payouts
   */
  findByDateRange: async (startDate, endDate, options = {}) => {
    try {
      const { limit = 100, offset = 0, currency, status, orderBy = 'payout_date', order = 'desc' } = options;
      
      let query = supabase
        .from('mining_payouts')
        .select(`
          *,
          user:user_id(id, username, first_name, last_name),
          transaction:transaction_id(*)
        `)
        .gte('payout_date', startDate)
        .lte('payout_date', endDate);

      if (currency) query = query.eq('currency', currency);
      if (status) query = query.eq('status', status);

      const { data, error } = await query
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error finding mining payouts by date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in findByDateRange:', error);
      return [];
    }
  },

  /**
   * Get all mining payouts with advanced filtering (Admin)
   * @param {Object} filters - Filter options
   * @param {Object} options - Query options
   * @returns {Object} Paginated mining payouts with metadata
   */
  getAllPayouts: async (filters = {}, options = {}) => {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        orderBy = 'created_at', 
        order = 'desc',
        userId,
        currency,
        status,
        startDate,
        endDate,
        miningPool
      } = { ...filters, ...options };
      
      let query = supabase
        .from('mining_payouts')
        .select(`
          *,
          user:user_id(id, username, first_name, last_name),
          transaction:transaction_id(*)
        `, { count: 'exact' });

      // Apply filters
      if (userId) query = query.eq('user_id', userId);
      if (currency) query = query.eq('currency', currency);
      if (status) query = query.eq('status', status);
      if (miningPool) query = query.eq('mining_pool', miningPool);
      if (startDate) query = query.gte('payout_date', startDate);
      if (endDate) query = query.lte('payout_date', endDate);

      // Apply ordering and pagination
      const { data, error, count } = await query
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting all mining payouts:', error);
        return { payouts: [], total: 0, hasMore: false };
      }

      return {
        payouts: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Exception in getAllPayouts:', error);
      return { payouts: [], total: 0, hasMore: false };
    }
  },

  /**
   * Create new mining payout
   * @param {Object} payoutData - Mining payout data
   * @returns {Object|null} Created mining payout or null on error
   */
  create: async (payoutData) => {
    try {
      const {
        user_id,
        currency,
        amount,
        hash_rate,
        duration_hours,
        payout_rate,
        status = 'pending',
        mining_pool,
        block_height,
        difficulty,
        network_hash_rate,
        payout_date,
        metadata = {}
      } = payoutData;

      // Validate required fields
      if (!user_id || !currency || !amount || !payout_date) {
        console.error('Missing required fields for mining payout creation');
        return null;
      }

      // Validate amount is positive
      if (parseFloat(amount) <= 0) {
        console.error('Mining payout amount must be positive');
        return null;
      }

      const { data, error } = await supabase
        .from('mining_payouts')
        .insert({
          user_id,
          currency,
          amount: parseFloat(amount),
          hash_rate: hash_rate ? parseFloat(hash_rate) : null,
          duration_hours: duration_hours ? parseInt(duration_hours) : null,
          payout_rate: payout_rate ? parseFloat(payout_rate) : null,
          status,
          mining_pool,
          block_height: block_height ? parseInt(block_height) : null,
          difficulty: difficulty ? parseFloat(difficulty) : null,
          network_hash_rate: network_hash_rate ? parseFloat(network_hash_rate) : null,
          payout_date,
          metadata,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          user:user_id(id, username, first_name, last_name)
        `)
        .single();

      if (error) {
        console.error('Error creating mining payout:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in create:', error);
      return null;
    }
  },

  /**
   * Update mining payout
   * @param {string} id - Mining payout UUID
   * @param {Object} updateData - Update data
   * @returns {Object|null} Updated mining payout or null on error
   */
  update: async (id, updateData) => {
    try {
      // Filter allowed update fields
      const allowedFields = [
        'status', 'transaction_id', 'processed_at', 'metadata',
        'block_height', 'difficulty', 'network_hash_rate'
      ];
      
      const filteredData = {};
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        console.error('No valid fields to update in mining payout');
        return null;
      }

      // Add updated_at timestamp
      filteredData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('mining_payouts')
        .update(filteredData)
        .eq('id', id)
        .select(`
          *,
          user:user_id(id, username, first_name, last_name),
          transaction:transaction_id(*)
        `)
        .single();

      if (error) {
        console.error('Error updating mining payout:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in update:', error);
      return null;
    }
  },

  /**
   * Update mining payout status
   * @param {string} id - Mining payout UUID
   * @param {string} status - New status
   * @param {string} transactionId - Optional transaction ID for completed payouts
   * @returns {Object|null} Updated mining payout or null on error
   */
  updateStatus: async (id, status, transactionId = null) => {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed' && transactionId) {
        updateData.transaction_id = transactionId;
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('mining_payouts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          user:user_id(id, username, first_name, last_name),
          transaction:transaction_id(*)
        `)
        .single();

      if (error) {
        console.error('Error updating mining payout status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in updateStatus:', error);
      return null;
    }
  },

  /**
   * Delete mining payout
   * @param {string} id - Mining payout UUID
   * @returns {boolean} Success status
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('mining_payouts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting mining payout:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in delete:', error);
      return false;
    }
  },

  /**
   * Get mining payout statistics
   * @param {Object} filters - Filter options (userId, currency, dateRange)
   * @returns {Object} Statistics data
   */
  getStatistics: async (filters = {}) => {
    try {
      const { userId, currency, startDate, endDate } = filters;
      
      let query = supabase
        .from('mining_payouts')
        .select('currency, amount, status, payout_date', { count: 'exact' });

      if (userId) query = query.eq('user_id', userId);
      if (currency) query = query.eq('currency', currency);
      if (startDate) query = query.gte('payout_date', startDate);
      if (endDate) query = query.lte('payout_date', endDate);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error getting mining payout statistics:', error);
        return null;
      }

      // Process statistics
      const stats = {
        total: count || 0,
        totalAmount: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        byCurrency: {}
      };

      if (data) {
        data.forEach(payout => {
          // Status counts
          if (payout.status === 'completed') stats.completed++;
          else if (payout.status === 'pending' || payout.status === 'processing') stats.pending++;
          else if (payout.status === 'failed') stats.failed++;

          // Total amount (only for completed payouts)
          if (payout.status === 'completed') {
            stats.totalAmount += parseFloat(payout.amount) || 0;
          }

          // By currency
          if (!stats.byCurrency[payout.currency]) {
            stats.byCurrency[payout.currency] = {
              total: 0,
              totalAmount: 0,
              completed: 0,
              pending: 0,
              failed: 0
            };
          }
          
          stats.byCurrency[payout.currency].total++;
          if (payout.status === 'completed') {
            stats.byCurrency[payout.currency].completed++;
            stats.byCurrency[payout.currency].totalAmount += parseFloat(payout.amount) || 0;
          } else if (payout.status === 'pending' || payout.status === 'processing') {
            stats.byCurrency[payout.currency].pending++;
          } else if (payout.status === 'failed') {
            stats.byCurrency[payout.currency].failed++;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Exception in getStatistics:', error);
      return null;
    }
  },

  /**
   * Get pending mining payouts for processing
   * @param {Object} options - Query options
   * @returns {Array} Array of pending mining payouts
   */
  getPendingPayouts: async (options = {}) => {
    try {
      const { limit = 100, currency, miningPool } = options;
      
      let query = supabase
        .from('mining_payouts')
        .select(`
          *,
          user:user_id(id, username, first_name, last_name)
        `)
        .eq('status', 'pending');

      if (currency) query = query.eq('currency', currency);
      if (miningPool) query = query.eq('mining_pool', miningPool);

      const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error getting pending mining payouts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getPendingPayouts:', error);
      return [];
    }
  }
}; 