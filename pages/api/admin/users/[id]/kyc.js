// Frontend API route to proxy admin KYC update requests to backend

export default async function handler(req, res) {
  console.log('🎯 [ID] KYC Route Hit - Method:', req.method, 'URL:', req.url);
  console.log('🎯 [ID] Query params:', req.query);
  
  // Only allow PATCH method for this route
  if (req.method !== 'PATCH') {
    console.log('❌ [ID] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { id } = req.query;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
    const targetUrl = `${backendUrl}/api/admin/users/${id}/kyc`;
    
    console.log('🔄 Proxying KYC update request:', req.method, req.url, '→', targetUrl);
    console.log('📋 Request body:', req.body);
    console.log('📋 Request ID:', id);
    
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
    
    console.log('📤 Headers being sent to backend:', requestOptions.headers);
    
    // Add body for PATCH requests
    if (req.method === 'PATCH' && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }
    
    // Forward the request to backend
    const response = await fetch(targetUrl, requestOptions);
    
    const data = await response.json();
    
    console.log('🔍 Backend response status:', response.status);
    console.log('📋 Backend response data:', data);
    
    // Forward the response status and data
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('❌ Proxy error for KYC update request:', error.message);
    res.status(500).json({
      ok: false,
      message: 'Proxy error: ' + error.message
    });
  }
}