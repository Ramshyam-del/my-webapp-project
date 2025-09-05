const express = require('express');
const { authenticateUser, requireAdmin } = require('../middleware/requireAdmin');
const { serverSupabase } = require('../lib/supabaseServer');

const router = express.Router();

// GET /api/admin/user-activities - Get user activities with pagination
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 50, 
      userId, 
      activityType, 
      startDate, 
      endDate,
      userEmail 
    } = req.query;
    
    const offset = (page - 1) * pageSize;
    
    let query = serverSupabase
      .from('user_activities')
      .select(`
        id,
        user_id,
        user_email,
        activity_type,
        activity_description,
        ip_address,
        user_agent,
        metadata,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(pageSize) - 1);
    
    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (userEmail) {
      query = query.ilike('user_email', `%${userEmail}%`);
    }
    
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data: activities, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get total count for pagination
    let countQuery = serverSupabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true });
      
    if (userId) countQuery = countQuery.eq('user_id', userId);
    if (userEmail) countQuery = countQuery.ilike('user_email', `%${userEmail}%`);
    if (activityType) countQuery = countQuery.eq('activity_type', activityType);
    if (startDate) countQuery = countQuery.gte('created_at', startDate);
    if (endDate) countQuery = countQuery.lte('created_at', endDate);
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.warn('Count query error:', countError);
    }
    
    res.json({
      ok: true,
      data: {
        activities: activities || [],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('GET /api/admin/user-activities failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to fetch user activities'
    });
  }
});

// GET /api/admin/user-activities/recent - Get recent activities for live feed
router.get('/recent', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { limit = 20, since } = req.query;
    
    let query = serverSupabase
      .from('user_activities')
      .select(`
        id,
        user_id,
        user_email,
        activity_type,
        activity_description,
        ip_address,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    // If 'since' timestamp is provided, only get activities after that time
    if (since) {
      query = query.gt('created_at', since);
    }
    
    const { data: activities, error } = await query;
    
    if (error) {
      throw error;
    }
    
    res.json({
      ok: true,
      data: {
        activities: activities || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('GET /api/admin/user-activities/recent failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to fetch recent activities'
    });
  }
});

// POST /api/admin/user-activities - Create a new activity log (internal use)
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      user_email,
      activity_type,
      activity_description,
      ip_address,
      user_agent,
      metadata = {}
    } = req.body;
    
    if (!activity_type) {
      return res.status(400).json({
        ok: false,
        code: 'validation_error',
        message: 'activity_type is required'
      });
    }
    
    const { data: activity, error } = await serverSupabase
      .from('user_activities')
      .insert({
        user_id,
        user_email,
        activity_type,
        activity_description,
        ip_address,
        user_agent,
        metadata
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      ok: true,
      data: { activity }
    });
  } catch (error) {
    console.error('POST /api/admin/user-activities failed:', error);
    res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Failed to create activity log'
    });
  }
});

module.exports = router;