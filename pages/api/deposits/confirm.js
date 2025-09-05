import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { depositId, transactionHash, actualAmount, confirmations } = req.body;

    // Validate required fields
    if (!depositId || !transactionHash || !actualAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: depositId, transactionHash, actualAmount' 
      });
    }

    // Get deposit details
    const { data: deposit, error: fetchError } = await supabase
      .from('crypto_deposits')
      .select('*')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check if deposit is in a valid state for confirmation
    if (!['pending', 'monitoring', 'partial'].includes(deposit.status)) {
      return res.status(400).json({ 
        error: `Cannot confirm deposit with status: ${deposit.status}` 
      });
    }

    // Determine new status based on amount
    const expectedAmount = parseFloat(deposit.expected_amount);
    const receivedAmount = parseFloat(actualAmount);
    let newStatus = 'confirmed';
    
    if (receivedAmount < expectedAmount * 0.95) { // Allow 5% tolerance
      newStatus = 'partial';
    } else if (receivedAmount >= expectedAmount) {
      newStatus = 'confirmed';
    }

    // Update deposit record
    const { error: updateError } = await supabase
      .from('crypto_deposits')
      .update({
        status: newStatus,
        transaction_hash: transactionHash,
        current_balance: receivedAmount,
        confirmations: confirmations || 0,
        confirmed_at: newStatus === 'confirmed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', depositId);

    if (updateError) {
      throw updateError;
    }

    // If confirmed, update user's fund balance
    if (newStatus === 'confirmed') {
      // Get user's current balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('fund_balance')
        .eq('id', deposit.user_id)
        .single();

      if (!userError && userData) {
        const currentBalance = parseFloat(userData.fund_balance || 0);
        const newBalance = currentBalance + receivedAmount;

        // Update user balance
        await supabase
          .from('users')
          .update({ fund_balance: newBalance })
          .eq('id', deposit.user_id);

        // Create fund transaction record
        await supabase
          .from('fund_transactions')
          .insert({
            user_id: deposit.user_id,
            type: 'deposit',
            amount: receivedAmount,
            status: 'completed',
            description: `Crypto deposit confirmed - ${deposit.crypto_type}`,
            transaction_hash: transactionHash,
            created_at: new Date().toISOString()
          });
      }

      // Stop monitoring since deposit is confirmed
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
        await fetch(`${backendUrl}/api/deposits/stop-monitoring`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ADMIN_API_KEY
          },
          body: JSON.stringify({
            depositId,
            reason: 'confirmed'
          })
        });
      } catch (monitoringError) {
        console.error('Failed to stop monitoring:', monitoringError);
        // Don't fail the confirmation if monitoring stop fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Deposit ${newStatus}`,
      depositId,
      status: newStatus,
      transactionHash,
      actualAmount: receivedAmount,
      expectedAmount,
      confirmations: confirmations || 0
    });

  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm deposit',
      details: error.message 
    });
  }
}