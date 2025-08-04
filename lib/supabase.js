import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      
      if (error) {
        return { data: null, error }
      }

      // If signup successful and user is created, create profile in users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            username: userData.username || null,
            first_name: userData.first_name || null,
            last_name: userData.last_name || null,
            phone: userData.phone || null
          }])

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't fail the signup if profile creation fails
        }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error }
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    } catch (error) {
      return { user: null, error }
    }
  },

  // Get current session
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error }
    } catch (error) {
      return { session: null, error }
    }
  },

  // Get access token for API calls
  getAccessToken: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        return { token: null, error }
      }
      return { token: session.access_token, error: null }
    } catch (error) {
      return { token: null, error }
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database operations
export const db = {
  // Users
  createUser: async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  getUser: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  updateUser: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Transactions
  createTransaction: async (transactionData) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  getTransactions: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Trading Orders
  createOrder: async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('trading_orders')
        .insert([orderData])
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  getOrders: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('trading_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Notifications
  createNotification: async (notificationData) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  getNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Price Alerts
  createPriceAlert: async (alertData) => {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .insert([alertData])
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  getPriceAlerts: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Web Configuration
  getWebConfig: async () => {
    try {
      const { data, error } = await supabase
        .from('web_config')
        .select('*')
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  updateWebConfig: async (key, value) => {
    try {
      const { data, error } = await supabase
        .from('web_config')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// API helper for authenticated requests
export const api = {
  // Make authenticated API request
  request: async (endpoint, options = {}) => {
    try {
      const { token, error: tokenError } = await auth.getAccessToken()
      
      if (tokenError || !token) {
        return { data: null, error: 'Not authenticated' }
      }

      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: data.error || 'Request failed' }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Get user profile
  getUserProfile: async () => {
    return api.request('/user/profile')
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    return api.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  },

  // Get transactions
  getTransactions: async () => {
    return api.request('/user/transactions')
  },

  // Create transaction
  createTransaction: async (transactionData) => {
    return api.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    })
  },

  // Get notifications
  getNotifications: async () => {
    return api.request('/user/notifications')
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    return api.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
  }
}

// Real-time subscriptions
export const realtime = {
  subscribeToUserUpdates: (userId, callback) => {
    return supabase
      .channel('user_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, callback)
      .subscribe()
  },

  subscribeToNotifications: (userId, callback) => {
    return supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }
} 