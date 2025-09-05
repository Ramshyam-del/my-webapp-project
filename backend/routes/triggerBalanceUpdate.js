const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// Middleware to verify service role key
const verifyServiceRole = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(401).json({ error: 'Invalid service role key' });
  }

  next();
};

// Trigger balance update for a specific user
router.post('/trigger-balance-update', verifyServiceRole, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get the real-time balance service instance
    const app = req.app;
    const realTimeBalanceService = app.realTimeBalanceService;
    
    if (!realTimeBalanceService) {
      console.error('Real-time balance service not available');
      return res.status(500).json({ error: 'Real-time service not available' });
    }

    // Manually trigger balance update
    await realTimeBalanceService.sendCurrentBalance(userId);
    
    console.log('Manual balance update triggered for user:', userId);
    res.json({ ok: true, message: 'Balance update triggered successfully' });
    
  } catch (error) {
    console.error('Error triggering balance update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;