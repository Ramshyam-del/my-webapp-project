import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, amount = 10000, currency = 'USDT' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Use the adjust_balance function to add test balance
    const { data: result, error } = await supabaseAdmin.rpc('adjust_balance', {
      p_user_id: userId,
      p_currency: currency,
      p_delta: amount
    });

    if (error) {
      console.error('Error adding test balance:', error);
      return res.status(500).json({ error: 'Failed to add test balance: ' + error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Added ${amount} ${currency} to user account`,
      data: result
    });

  } catch (error) {
    console.error('Add test balance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
