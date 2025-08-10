export { supabase } from './supabaseClient'

// Admin authentication utilities
export const adminAuth = {
  // Check if user is admin
  async isAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) return false
      return data?.role === 'admin'
    } catch {
      return false
    }
  },

  // Ensure admin user exists
  async ensureAdminUser(userId, email) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          role: 'admin',
          balance: 10000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
      
      return !error
    } catch {
      return false
    }
  },

  // Get user session with role check
  async getSessionWithRole() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) return { session: null, isAdmin: false }

      const isAdmin = await this.isAdmin(session.user.id)
      return { session, isAdmin }
    } catch {
      return { session: null, isAdmin: false }
    }
  }
}

// User management utilities
export const userUtils = {
  // Create or update user in database
  async ensureUser(userId, email, role = 'user') {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: email,
          role: role,
          balance: role === 'admin' ? 10000 : 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
      
      return !error
    } catch {
      return false
    }
  },

  // Get user balance
  async getUserBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single()
      
      if (error) return 0
      return data?.balance || 0
    } catch {
      return 0
    }
  }
}

// Trading utilities
export const tradingUtils = {
  // Place order with proper validation
  async placeOrder(orderData, session) {
    try {
      const response = await fetch('/api/trading/order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place order')
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  },

  // Get user orders
  async getUserOrders(session) {
    try {
      const response = await fetch('/api/trading/orders', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  }
} 