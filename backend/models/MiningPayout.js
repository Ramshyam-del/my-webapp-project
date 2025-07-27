const mongoose = require('mongoose');

const miningPayoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currency: { type: String, required: true }, // e.g., 'BTC', 'ETH'
  payout: { type: Number, required: true },
  balance: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.models.MiningPayout || mongoose.model('MiningPayout', miningPayoutSchema); 