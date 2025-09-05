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
    const { currency, status, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = supabaseAdmin
      .from('crypto_deposits')
      .select(`
        id,
        currency,
        deposit_address,
        transaction_hash,
        amount,
        confirmations,
        required_confirmations,
        status,
        block_number,
        network,
        from_address,
        gas_fee,
        detected_at,
        confirmed_at,
        processed_at,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (currency) {
      query = query.eq('currency', currency);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: deposits, error: depositsError } = await query;

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError);
      return res.status(500).json({ error: 'Failed to fetch deposits' });
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('crypto_deposits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (currency) {
      countQuery = countQuery.eq('currency', currency);
    }
    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting deposits:', countError);
    }

    // Calculate statistics
    const stats = {
      total: deposits.length,
      pending: deposits.filter(d => d.status === 'pending').length,
      confirming: deposits.filter(d => d.status === 'confirming').length,
      completed: deposits.filter(d => d.status === 'completed').length,
      failed: deposits.filter(d => d.status === 'failed').length,
      totalAmount: deposits
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + parseFloat(d.amount), 0)
    };

    // Format deposits for frontend
    const formattedDeposits = deposits.map(deposit => ({
      id: deposit.id,
      currency: deposit.currency,
      amount: parseFloat(deposit.amount),
      status: deposit.status,
      confirmations: deposit.confirmations,
      requiredConfirmations: deposit.required_confirmations,
      transactionHash: deposit.transaction_hash,
      depositAddress: deposit.deposit_address,
      fromAddress: deposit.from_address,
      network: deposit.network,
      blockNumber: deposit.block_number,
      gasFee: parseFloat(deposit.gas_fee || 0),
      detectedAt: deposit.detected_at,
      confirmedAt: deposit.confirmed_at,
      processedAt: deposit.processed_at,
      createdAt: deposit.created_at,
      // Add blockchain explorer links
      explorerUrl: getExplorerUrl(deposit.network, deposit.transaction_hash),
      // Calculate progress percentage
      progressPercentage: Math.min(100, (deposit.confirmations / deposit.required_confirmations) * 100)
    }));

    res.status(200).json({
      success: true,
      data: {
        deposits: formattedDeposits,
        stats,
        pagination: {
          total: count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < (count || 0)
        }
      }
    });

    } catch (error) {
      console.error('Deposit history API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

function getExplorerUrl(network, txHash) {
  if (!txHash) return null;
  
  switch (network) {
    case 'bitcoin':
      return `https://blockstream.info/tx/${txHash}`;
    case 'ethereum':
      return `https://etherscan.io/tx/${txHash}`;
    default:
      return null;
  }
}