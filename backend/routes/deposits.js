const express = require('express');
const CryptoMonitoringService = require('../services/cryptoMonitoringService');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize monitoring service
const monitoringService = new CryptoMonitoringService();

// Start the monitoring service when the module loads
monitoringService.start().catch(console.error);

// Middleware to verify admin API key
const verifyAdminKey = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Start monitoring for a specific deposit
router.post('/start-monitoring', verifyAdminKey, async (req, res) => {
  try {
    const { depositId } = req.body;
    
    if (!depositId) {
      return res.status(400).json({ error: 'Deposit ID is required' });
    }
    
    await monitoringService.monitorNewDeposit(depositId);
    
    res.json({ 
      success: true, 
      message: `Started monitoring deposit ${depositId}` 
    });
  } catch (error) {
    console.error('Error starting deposit monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

// Stop monitoring for a specific deposit
router.post('/stop-monitoring', verifyAdminKey, async (req, res) => {
  try {
    const { depositId } = req.body;
    
    if (!depositId) {
      return res.status(400).json({ error: 'Deposit ID is required' });
    }
    
    await monitoringService.stopMonitoringDeposit(depositId);
    
    res.json({ 
      success: true, 
      message: `Stopped monitoring deposit ${depositId}` 
    });
  } catch (error) {
    console.error('Error stopping deposit monitoring:', error);
    res.status(500).json({ error: 'Failed to stop monitoring' });
  }
});

// Get monitoring service status
router.get('/monitoring-status', verifyAdminKey, (req, res) => {
  try {
    const status = monitoringService.getMonitoringStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Get active deposits for a user
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { data: deposits, error } = await supabase
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'confirming', 'partial'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active deposits:', error);
      return res.status(500).json({ error: 'Failed to fetch deposits' });
    }
    
    res.json({ success: true, deposits });
  } catch (error) {
    console.error('Error fetching active deposits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deposit history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { data: deposits, error } = await supabase
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching deposit history:', error);
      return res.status(500).json({ error: 'Failed to fetch deposit history' });
    }
    
    res.json({ success: true, deposits });
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual trigger to check a specific deposit
router.post('/check-deposit', verifyAdminKey, async (req, res) => {
  try {
    const { depositId } = req.body;
    
    if (!depositId) {
      return res.status(400).json({ error: 'Deposit ID is required' });
    }
    
    await monitoringService.checkDepositStatus(depositId);
    
    res.json({ 
      success: true, 
      message: `Manually checked deposit ${depositId}` 
    });
  } catch (error) {
    console.error('Error checking deposit:', error);
    res.status(500).json({ error: 'Failed to check deposit' });
  }
});

// Update monitoring configuration
router.post('/update-config', verifyAdminKey, async (req, res) => {
  try {
    const { cryptoType, config } = req.body;
    
    if (!cryptoType || !config) {
      return res.status(400).json({ error: 'Crypto type and config are required' });
    }
    
    const { error } = await supabase
      .from('deposit_monitoring_config')
      .upsert({
        crypto_type: cryptoType,
        ...config,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error updating monitoring config:', error);
      return res.status(500).json({ error: 'Failed to update config' });
    }
    
    res.json({ 
      success: true, 
      message: `Updated monitoring config for ${cryptoType}` 
    });
  } catch (error) {
    console.error('Error updating monitoring config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, stopping monitoring service...');
  await monitoringService.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, stopping monitoring service...');
  await monitoringService.stop();
  process.exit(0);
});

module.exports = router;