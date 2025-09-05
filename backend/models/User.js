"use strict";

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// User model with complete Supabase operations
module.exports = {
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  async findByEmail(email) {
    try {
      // Get from auth.users first
      const { data: authData, error: authError } = await supabase.auth.admin
        .listUsers();
      
      if (authError) throw authError;
      
      const authUser = authData.users.find(user => 
        user.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (!authUser) return null;
      
      // Get profile from public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') throw userError;
      
      return {
        ...authUser,
        profile: userData
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  async updateProfile(id, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async updateStatus(id, status, reason = null, adminId = null) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          status,
          status_changed_by: adminId,
          status_changed_at: new Date().toISOString(),
          status_change_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the status change
      await this.logActivity(id, 'account_status_changed', 
        `Status changed to ${status}`, adminId, {
          old_status: 'previous_status', // You might want to fetch this first
          new_status: status,
          reason
        });
      
      return data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  async logActivity(userId, activityType, description, adminUserId = null, metadata = {}) {
    try {
      // Get user email
      const { data: authUser, error: authError } = await supabase.auth.admin
        .getUserById(userId);
      
      if (authError) throw authError;
      
      const { data, error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          user_email: authUser.user.email,
          activity_type: activityType,
          activity_description: description,
          admin_user_id: adminUserId,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw - activity logging shouldn't break main operations
      return null;
    }
  },

  async getUserActivities(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  },

  async getUserPortfolios(userId) {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('currency');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
      return [];
    }
  },

  async canUserTrade(userId) {
    try {
      const { data, error } = await supabase
        .rpc('can_user_trade', { p_user_id: userId });
      
      if (error) throw error;
      return data[0] || { can_trade: false, reason: 'Unknown error' };
    } catch (error) {
      console.error('Error checking user trade permissions:', error);
      return { can_trade: false, reason: 'System error' };
    }
  },

  async getUsers(filters = {}, limit = 50, offset = 0) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Apply filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.role) query = query.eq('role', filters.role);
      if (filters.verification_level) query = query.eq('verification_level', filters.verification_level);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
}; 