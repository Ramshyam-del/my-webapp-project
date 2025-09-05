import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch fund transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('fund_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (transactionsError) {
      console.error('Error fetching fund transactions:', transactionsError);
      return res.status(500).json({ error: 'Failed to fetch fund transactions' });
    }

    // Get unique user IDs from transactions
    const userIds = [...new Set(transactions.map(t => t.user_id).filter(Boolean))];
    
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
      }
    }

    // Format transactions for display
    const formattedTransactions = transactions.map(transaction => {
      const user = usersMap[transaction.user_id];
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
        createdBy: transaction.created_by
      };
    });

    // Calculate statistics
    const stats = {
      totalRecharges: formattedTransactions
        .filter(t => t.type === 'RECHARGE')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalWithdrawals: formattedTransactions
        .filter(t => t.type === 'WITHDRAW')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      pendingCount: formattedTransactions
        .filter(t => t.status === 'pending').length,
      completedCount: formattedTransactions
        .filter(t => t.status === 'completed').length
    };

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
    res.status(500).json({ error: 'Internal server error' });
  }
}