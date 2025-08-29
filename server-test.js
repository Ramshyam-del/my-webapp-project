// Simple server test to verify Supabase connection
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import node-fetch dynamically as it's ESM-only in v3
(async () => {
  try {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
    startServer();
  } catch (error) {
    console.error('Failed to import node-fetch:', error);
  }
})();

function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test endpoint
  app.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase.from('users').select('count');
      
      if (error) {
        console.error('Database query error:', error);
        return res.status(500).json({ error: 'Database connection error' });
      }
      
      res.json({
        status: 'success',
        message: 'Server is running and connected to Supabase',
        data
      });
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Test the connection by visiting the URL in your browser');
  });
}