const { durationMultiplier } = require('./duration');

function computeProfit({ amount, leverage, duration }) {
  const mult = durationMultiplier(duration);
  return Number(amount) * Number(leverage) * mult;
}

module.exports = { computeProfit };
