const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, match: /.+\@.+\..+/ },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
  bankCards: [
    {
      cardNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      holderName: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  notifications: [
    {
      title: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema); 