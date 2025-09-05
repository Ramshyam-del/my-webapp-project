import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';
import { authenticateUser } from '../../../backend/middleware/authenticateUser';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use authenticateUser as middleware
  authenticateUser(req, res, async () => {
    try {
      const user = req.user;
    const { depositId } = req.query;

    if (!depositId) {
      return res.status(400).json({ error: 'Deposit ID is required' });
    }

    // Fetch deposit details
    const { data: deposit, error } = await supabaseAdmin
      .from('crypto_deposits')
      .select('*')
      .eq('id', depositId)
      .eq('user_id', user.id) // Ensure user can only access their own deposits
      .single();

    if (error) {
      console.error('Error fetching deposit:', error);
      return res.status(500).json({ error: 'Failed to fetch deposit' });
    }

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Calculate progress percentage
    const progressPercentage = deposit.expected_amount > 0 
      ? Math.min((deposit.current_balance / deposit.expected_amount) * 100, 100)
      : 0;

    // Determine status message
    let statusMessage = '';
    switch (deposit.status) {
      case 'pending':
        statusMessage = 'Waiting for payment...';
        break;
      case 'partial':
        statusMessage = `Partial payment received (${deposit.current_balance}/${deposit.expected_amount} ${deposit.crypto_type})`;
        break;
      case 'confirming':
        statusMessage = `Payment received, confirming... (${deposit.confirmations}/${deposit.required_confirmations} confirmations)`;
        break;
      case 'completed':
        statusMessage = 'Payment completed successfully!';
        break;
      case 'failed':
        statusMessage = 'Payment failed';
        break;
      case 'expired':
        statusMessage = 'Payment expired';
        break;
      default:
        statusMessage = 'Unknown status';
    }

    // Create timeline events
    const timeline = [
      {
        id: 1,
        title: 'Deposit Created',
        description: `${deposit.crypto_type} deposit address generated`,
        timestamp: deposit.created_at,
        status: 'completed',
        icon: 'create'
      }
    ];

    if (deposit.current_balance > 0) {
      timeline.push({
        id: 2,
        title: 'Payment Detected',
        description: `Received ${deposit.current_balance} ${deposit.crypto_type}`,
        timestamp: deposit.first_seen_at || deposit.updated_at,
        status: 'completed',
        icon: 'payment'
      });
    }

    if (deposit.status === 'confirming' || deposit.status === 'completed') {
      timeline.push({
        id: 3,
        title: 'Confirming Transaction',
        description: `${deposit.confirmations}/${deposit.required_confirmations} confirmations`,
        timestamp: deposit.updated_at,
        status: deposit.status === 'completed' ? 'completed' : 'in_progress',
        icon: 'confirm'
      });
    }

    if (deposit.status === 'completed') {
      timeline.push({
        id: 4,
        title: 'Deposit Completed',
        description: 'Funds added to your account',
        timestamp: deposit.completed_at,
        status: 'completed',
        icon: 'success'
      });
    }

    // Check if deposit is expired
    const isExpired = new Date() > new Date(deposit.expires_at);
    const timeRemaining = isExpired ? 0 : new Date(deposit.expires_at) - new Date();

    res.status(200).json({
      success: true,
      deposit: {
        id: deposit.id,
        cryptoType: deposit.crypto_type,
        walletAddress: deposit.wallet_address,
        expectedAmount: deposit.expected_amount,
        currentBalance: deposit.current_balance,
        status: deposit.status,
        statusMessage,
        progressPercentage: Math.round(progressPercentage),
        requiredConfirmations: deposit.required_confirmations,
        confirmations: deposit.confirmations,
        transactionHash: deposit.transaction_hash,
        expiresAt: deposit.expires_at,
        timeRemaining: Math.max(0, timeRemaining),
        isExpired,
        createdAt: deposit.created_at,
        updatedAt: deposit.updated_at,
        completedAt: deposit.completed_at,
        timeline
      }
    });

    } catch (error) {
      console.error('Deposit status API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}