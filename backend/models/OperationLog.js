const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  admin: { type: String, required: true }, // or ObjectId if you have an Admin model
  action: { type: String, required: true },
  target: { type: String }, // e.g., user email or ID
  details: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.models.OperationLog || mongoose.model('OperationLog', operationLogSchema); 