import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug supabaseAdmin initialization
    console.log('🔍 [API] supabaseAdmin status:', supabaseAdmin ? 'initialized' : 'null');
    console.log('🔍 [API] Environment check:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing'
    });
    
    if (!supabaseAdmin) {
      console.error('❌ [API] supabaseAdmin is null - missing environment variables');
      return res.status(500).json({ error: 'Database configuration error' });
    }
    
    // Get user ID from query params or headers (you may need to adjust this based on your auth setup)
    const userId = req.query.userId || req.headers['x-user-id'];
    
    console.log('🔍 [API] Balance API called with userId:', userId);
    console.log('🔍 [API] Query params:', req.query);
    console.log('🔍 [API] Headers x-user-id:', req.headers['x-user-id']);
    
    if (!userId) {
      console.log('❌ [API] No user ID provided');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch user's portfolio balances
    console.log('🔍 [API] Querying portfolios table for user_id:', userId);
    const { data: portfolios, error } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔍 [API] Supabase query result:', { portfolios, error });

    if (error) {
      console.error('Error fetching portfolio balances:', error);
      return res.status(500).json({ error: 'Failed to fetch portfolio balances' });
    }

    // Calculate total balance across all currencies
    const totalBalance = portfolios.reduce((sum, portfolio) => sum + Number(portfolio.balance), 0);
    console.log('🔍 [API] Calculated total balance:', totalBalance);

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
    
    console.log('🔍 [API] Final response:', JSON.stringify(response, null, 2));
    res.status(200).json(response);

  } catch (error) {
    console.error('Portfolio balance API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
