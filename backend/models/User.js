// TODO: Replace mongoose User model with Supabase table operations
// const mongoose = require('mongoose');
// 
// const userSchema = new mongoose.Schema({
//   email: { type: String, unique: true, required: true, match: /.+\@.+\..+/ },
//   passwordHash: { type: String, required: true },
//   isVerified: { type: Boolean, default: false },
//   otp: String,
//   otpExpires: Date,
//   bankCards: [
//     {
//       cardNumber: { type: String, required: true },
//       bankName: { type: String, required: true },
//       holderName: { type: String, required: true },
//       createdAt: { type: Date, default: Date.now },
//     }
//   ],
//   notifications: [
//     {
//       title: { type: String, required: true },
//       content: { type: String, required: true },
//       createdAt: { type: Date, default: Date.now },
//     }
//   ],
// });
// 
// module.exports = mongoose.models.User || mongoose.model('User', userSchema);

// TODO: Implement Supabase User table operations
// Example Supabase operations:
// - supabase.from('users').select('*')
// - supabase.from('users').insert({...})
// - supabase.from('users').update({...}).eq('id', id)
// - supabase.from('users').delete().eq('id', id)

module.exports = {
  // TODO: Add Supabase User operations here
  findById: async (id) => {
    // TODO: Implement with Supabase
    return null;
  },
  findByEmail: async (email) => {
    // TODO: Implement with Supabase
    return null;
  },
  create: async (userData) => {
    // TODO: Implement with Supabase
    return null;
  },
  update: async (id, updateData) => {
    // TODO: Implement with Supabase
    return null;
  },
  delete: async (id) => {
    // TODO: Implement with Supabase
    return null;
  }
}; 