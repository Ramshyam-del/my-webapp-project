// Frontend API route to proxy admin withdrawal approval requests to backend

export default async function handler(req, res) {
  console.log('🎯 [WITHDRAWAL APPROVE] Route Hit - Method:', req.method, 'URL:', req.url);
  console.log('🎯 [WITHDRAWAL APPROVE] Query params:', req.query);
  
  // Only allow POST method for this route
  if (req.method !== 'POST') {
    console.log('❌ [WITHDRAWAL APPROVE] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { withdrawalId } = req.query;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
    const targetUrl = `${backendUrl}/api/admin/withdrawals/${withdrawalId}/approve`;
    
    console.log('🔄 Proxying withdrawal approval request:', req.method, req.url, '→', targetUrl);
    console.log('📋 Request body:', req.body);
    console.log('📋 Withdrawal ID:', withdrawalId);
    
    // Log authorization header
    console.log('🔑 Authorization header received:', req.headers.authorization ? 'Present' : 'Missing');
    if (req.headers.authorization) {
      console.log('🔑 Auth header preview:', req.headers.authorization.substring(0, 20) + '...');
    }
    
    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers: {
        // Forward authorization header
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Add body if present
    if (req.body && Object.keys(req.body).length > 0) {
      requestOptions.body = JSON.stringify(req.body);
      console.log('📤 Request body being sent:', requestOptions.body);
    }
    
    console.log('📤 Headers being sent to backend:', requestOptions.headers);
    
    // Forward the request to backend
    console.log('📤 [PROXY] Sending request to backend:', targetUrl);
    
    const response = await fetch(targetUrl, requestOptions);
    
    console.log('📥 [PROXY] Backend response status:', response.status);
    
    // Get response data
    const responseData = await response.json();
    console.log('📥 [PROXY] Backend response data:', responseData);
    
    // Forward the response
    res.status(response.status).json(responseData);
    
  } catch (error) {
    console.error('❌ [WITHDRAWAL APPROVE] Proxy error:', error);
    console.error('❌ [WITHDRAWAL APPROVE] Error stack:', error.stack);
    console.error('❌ [WITHDRAWAL APPROVE] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: error.cause
    });
    res.status(500).json({
      ok: false,
      code: 'proxy_error',
      message: 'Failed to proxy withdrawal approval request',
      error: error.message,
      details: error.stack
    });
  }
}