// Helper function to get CoinMarketCap image URLs for cryptocurrencies
// This provides a centralized way to get real cryptocurrency images

// Mapping of cryptocurrency symbols to their CoinMarketCap IDs
const COINMARKETCAP_IDS = {
  'BTC': '1',
  'ETH': '1027',
  'USDT': '825',
  'BNB': '1839',
  'USDC': '3408',
  'XRP': '52',
  'ADA': '2010',
  'SOL': '5426',
  'DOT': '6636',
  'DOGE': '74',
  'AVAX': '5805',
  'SHIB': '5994',
  'MATIC': '3890',
  'LTC': '2',
  'UNI': '7083',
  'LINK': '1975',
  'ATOM': '3794',
  'ETC': '1321',
  'XLM': '512',
  'BCH': '1831',
  'ALGO': '4030',
  'VET': '3077',
  'ICP': '8916',
  'FIL': '2280',
  'TRX': '1958',
  'HBAR': '4642',
  'EOS': '1765',
  'AAVE': '7278',
  'XTZ': '2011',
  'THETA': '2416',
  'COMP': '5692',
  'SNX': '2586',
  'YFI': '5864',
  'MANA': '1966',
  'SAND': '6210',
  'ENJ': '2130',
  'AXS': '6783',
  'GALA': '7080',
  'FLOW': '4558',
  'NEAR': '6535',
  'FTM': '3513',
  'ONE': '3945',
  'KSM': '5034',
  'ZIL': '2469',
  'ICX': '2099',
  'ONT': '2566',
  'NEO': '1376',
  'QTUM': '1684',
  'XVG': '693',
  'SC': '1042',
  'STEEM': '1230',
  'WAVES': '1274',
  'NXT': '66',
  'BCN': '372',
  'DGB': '109',
  'VTC': '99',
  'FTC': '8',
  'NVC': '40',
  'XPM': '51',
  'PPC': '5',
  'NMC': '3',
  'XMR': '328'
};

/**
 * Get CoinMarketCap image URL for a cryptocurrency symbol
 * @param {string} symbol - The cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param {number} size - Image size (default: 64)
 * @returns {string} - The CoinMarketCap image URL
 */
export const getCryptoImageUrl = (symbol, size = 64) => {
  const coinId = COINMARKETCAP_IDS[symbol.toUpperCase()];
  if (!coinId) {
    // Fallback to Bitcoin image if symbol not found
    return `https://s2.coinmarketcap.com/static/img/coins/${size}x${size}/1.png`;
  }
  return `https://s2.coinmarketcap.com/static/img/coins/${size}x${size}/${coinId}.png`;
};

/**
 * Get CoinMarketCap ID for a cryptocurrency symbol
 * @param {string} symbol - The cryptocurrency symbol
 * @returns {string} - The CoinMarketCap ID
 */
export const getCoinMarketCapId = (symbol) => {
  return COINMARKETCAP_IDS[symbol.toUpperCase()] || '1';
};

/**
 * Create a cryptocurrency object with real image URL
 * @param {string} symbol - The cryptocurrency symbol
 * @param {string} name - The cryptocurrency name
 * @param {string} id - The cryptocurrency ID (optional)
 * @returns {object} - Cryptocurrency object with real image
 */
export const createCryptoWithImage = (symbol, name, id = null) => {
  return {
    id: id || symbol.toLowerCase(),
    symbol: symbol.toUpperCase(),
    name,
    icon: getCryptoImageUrl(symbol)
  };
};

/**
 * Enhanced cryptocurrency list with real CoinMarketCap images
 */
export const CRYPTO_LIST_WITH_IMAGES = [
  createCryptoWithImage('BTC', 'Bitcoin', 'bitcoin'),
  createCryptoWithImage('ETH', 'Ethereum', 'ethereum'),
  createCryptoWithImage('USDT', 'Tether', 'tether'),
  createCryptoWithImage('BNB', 'BNB', 'binancecoin'),
  createCryptoWithImage('USDC', 'USD Coin', 'usd-coin'),
  createCryptoWithImage('XRP', 'XRP', 'xrp'),
  createCryptoWithImage('ADA', 'Cardano', 'cardano'),
  createCryptoWithImage('SOL', 'Solana', 'solana'),
  createCryptoWithImage('DOT', 'Polkadot', 'polkadot'),
  createCryptoWithImage('DOGE', 'Dogecoin', 'dogecoin'),
  createCryptoWithImage('AVAX', 'Avalanche', 'avalanche-2'),
  createCryptoWithImage('SHIB', 'Shiba Inu', 'shiba-inu'),
  createCryptoWithImage('MATIC', 'Polygon', 'polygon'),
  createCryptoWithImage('LTC', 'Litecoin', 'litecoin'),
  createCryptoWithImage('UNI', 'Uniswap', 'uniswap'),
  createCryptoWithImage('LINK', 'Chainlink', 'chainlink'),
  createCryptoWithImage('ATOM', 'Cosmos', 'cosmos'),
  createCryptoWithImage('ETC', 'Ethereum Classic', 'ethereum-classic'),
  createCryptoWithImage('XLM', 'Stellar', 'stellar'),
  createCryptoWithImage('BCH', 'Bitcoin Cash', 'bitcoin-cash'),
  createCryptoWithImage('ALGO', 'Algorand', 'algorand'),
  createCryptoWithImage('VET', 'VeChain', 'vechain'),
  createCryptoWithImage('ICP', 'Internet Computer', 'internet-computer'),
  createCryptoWithImage('FIL', 'Filecoin', 'filecoin'),
  createCryptoWithImage('TRX', 'TRON', 'tron'),
  createCryptoWithImage('HBAR', 'Hedera', 'hedera-hashgraph'),
  createCryptoWithImage('EOS', 'EOS', 'eos'),
  createCryptoWithImage('AAVE', 'Aave', 'aave'),
  createCryptoWithImage('XTZ', 'Tezos', 'tezos'),
  createCryptoWithImage('THETA', 'Theta Network', 'theta-token')
];

export default {
  getCryptoImageUrl,
  getCoinMarketCapId,
  createCryptoWithImage,
  CRYPTO_LIST_WITH_IMAGES
};