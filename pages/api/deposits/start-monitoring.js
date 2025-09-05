import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per 5 minutes per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  
  return true; // Request allowed
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Rate limiting check
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  try {
    const { depositId, cryptoType, walletAddress, expectedAmount } = req.body;

    // Validate required fields
    if (!depositId || !cryptoType || !walletAddress || !expectedAmount) {
      return res.status(400).json({ 
        error: 'Missing required fields: depositId, cryptoType, walletAddress, expectedAmount' 
      });
    }

    // Validate crypto type
    const validCryptoTypes = ['BTC', 'ETH', 'USDT'];
    if (!validCryptoTypes.includes(cryptoType.toUpperCase())) {
      return res.status(400).json({ 
        error: 'Invalid crypto type. Supported: BTC, ETH, USDT' 
      });
    }

    // Call backend monitoring service
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
    const response = await fetch(`${backendUrl}/api/deposits/start-monitoring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ADMIN_API_KEY
      },
      body: JSON.stringify({
        depositId,
        cryptoType: cryptoType.toUpperCase(),
        walletAddress,
        expectedAmount: parseFloat(expectedAmount)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Backend service error' }));
      return res.status(response.status).json(errorData);
    }

    const result = await response.json();
    
    // Update deposit status to monitoring
    await supabase
      .from('crypto_deposits')
      .update({ 
        status: 'monitoring',
        updated_at: new Date().toISOString()
      })
      .eq('id', depositId);

    res.status(200).json({
      success: true,
      message: 'Monitoring started successfully',
      depositId,
      ...result
    });

  } catch (error) {
    console.error('Start monitoring error:', error);
    res.status(500).json({ 
      error: 'Failed to start monitoring',
      details: error.message 
    });
  }
}