import { supabaseAdmin } from '../../../backend/lib/supabaseAdmin';
import { authenticateUser } from '../../../backend/middleware/authenticateUser';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use authentication middleware
  return new Promise((resolve) => {
    authenticateUser(req, res, async () => {
      try {
        const user = req.user;
        const { cryptoType, amount } = req.body;

        // Validate input
        if (!cryptoType || !amount) {
          res.status(400).json({ error: 'Missing required fields: cryptoType and amount' });
          return resolve();
        }

        if (!['BTC', 'ETH', 'USDT'].includes(cryptoType)) {
          res.status(400).json({ error: 'Invalid crypto type. Supported: BTC, ETH, USDT' });
          return resolve();
        }

        if (amount <= 0) {
          res.status(400).json({ error: 'Amount must be greater than 0' });
          return resolve();
        }

        // Check if user already has an active deposit for this crypto type
        const { data: existingDeposit } = await supabaseAdmin
          .from('crypto_deposits')
          .select('*')
          .eq('user_id', user.id)
          .eq('crypto_type', cryptoType)
          .in('status', ['pending', 'confirming', 'partial'])
          .single();

        if (existingDeposit) {
          res.status(200).json({
            success: true,
            data: {
              address: existingDeposit.wallet_address,
              qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${existingDeposit.wallet_address}`,
              network: getNetworkName(cryptoType),
              amount: existingDeposit.expected_amount,
              depositId: existingDeposit.id,
              status: existingDeposit.status,
              expiresAt: existingDeposit.expires_at
            },
            message: 'Using existing active deposit'
          });
          return resolve();
        }

        // Check if user has a reusable wallet address
        let walletAddress;
        const { data: existingAddress } = await supabaseAdmin
          .from('user_wallet_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('crypto_type', cryptoType)
          .eq('is_active', true)
          .single();

        if (existingAddress) {
          walletAddress = existingAddress.wallet_address;
        } else {
          // Generate new wallet address
          walletAddress = generateMockAddress(cryptoType);
          
          // Store the new wallet address
          const { error: addressError } = await supabaseAdmin
            .from('user_wallet_addresses')
            .insert({
              user_id: user.id,
              crypto_type: cryptoType,
              wallet_address: walletAddress,
              is_active: true
            });

          if (addressError) {
            console.error('Error storing wallet address:', addressError);
            res.status(500).json({ error: 'Failed to generate wallet address' });
            return resolve();
          }
        }

        // Get monitoring configuration
        const { data: config } = await supabaseAdmin
          .from('deposit_monitoring_config')
          .select('*')
          .eq('crypto_type', cryptoType)
          .single();

        const requiredConfirmations = config?.required_confirmations || 6;
        const expirationHours = config?.expiration_hours || 24;

        // Create deposit record
        const depositId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expirationHours);

        const { data: deposit, error: depositError } = await supabaseAdmin
          .from('crypto_deposits')
          .insert({
            id: depositId,
            user_id: user.id,
            crypto_type: cryptoType,
            wallet_address: walletAddress,
            expected_amount: amount,
            current_balance: 0,
            status: 'pending',
            required_confirmations: requiredConfirmations,
            confirmations: 0,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (depositError) {
          console.error('Error creating deposit:', depositError);
          res.status(500).json({ error: 'Failed to create deposit' });
          return resolve();
        }

        // Trigger monitoring for this deposit
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deposits/start-monitoring`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
            },
            body: JSON.stringify({ depositId })
          });

          if (!response.ok) {
            console.warn('Failed to start monitoring for deposit:', depositId);
          }
        } catch (error) {
          console.warn('Error starting deposit monitoring:', error);
        }

        res.status(200).json({
          success: true,
          data: {
            address: deposit.wallet_address,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${deposit.wallet_address}`,
            network: getNetworkName(cryptoType),
            amount: deposit.expected_amount,
            depositId: deposit.id,
            status: deposit.status,
            expiresAt: deposit.expires_at
          }
        });
        resolve();

      } catch (error) {
        console.error('Generate address API error:', error);
        res.status(500).json({ error: 'Internal server error' });
        resolve();
      }
    });
  });
};

// Helper function to get network name
function getNetworkName(cryptoType) {
  switch (cryptoType) {
    case 'BTC':
      return 'Bitcoin Network';
    case 'ETH':
      return 'Ethereum (ERC20)';
    case 'USDT':
      return 'Ethereum (ERC20)';
    default:
      return 'Unknown Network';
  }
}

// Mock address generation (replace with real wallet generation in production)
function generateMockAddress(cryptoType) {
  const seed = `${Date.now()}-${Math.random()}`;
  const hash = require('crypto').createHash('sha256').update(seed).digest('hex');
  
  switch (cryptoType) {
    case 'BTC':
      // Generate Bitcoin-like address
      return '1' + hash.substring(0, 33);
    case 'ETH':
    case 'USDT':
      // Generate Ethereum-like address
      return '0x' + hash.substring(0, 40);
    default:
      throw new Error(`Unsupported crypto type: ${cryptoType}`);
  }
}