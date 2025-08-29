function parseDurationToMs(input) {
  const m = String(input || '').trim().match(/^(\d+)([mhd])$/i);
  if (!m) throw new Error('Invalid duration; use 1m,5m,15m,1h');
  const n = Number(m[1]); const u = m[2].toLowerCase();
  const mul = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * mul[u];
}

const DURATION_MULTIPLIER = {
  '1m': 0.5,
  '5m': 1.0,
  '15m': 1.25,
  '1h': 1.5
};
function durationMultiplier(d) { return DURATION_MULTIPLIER[d] ?? 1.0; }

module.exports = { parseDurationToMs, durationMultiplier };
