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
    const { depositId, reason } = req.body;

    // Validate required fields
    if (!depositId) {
      return res.status(400).json({ 
        error: 'Missing required field: depositId' 
      });
    }

    // Call backend monitoring service
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
    const response = await fetch(`${backendUrl}/api/deposits/stop-monitoring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ADMIN_API_KEY
      },
      body: JSON.stringify({
        depositId,
        reason: reason || 'Manual stop'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend service error' }));
      return res.status(response.status).json(errorData);
    }

    const result = await response.json();
    
    // Update deposit status
    const newStatus = reason === 'expired' ? 'expired' : 'cancelled';
    await supabase
      .from('crypto_deposits')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', depositId);

    res.status(200).json({
      success: true,
      message: 'Monitoring stopped successfully',
      depositId,
      newStatus,
      ...result
    });

  } catch (error) {
    console.error('Stop monitoring error:', error);
    res.status(500).json({ 
      error: 'Failed to stop monitoring',
      details: error.message 
    });
  }
}