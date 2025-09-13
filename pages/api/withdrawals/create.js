import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  console.log('=== Withdrawal API Called ===')
  console.log('Method:', req.method)
  console.log('Body:', req.body)
  console.log('Headers:', req.headers)
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, code: 'method_not_allowed', message: 'Method not allowed' })
    }

    // Get user token from Authorization header or cookie
    let token = null
    const authHeader = req.headers.authorization || ''
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      const cookie = req.headers.cookie || ''
      const m = cookie.match(/sb-access-token=([^;]+)/)
      if (m) token = decodeURIComponent(m[1])
    }

    if (!token) {
      return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Unauthorized' })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const { SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ ok: false, code: 'server_misconfig', message: 'Server misconfiguration' })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify user authentication
    const { data: authData, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !authData?.user) {
      return res.status(401).json({ ok: false, code: 'unauthorized', message: 'Unauthorized' })
    }

    const userId = authData.user.id
    const { currency, amount, wallet_address, network } = req.body

    // Validate required fields
    if (!currency || !amount || !wallet_address) {
      return res.status(400).json({
        ok: false,
        code: 'missing_fields',
        message: 'Missing required fields: currency, amount, wallet_address'
      })
    }

    // Set default network if not provided
    const withdrawalNetwork = network || 'ethereum'

    // Validate amount
    const withdrawalAmount = parseFloat(amount)
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ 
        ok: false, 
        code: 'validation_error', 
        message: 'Invalid withdrawal amount' 
      })
    }

    // Validate currency
    const validCurrencies = ['BTC', 'ETH', 'USDT']
    if (!validCurrencies.includes(currency.toUpperCase())) {
      return res.status(400).json({ 
        ok: false, 
        code: 'validation_error', 
        message: 'Invalid currency. Supported: BTC, ETH, USDT' 
      })
    }

    // Check user's balance
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('balance')
      .eq('user_id', userId)
      .eq('currency', currency.toUpperCase())
      .single()

    if (portfolioError || !portfolio) {
      return res.status(400).json({ 
        ok: false, 
        code: 'insufficient_balance', 
        message: 'Insufficient balance or currency not found' 
      })
    }

    const currentBalance = parseFloat(portfolio.balance)
    if (currentBalance < withdrawalAmount) {
      return res.status(400).json({ 
        ok: false, 
        code: 'insufficient_balance', 
        message: `Insufficient balance. Available: ${currentBalance} ${currency}` 
      })
    }

    // Get client IP address
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     'unknown'

    // Create withdrawal request (using minimal existing table schema)
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        currency: currency.toUpperCase(),
        amount: withdrawalAmount,
        wallet_address: wallet_address,
        status: 'pending'
      })
      .select('*')
      .single()

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError)
      return res.status(500).json({ 
        ok: false, 
        code: 'database_error', 
        message: 'Failed to create withdrawal request' 
      })
    }

    return res.status(201).json({
      ok: true,
      data: {
        id: withdrawal.id,
        currency: withdrawal.currency,
        amount: withdrawal.amount,
        wallet_address: withdrawal.wallet_address,
        status: withdrawal.status,
        created_at: withdrawal.created_at
      },
      message: 'Withdrawal request created successfully'
    })

  } catch (error) {
    console.error('Create withdrawal API error:', error)
    console.error('Error stack:', error.stack)
    console.error('Request body:', req.body)
    console.error('Request headers:', req.headers)
    return res.status(500).json({ 
      ok: false, 
      code: 'internal_error', 
      message: 'Internal server error: ' + error.message 
    })
  }
}