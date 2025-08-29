// Sanitize free-text for Supabase .or(... ilike ...) syntax
function cleanSearch(input) {
  if (!input) return '';
  let s = String(input).trim();
  // commas break the or() list; percent/underscore are wildcards
  s = s.replace(/[,]/g, ' ');
  s = s.replace(/[%_]/g, ''); // keep it simple: strip wildcards
  // collapse spaces
  s = s.replace(/\s+/g, ' ');
  return s;
}

module.exports = { cleanSearch };
