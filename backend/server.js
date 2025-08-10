require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodeFetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const Configuration = require('./models/Configuration');

const app = express();
const PORT = process.env.BACKEND_PORT || 4001;

/** ───────── Supabase (server) ───────── **/
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** ───────── Security / middleware ───────── **/
app.use((req, _res, next) => { console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`); next(); });
app.use(helmet({ contentSecurityPolicy: false }));
app.set('trust proxy', 1);
app.use(cors({
  origin: (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000']).map(o => o.trim()),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

/** ───────── Helpers ───────── **/
const _fetch = globalThis.fetch ?? nodeFetch;
function fetchWithTimeout(url, opts = {}, ms = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    _fetch(url, opts).then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
  });
}
// Only these four symbols are served
const ALLOWED = ['BTC', 'ETH', 'XRP', 'TRX'];
const ID_BY_SYMBOL = { BTC: 'bitcoin', ETH: 'ethereum', XRP: 'ripple', TRX: 'tron' };

/** Simple in-memory cache */
const CACHE_TTL_MS = Number(process.env.MARKET_TTL_MS || 60_000);
let marketCache = { ts: 0, data: null };      // cache for /api/crypto/top-all
let priceCache = new Map();                   // per-symbol cache

/** Provider: CoinGecko (no API key, reliable) */
async function fetchMarketFromCoinGecko() {
  const ids = Object.values(ID_BY_SYMBOL).join(',');
  const url =
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}` +
    `&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

  const res = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Quantex-Market/1.0' }
  }, 8000);

  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const j = await res.json();

  // Normalize to the shape your frontend expects
  const rows = [
    { symbol: 'BTC', name: 'Bitcoin'  , j: j.bitcoin  },
    { symbol: 'ETH', name: 'Ethereum' , j: j.ethereum },
    { symbol: 'XRP', name: 'XRP'      , j: j.ripple   },
    { symbol: 'TRX', name: 'TRON'     , j: j.tron     }
  ].map(r => ({
    symbol: r.symbol,
    name: r.name,
    price: Number(r.j?.usd ?? 0),
    change: Number(r.j?.usd_24h_change ?? 0),
    market_cap: Number(r.j?.usd_market_cap ?? 0),
    volume_24h: Number(r.j?.usd_24h_vol ?? 0),
  }));

  // Basic sanity: all 4 present with price>0
  if (rows.some(x => !x.price || x.price <= 0)) {
    throw new Error('coingecko returned invalid prices');
  }
  return rows;
}

/** Fallback constants used if provider fails */
const FALLBACK = {
  BTC: { symbol: 'BTC', name: 'Bitcoin',  price: 43250.5, change: 2.45, market_cap: 8.5e11, volume_24h: 2.8e10 },
  ETH: { symbol: 'ETH', name: 'Ethereum', price: 2650.7, change: 1.87, market_cap: 3.2e11, volume_24h: 1.6e10 },
  XRP: { symbol: 'XRP', name: 'XRP',      price: 0.524,  change: 1.23, market_cap: 2.8e10, volume_24h: 1.2e9  },
  TRX: { symbol: 'TRX', name: 'TRON',     price: 0.089,  change: 0.78, market_cap: 8.0e9,  volume_24h: 4.5e8  },
};
function jitter(v, pct = 0.001) { return v * (1 + (Math.random() - 0.5) * 2 * pct); }

/** Build fallback array */
function fallbackRows() {
  return ['BTC','ETH','XRP','TRX'].map(s => {
    const r = FALLBACK[s];
    return {
      symbol: s,
      name: r.name,
      price: Number(jitter(r.price)).toFixed(2) * 1,
      change: r.change,
      market_cap: r.market_cap,
      volume_24h: r.volume_24h,
      source: 'fallback'
    };
  });
}

/** ───────── Auth ───────── **/
const authenticateUser = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization || '';
    if (!hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const token = hdr.slice(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // ensure row in public.users
    const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).single();
    if (!existing) {
      const { error: insErr } = await supabase.from('users').insert({
        id: user.id, email: user.email, role: 'user', status: 'active',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      });
      if (insErr) console.warn('users upsert warn:', insErr.message);
    }

    req.user = user;
    next();
  } catch (e) {
    console.error('Auth middleware error:', e);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
const requireAdmin = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('users').select('role').eq('id', req.user.id).single();
    if (error || data?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (e) {
    console.error('Admin check error:', e);
    res.status(500).json({ error: 'Admin verification failed' });
  }
};

/** ───────── Health ───────── **/
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

/** ───────── Admin identity used by frontend ───────── **/
app.get('/api/admin/me', authenticateUser, requireAdmin, (req, res) => {
  res.json({ ok: true, user: { id: req.user.id, email: req.user.email, role: 'admin' } });
});

/** ───────── User profile (kept) ───────── **/
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    console.error('Profile error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.put('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const patch = (({ username, first_name, last_name, phone }) => ({ username, first_name, last_name, phone }))(req.body || {});
    patch.updated_at = new Date().toISOString();
    const { data: user, error } = await supabase.from('users').update(patch).eq('id', req.user.id).select().single();
    if (error) return res.status(500).json({ error: 'Failed to update profile' });
    res.json({ message: 'Profile updated', user });
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** ───────── MARKET ENDPOINTS (robust + cached) ───────── **/

// 1) Summary for the four coins your UI reads (keeps old path):
app.get('/api/crypto/top-all', async (_req, res) => {
  try {
    // serve from cache if fresh
    if (marketCache.data && Date.now() - marketCache.ts < CACHE_TTL_MS) {
      return res.json({ data: marketCache.data, source: 'cache', timestamp: new Date().toISOString() });
    }

    let rows;
    try {
      rows = await fetchMarketFromCoinGecko();
    } catch (e) {
      console.warn('Market provider failed, using fallback:', e.message);
      rows = fallbackRows();
    }

    // cache it
    marketCache = { ts: Date.now(), data: rows };
    res.json({ data: rows, source: rows[0]?.source || 'coingecko', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('top-all error:', e);
    res.json({ data: fallbackRows(), source: 'fallback', timestamp: new Date().toISOString() });
  }
});

// 2) Single price endpoint (optional but handy)
app.get('/api/trading/price/:symbol', async (req, res) => {
  try {
    const raw = (req.params.symbol || '').toUpperCase().replace('USDT','');
    const symbol = ALLOWED.includes(raw) ? raw : null;
    if (!symbol) return res.status(400).json({ error: 'Unsupported symbol' });

    // use cached summary if available
    if (marketCache.data && Date.now() - marketCache.ts < CACHE_TTL_MS) {
      const row = marketCache.data.find(r => r.symbol === symbol);
      if (row) return res.json({ symbol, price: row.price, change24h: row.change, volume24h: row.volume_24h, source: 'cache', timestamp: new Date().toISOString() });
    }

    // or fetch fresh + cache
    let rows;
    try {
      rows = await fetchMarketFromCoinGecko();
    } catch {
      rows = fallbackRows();
    }
    marketCache = { ts: Date.now(), data: rows };
    const row = rows.find(r => r.symbol === symbol) || FALLBACK[symbol];
    res.json({ symbol, price: row.price, change24h: row.change, volume24h: row.volume_24h, source: row.source || 'coingecko', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('price error:', e);
    const s = (req.params.symbol || '').toUpperCase().replace('USDT','');
    const fb = FALLBACK[s] || FALLBACK.BTC;
    res.json({ symbol: s, price: fb.price, change24h: fb.change, volume24h: fb.volume_24h, source: 'fallback', timestamp: new Date().toISOString() });
  }
});

/** ───────── Config endpoints (kept) ───────── **/
app.get('/api/config', async (_req, res) => {
  try { res.json(await Configuration.getConfig()); }
  catch (e) { console.error('config get', e); res.status(500).json({ error: 'Failed to fetch configuration' }); }
});
app.put('/api/config', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const updated = await Configuration.updateConfig(req.body || {});
    if (!updated) return res.status(500).json({ error: 'Failed to update configuration' });
    res.json(updated);
  } catch (e) {
    console.error('config put', e);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/** 404 */
app.use('*', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

/** Start */
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend on ${PORT}`);
  console.log(`🔐 Supabase server client ready`);
});
server.on('error', (err) => { console.error('Server error:', err); process.exit(1); });

module.exports = app;
