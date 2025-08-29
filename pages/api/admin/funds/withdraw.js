import { supabaseAdmin } from '../../../../backend/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, currency, amount, adminId } = req.body || {};
    const amt = Number(amount);
    
    if (!userId || !currency || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid input' });
    }

    // Get current portfolio balance
    const { data: pf, error: pfError } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', currency)
      .single();

    if (pfError || !pf) {
      return res.status(404).json({ ok: false, error: 'Portfolio not found' });
    }

    const currentBalance = Number(pf.balance);
    
    // Check if sufficient balance
    if (currentBalance < amt) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Insufficient balance',
        currentBalance,
        requestedAmount: amt
      });
    }

    // Update balance
    const newBalance = currentBalance - amt;
    const { error: updateError } = await supabaseAdmin
      .from('portfolios')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .eq('currency', currency);

    if (updateError) {
      console.error('Balance update error:', updateError);
      return res.status(500).json({ ok: false, error: 'Failed to update balance' });
    }

    // Record fund transaction
    const { error: txError } = await supabaseAdmin
      .from('fund_transactions')
      .insert({
        user_id: userId,
        currency,
        amount: -amt, // Negative for withdrawal
        type: 'WITHDRAW',
        created_by: adminId || 'admin'
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      // Don't fail the request if transaction logging fails
    }

    res.status(200).json({
      ok: true,
      data: {
        userId,
        currency,
        amount: amt,
        newBalance,
        previousBalance: currentBalance,
        transactionId: Date.now().toString()
      }
    });

  } catch (error) {
    console.error('Withdraw API error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
