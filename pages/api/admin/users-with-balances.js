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
    // Fetch all users with their basic information
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, username, created_at, status, role')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    // Fetch all portfolio balances
    const { data: portfolios, error: portfoliosError } = await supabaseAdmin
      .from('portfolios')
      .select('user_id, currency, balance, updated_at');

    if (portfoliosError) {
      console.error('Error fetching portfolios:', portfoliosError);
      return res.status(500).json({ error: 'Failed to fetch portfolios' });
    }

    // Fetch latest login activities for all users
    const { data: loginActivities, error: activitiesError } = await supabaseAdmin
      .from('user_activities')
      .select('user_id, ip_address, created_at')
      .eq('activity_type', 'login')
      .order('created_at', { ascending: false });

    if (activitiesError) {
      console.error('Error fetching login activities:', activitiesError);
      // Don't fail the request, just log the error
    }

    // Fetch all withdrawals to calculate total withdrawal amounts per user// Fetch all withdrawals from fund_transactions
    const { data: withdrawals, error: withdrawalsError } = await supabaseAdmin
      .from('fund_transactions')
      .select('user_id, amount, currency, status')
      .or('type.eq.withdraw,type.eq.WITHDRAW');
    if (withdrawalsError) {
      console.error('Error fetching withdrawals:', withdrawalsError);
      // Don't fail the request, just log the error
    }

    // Group portfolios by user_id
    const portfoliosByUser = {};
    portfolios.forEach(portfolio => {
      if (!portfoliosByUser[portfolio.user_id]) {
        portfoliosByUser[portfolio.user_id] = {};
      }
      portfoliosByUser[portfolio.user_id][portfolio.currency] = {
        balance: Number(portfolio.balance),
        updatedAt: portfolio.updated_at
      };
    });

    // Group latest login activities by user_id
    const latestLoginByUser = {};
    if (loginActivities) {
      loginActivities.forEach(activity => {
        if (!latestLoginByUser[activity.user_id]) {
          latestLoginByUser[activity.user_id] = {
            ip_address: activity.ip_address,
            login_time: activity.created_at
          };
        }
      });
    }

    // Calculate total withdrawals by user_id
    const withdrawalsByUser = {};
    if (withdrawals) {
      withdrawals.forEach(withdrawal => {
        if (!withdrawalsByUser[withdrawal.user_id]) {
          withdrawalsByUser[withdrawal.user_id] = {
            totalWithdrawals: 0,
            completedWithdrawals: 0,
            pendingWithdrawals: 0
          };
        }
        
        const amount = Math.abs(Number(withdrawal.amount || 0)); // Use absolute value for withdrawal amounts
        withdrawalsByUser[withdrawal.user_id].totalWithdrawals += amount;
        
        if (withdrawal.status === 'completed' || withdrawal.status === 'approved' || withdrawal.status === 'COMPLETED' || withdrawal.status === 'WITHDRAW') {
          withdrawalsByUser[withdrawal.user_id].completedWithdrawals += amount;
        } else if (withdrawal.status === 'pending' || withdrawal.status === 'PENDING') {
          withdrawalsByUser[withdrawal.user_id].pendingWithdrawals += amount;
        }
      });
    }

    // Combine users with their portfolio balances, login info, and withdrawal data
    const usersWithBalances = users.map(user => {
      const userPortfolios = portfoliosByUser[user.id] || {};
      const totalBalance = Object.values(userPortfolios).reduce((sum, portfolio) => sum + portfolio.balance, 0);
      const latestLogin = latestLoginByUser[user.id];
      const userWithdrawals = withdrawalsByUser[user.id] || { totalWithdrawals: 0, completedWithdrawals: 0, pendingWithdrawals: 0 };
      
      return {
        id: user.id,
        email: user.email,
        username: user.username || user.email?.split('@')[0] || 'Unknown',
        createdAt: user.created_at,
        status: user.status,
        role: user.role,
        portfolios: userPortfolios,
        totalBalance,
        // Withdrawal information
        totalWithdraw: userWithdrawals.completedWithdrawals,
        totalWithdrawals: userWithdrawals.totalWithdrawals,
        pendingWithdrawals: userWithdrawals.pendingWithdrawals,
        // Latest login information
        latestIpAddress: latestLogin?.ip_address || 'N/A',
        latestLoginTime: latestLogin?.login_time || user.created_at,
        // Format balances for display
        balances: {
          USDT: userPortfolios.USDT?.balance || 0,
          BTC: userPortfolios.BTC?.balance || 0,
          ETH: userPortfolios.ETH?.balance || 0,
          TRX: userPortfolios.TRX?.balance || 0,
          XRP: userPortfolios.XRP?.balance || 0
        }
      };
    });

    res.status(200).json({
      ok: true,
      data: {
        users: usersWithBalances,
        total: usersWithBalances.length
      }
    });

  } catch (error) {
    console.error('Users with balances API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}