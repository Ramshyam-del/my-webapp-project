const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * OperationLog Model - Complete Supabase Implementation
 * Handles admin action logging with comprehensive CRUD operations
 */
module.exports = {
  /**
   * Find operation log by ID
   * @param {string} id - Operation log UUID
   * @returns {Object|null} Operation log data or null if not found
   */
  findById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('operation_logs')
        .select(`
          *,
          admin:admin_id(id, username, first_name, last_name),
          target_user:target_user_id(id, username, first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error finding operation log by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in findById:', error);
      return null;
    }
  },

  /**
   * Find operation logs by admin user ID
   * @param {string} adminId - Admin user UUID
   * @param {Object} options - Query options (limit, offset, orderBy)
   * @returns {Array} Array of operation logs
   */
  findByAdmin: async (adminId, options = {}) => {
    try {
      const { limit = 50, offset = 0, orderBy = 'created_at', order = 'desc' } = options;
      
      const { data, error } = await supabase
        .from('operation_logs')
        .select(`
          *,
          admin:admin_id(id, username, first_name, last_name),
          target_user:target_user_id(id, username, first_name, last_name)
        `)
        .eq('admin_id', adminId)
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error finding operation logs by admin:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in findByAdmin:', error);
      return [];
    }
  },

  /**
   * Find operation logs by target user
   * @param {string} targetUserId - Target user UUID
   * @param {Object} options - Query options
   * @returns {Array} Array of operation logs
   */
  findByTargetUser: async (targetUserId, options = {}) => {
    try {
      const { limit = 50, offset = 0, orderBy = 'created_at', order = 'desc' } = options;
      
      const { data, error } = await supabase
        .from('operation_logs')
        .select(`
          *,
          admin:admin_id(id, username, first_name, last_name),
          target_user:target_user_id(id, username, first_name, last_name)
        `)
        .eq('target_user_id', targetUserId)
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error finding operation logs by target user:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in findByTargetUser:', error);
      return [];
    }
  },

  /**
   * Find operation logs by type
   * @param {string} operationType - Operation type
   * @param {Object} options - Query options
   * @returns {Array} Array of operation logs
   */
  findByType: async (operationType, options = {}) => {
    try {
      const { limit = 50, offset = 0, orderBy = 'created_at', order = 'desc' } = options;
      
      const { data, error } = await supabase
        .from('operation_logs')
        .select(`
          *,
          admin:admin_id(id, username, first_name, last_name),
          target_user:target_user_id(id, username, first_name, last_name)
        `)
        .eq('operation_type', operationType)
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error finding operation logs by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in findByType:', error);
      return [];
    }
  },

  /**
   * Get all operation logs with advanced filtering
   * @param {Object} filters - Filter options
   * @param {Object} options - Query options
   * @returns {Object} Paginated operation logs with metadata
   */
  getAllLogs: async (filters = {}, options = {}) => {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        orderBy = 'created_at', 
        order = 'desc',
        startDate,
        endDate,
        adminId,
        targetUserId,
        operationType,
        success
      } = { ...filters, ...options };
      
      let query = supabase
        .from('operation_logs')
        .select(`
          *,
          admin:admin_id(id, username, first_name, last_name),
          target_user:target_user_id(id, username, first_name, last_name)
        `, { count: 'exact' });

      // Apply filters
      if (adminId) query = query.eq('admin_id', adminId);
      if (targetUserId) query = query.eq('target_user_id', targetUserId);
      if (operationType) query = query.eq('operation_type', operationType);
      if (success !== undefined) query = query.eq('success', success);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      // Apply ordering and pagination
      const { data, error, count } = await query
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting all operation logs:', error);
        return { logs: [], total: 0, hasMore: false };
      }

      return {
        logs: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Exception in getAllLogs:', error);
      return { logs: [], total: 0, hasMore: false };
    }
  },

  /**
   * Create new operation log
   * @param {Object} logData - Operation log data
   * @returns {Object|null} Created operation log or null on error
   */
  create: async (logData) => {
    try {
      const {
        admin_id,
        target_user_id,
        operation_type,
        operation_description,
        old_values = {},
        new_values = {},
        ip_address,
        user_agent,
        success = true,
        error_message,
        metadata = {}
      } = logData;

      // Validate required fields
      if (!admin_id || !operation_type || !operation_description) {
        console.error('Missing required fields for operation log creation');
        return null;
      }

      const { data, error } = await supabase
        .from('operation_logs')
        .insert({
          admin_id,
          target_user_id,
          operation_type,
          operation_description,
          old_values,
          new_values,
          ip_address,
          user_agent,
          success,
          error_message,
          metadata,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          admin:admin_id(id, username, first_name, last_name),
          target_user:target_user_id(id, username, first_name, last_name)
        `)
        .single();

      if (error) {
        console.error('Error creating operation log:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in create:', error);
      return null;
    }
  },

  /**
   * Update operation log (limited fields)
   * @param {string} id - Operation log UUID
   * @param {Object} updateData - Update data
   * @returns {Object|null} Updated operation log or null on error
   */
  update: async (id, updateData) => {
    try {
      // Only allow updating specific fields for audit integrity
      const allowedFields = ['metadata', 'error_message', 'success'];
      const filteredData = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        console.error('No valid fields to update in operation log');
        return null;
      }

      const { data, error } = await supabase
        .from('operation_logs')
        .update(filteredData)
        .eq('id', id)
        .select(`
          *,
          admin:admin_id(id, username, first_name, last_name),
          target_user:target_user_id(id, username, first_name, last_name)
        `)
        .single();

      if (error) {
        console.error('Error updating operation log:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in update:', error);
      return null;
    }
  },

  /**
   * Delete operation log (soft delete by marking as deleted)
   * @param {string} id - Operation log UUID
   * @returns {boolean} Success status
   */
  delete: async (id) => {
    try {
      // For audit integrity, we soft delete by updating metadata
      const { error } = await supabase
        .from('operation_logs')
        .update({ 
          metadata: { deleted: true, deleted_at: new Date().toISOString() }
        })
        .eq('id', id);

      if (error) {
        console.error('Error soft deleting operation log:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in delete:', error);
      return false;
    }
  },

  /**
   * Get operation log statistics
   * @param {Object} filters - Filter options
   * @returns {Object} Statistics data
   */
  getStatistics: async (filters = {}) => {
    try {
      const { startDate, endDate, adminId } = filters;
      
      let query = supabase
        .from('operation_logs')
        .select('operation_type, success', { count: 'exact' });

      if (adminId) query = query.eq('admin_id', adminId);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error getting operation log statistics:', error);
        return null;
      }

      // Process statistics
      const stats = {
        total: count || 0,
        successful: 0,
        failed: 0,
        byType: {}
      };

      if (data) {
        data.forEach(log => {
          if (log.success) {
            stats.successful++;
          } else {
            stats.failed++;
          }

          if (!stats.byType[log.operation_type]) {
            stats.byType[log.operation_type] = { total: 0, successful: 0, failed: 0 };
          }
          
          stats.byType[log.operation_type].total++;
          if (log.success) {
            stats.byType[log.operation_type].successful++;
          } else {
            stats.byType[log.operation_type].failed++;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Exception in getStatistics:', error);
      return null;
    }
  }
}; 