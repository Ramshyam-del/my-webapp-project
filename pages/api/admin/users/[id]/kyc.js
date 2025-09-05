// Frontend API route to proxy admin KYC update requests to backend

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4001';
    const targetUrl = `${backendUrl}/api/admin/users/${id}/kyc`;
    
    console.log('🔄 Proxying KYC update request:', req.method, req.url, '→', targetUrl);
    
    // Forward the request to backend
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
       // Forward request body for PATCH requests
       ...(req.body && { body: JSON.stringify(req.body) })
     });
    
    const data = await response.json();
    
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