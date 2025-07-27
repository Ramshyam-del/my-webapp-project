const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'trade', 'transfer'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true }, // e.g., 'USDT', 'BTC'
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  details: { type: String }, // Optional: extra info
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema); 