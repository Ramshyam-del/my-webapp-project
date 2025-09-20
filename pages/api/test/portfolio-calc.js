export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test data from database
    const testPortfolio = {
      currencies: [
        { currency: 'BTC', balance: 0.25 },
        { currency: 'ETH', balance: 2.5 },
        { currency: 'USDT', balance: 500 }
      ]
    };

    // Test prices
    const testPrices = {
      BTC: 43250.75,
      ETH: 2650.30,
      USDT: 1.00
    };

    // Calculate total
    const total = testPortfolio.currencies.reduce((sum, currency) => {
      const balance = parseFloat(currency.balance) || 0;
      const price = testPrices[currency.currency] || 0;
      const value = balance * price;
      console.log(`${currency.currency}: ${balance} × ${price} = ${value}`);
      return sum + value;
    }, 0);

    console.log('Total calculated:', total);

    res.status(200).json({
      portfolio: testPortfolio,
      prices: testPrices,
      calculations: testPortfolio.currencies.map(currency => ({
        currency: currency.currency,
        balance: currency.balance,
        price: testPrices[currency.currency],
        value: currency.balance * testPrices[currency.currency]
      })),
      total: total
    });

  } catch (error) {
    console.error('Test calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}