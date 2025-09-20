import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Fetch fund transactions with user information in a single query
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('fund_transactions')
      .select(`
        id,
        user_id,
        currency,
        amount,
        type,
        status,
        remark,
        admin_id,
        created_by,
        created_at,
        users!fund_transactions_user_id_fkey (
          id,
          email,
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (transactionsError) {
      console.error('Error fetching fund transactions:', transactionsError);
      return res.status(500).json({ error: 'Failed to fetch fund transactions: ' + transactionsError.message });
    }

    // Also get admin user information for created_by field
    const adminIds = [...new Set(transactions.map(t => t.admin_id).filter(Boolean))];
    let adminsMap = {};
    if (adminIds.length > 0) {
      const { data: admins, error: adminsError } = await supabaseAdmin
        .from('users')
        .select('id, email, username')
        .in('id', adminIds);
      
      if (!adminsError && admins) {
        adminsMap = admins.reduce((acc, admin) => {
          acc[admin.id] = admin;
          return acc;
        }, {});
      }
    }

    // Format transactions for display with comprehensive audit logging info
    const formattedTransactions = transactions.map(transaction => {
      const targetUser = transaction.users;
      const adminUser = adminsMap[transaction.admin_id];
      
      return {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        status: transaction.status || 'completed',
        user: targetUser?.email || 'Unknown User',
        username: targetUser?.username || targetUser?.email?.split('@')[0] || 'Unknown',
        date: transaction.created_at,
        remark: transaction.remark || '',
        createdBy: transaction.created_by,
        adminUser: adminUser?.email || 'System',
        adminId: transaction.admin_id
      };
    });

    // Calculate statistics
    const stats = {
      totalRecharges: formattedTransactions
        .filter(t => t.type === 'recharge')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalWithdrawals: formattedTransactions
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      pendingCount: formattedTransactions
        .filter(t => t.status === 'pending').length,
      completedCount: formattedTransactions
        .filter(t => t.status === 'completed').length
    };

    console.log(`Found ${formattedTransactions.length} fund transactions`);
    
    res.status(200).json({
      ok: true,
      data: {
        transactions: formattedTransactions,
        stats,
        total: formattedTransactions.length
      }
    });

  } catch (error) {
    console.error('Fund transactions API error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}