// Simple in-memory store so updates persist across requests during dev runtime
let adminConfigData = {
  telegram: '',
  whatsapp: '',
  email: '',
  address: '',
  mobile: '',
  title: 'Quantex',
  logo: '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg',
  favicon: '/uploads/2025059851ad8dd1115bc6055cc45d56.jpg'
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      res.status(200).json({
        success: true,
        data: adminConfigData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Admin config API error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin configuration',
        message: error.message
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { system_settings } = req.body || {};

      // Accept fields from system_settings and merge
      if (system_settings && typeof system_settings === 'object') {
        const { telegram, whatsapp, email, address, mobile, title, logo, favicon } = system_settings;
        adminConfigData = {
          ...adminConfigData,
          ...(telegram !== undefined ? { telegram } : {}),
          ...(whatsapp !== undefined ? { whatsapp } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(mobile !== undefined ? { mobile } : {}),
          ...(title !== undefined ? { title } : {}),
          ...(logo !== undefined ? { logo } : {}),
          ...(favicon !== undefined ? { favicon } : {})
        };
      }

      console.log('Admin config updated:', adminConfigData);

      res.status(200).json({
        success: true,
        data: adminConfigData,
        message: 'Admin configuration updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Admin config update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update admin configuration',
        message: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
