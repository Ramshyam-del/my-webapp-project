// Frontend API route to proxy admin KYC requests to backend

export default async function handler(req, res) {
  console.log('🎯 [MAIN] KYC Route Hit - Method:', req.method, 'URL:', req.url);
  
  // Only allow GET method for this route
  if (req.method !== 'GET') {
    console.log('❌ [MAIN] Method not allowed:', req.method, '- This route is for GET only');
    return res.status(405).json({ error: 'Method not allowed - use /api/admin/users/[id]/kyc for PATCH' });
  }
  
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
    const targetUrl = `${backendUrl}/api/admin/users/kyc`;
    
    console.log('🔄 Proxying KYC request:', req.method, req.url, '→', targetUrl);
    
    // Forward the request to backend
    console.log('📤 [PROXY] Sending request to backend:', targetUrl);
    console.log('📋 [PROXY] Headers being sent:', JSON.stringify(req.headers, null, 2));
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // Forward all headers from the original request
        ...req.headers,
        // Ensure Content-Type is set
        'Content-Type': 'application/json',
        // Remove host header to avoid conflicts
        host: undefined
      },
      // Forward query parameters
      ...(req.method !== 'GET' && req.body && { body: JSON.stringify(req.body) })
    });
    
    console.log('📥 [PROXY] Backend response status:', response.status);
    console.log('📥 [PROXY] Backend response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    
    const data = await response.json();
    console.log('📄 [PROXY] Backend response data:', JSON.stringify(data, null, 2));
    
    // Forward the response status and data
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('❌ Proxy error for KYC request:', error.message);
    res.status(500).json({
      ok: false,
      message: 'Proxy error: ' + error.message
    });
  }
}