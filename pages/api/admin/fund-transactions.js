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
    // Simple approach first - fetch transactions without strict auth for debugging
    console.log('Fetching fund transactions...');
    
    // Fetch fund transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('fund_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (transactionsError) {
      console.error('Error fetching fund transactions:', transactionsError);
      return res.status(500).json({ error: 'Failed to fetch fund transactions: ' + transactionsError.message });
    }

    console.log(`Found ${transactions.length} transactions in database`);

    // Get unique user IDs from transactions
    const userIds = [...new Set(transactions.map(t => t.user_id).filter(Boolean))];
    console.log('User IDs found:', userIds);
    
    // Fetch user information separately
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, username')
        .in('id', userIds);
      
      if (!usersError && users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
        console.log('Users map created for:', Object.keys(usersMap));
      } else {
        console.error('Error fetching users:', usersError);
      }
    }

    // Get admin user information for created_by field
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
        console.log('Admins map created for:', Object.keys(adminsMap));
      }
    }

    // Format transactions for display
    const formattedTransactions = transactions.map(transaction => {
      const user = usersMap[transaction.user_id];
      const adminUser = adminsMap[transaction.admin_id];
      
      return {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        status: transaction.status || 'completed',
        user: user?.email || 'Unknown User',
        username: user?.username || user?.email?.split('@')[0] || 'Unknown',
        date: transaction.created_at,
        remark: transaction.remark || '',
        createdBy: transaction.created_by,
        adminUser: adminUser?.email || 'System',
        adminId: transaction.admin_id
      };
    });

    console.log('Formatted transactions:', formattedTransactions.length);

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

    console.log('Stats calculated:', stats);
    
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