import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID from query params or headers (you may need to adjust this based on your auth setup)
    const userId = req.query.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch user's portfolio balances
    const { data: portfolios, error } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching portfolio balances:', error);
      return res.status(500).json({ error: 'Failed to fetch portfolio balances' });
    }

    // Calculate total balance across all currencies
    const totalBalance = portfolios.reduce((sum, portfolio) => sum + Number(portfolio.balance), 0);

    // Format the response
    const response = {
      totalBalance,
      currencies: portfolios.map(p => ({
        currency: p.currency,
        balance: Number(p.balance),
        updatedAt: p.updated_at
      })),
      summary: {
        totalCurrencies: portfolios.length,
        totalBalance,
        lastUpdated: portfolios.length > 0 ? Math.max(...portfolios.map(p => new Date(p.updated_at).getTime())) : null
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Portfolio balance API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
