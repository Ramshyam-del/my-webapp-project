import { supabase } from '../../../lib/supabaseAdmin';

// This endpoint can be called periodically to run maintenance tasks
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access or use a secret key for security
    const { authorization } = req.headers;
    const secretKey = process.env.SCHEDULER_SECRET_KEY || 'default-scheduler-key';
    
    if (!authorization || authorization !== `Bearer ${secretKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Running scheduled trading maintenance tasks...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tasks: []
    };

    // Task 1: Auto-expire trades
    try {
      console.log('Running auto-expire trades task...');
      
      const expireResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/trading/auto-expire-trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const expireResult = await expireResponse.json();
      
      results.tasks.push({
        name: 'auto-expire-trades',
        success: expireResponse.ok,
        result: expireResult,
        timestamp: new Date().toISOString()
      });
      
      console.log('Auto-expire trades task completed:', expireResult);
      
    } catch (error) {
      console.error('Error in auto-expire trades task:', error);
      results.tasks.push({
        name: 'auto-expire-trades',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Task 2: Clean up old completed trades (optional)
    try {
      console.log('Running cleanup old trades task...');
      
      // Delete trades older than 30 days that are completed
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: deletedTrades, error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('status', 'completed')
        .lt('created_at', thirtyDaysAgo.toISOString());
      
      if (deleteError) {
        throw deleteError;
      }
      
      results.tasks.push({
        name: 'cleanup-old-trades',
        success: true,
        result: { message: 'Old trades cleaned up successfully' },
        timestamp: new Date().toISOString()
      });
      
      console.log('Cleanup old trades task completed');
      
    } catch (error) {
      console.error('Error in cleanup old trades task:', error);
      results.tasks.push({
        name: 'cleanup-old-trades',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Task 3: Update trade statistics (optional)
    try {
      console.log('Running update statistics task...');
      
      // Get some basic statistics
      const { data: stats, error: statsError } = await supabase
        .from('trades')
        .select('status, trade_result')
        .not('trade_result', 'is', null);
      
      if (statsError) {
        throw statsError;
      }
      
      const statistics = {
        total: stats.length,
        wins: stats.filter(t => t.trade_result === 'win').length,
        losses: stats.filter(t => t.trade_result === 'loss').length,
        completed: stats.filter(t => t.status === 'completed').length
      };
      
      results.tasks.push({
        name: 'update-statistics',
        success: true,
        result: { statistics },
        timestamp: new Date().toISOString()
      });
      
      console.log('Update statistics task completed:', statistics);
      
    } catch (error) {
      console.error('Error in update statistics task:', error);
      results.tasks.push({
        name: 'update-statistics',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    console.log('All scheduled tasks completed');
    
    return res.status(200).json({
      success: true,
      message: 'Scheduled tasks completed',
      results: results
    });

  } catch (error) {
    console.error('Scheduler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
