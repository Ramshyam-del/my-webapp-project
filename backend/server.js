require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const helmet = require('helmet'); // Security middleware
const rateLimit = require('express-rate-limit'); // Rate limiting
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const OperationLog = require('./models/OperationLog');
const MiningPayout = require('./models/MiningPayout');
const { sendOtp } = require('./utils/sendOtp');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jonasangela491:iexTSV5wbMuBuV@cluster0.reyfc3h.mongodb.net/quantex?retryWrites=true&w=majority&appName=Cluster0';

// Add connection options to handle IP whitelist issues
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Continue running the server even if MongoDB fails
    console.log('Server will continue without database connection');
  });

const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  // Don't crash the server on connection errors
});
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User schema/model
// REMOVE the userSchema and UserModel definitions from server.js
// Only use the imported User model from './models/User'
// Replace all 'UserModel' usages with 'User'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// JWT middleware
function requireAdminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error('Not admin');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid admin credentials' });
});

// Protect all /api/users routes except login/register
app.use('/api/users', (req, res, next) => {
  if (
    (req.method === 'POST' && req.path === '/register') ||
    (req.method === 'POST' && req.path === '/login')
  ) {
    return next();
  }
  requireAdminAuth(req, res, next);
});

app.get('/api/metrics', (req, res) => {
  res.json(metrics);
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  const user = new User({ email, passwordHash, otp, otpExpires, isVerified: false });
  await user.save();
  await sendOtp(email, otp);
  res.json({ message: 'OTP sent. Please verify your email.' });
});
// OTP Verification
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });
  if (user.isVerified) return res.status(400).json({ message: 'User already verified' });
  if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  user.otp = undefined;
  user.otpExpires = undefined;
  user.isVerified = true;
  await user.save();
  res.json({ message: 'Email verified. You can now log in.' });
});
// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });
  if (!user.isVerified) return res.status(400).json({ message: 'Email not verified' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(400).json({ message: 'Invalid password' });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

// Forgot Password: Request OTP
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  await user.save();
  await sendOtp(email, otp);
  res.json({ message: 'OTP sent to your email.' });
});
// Forgot Password: Reset
app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });
  if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset successful. You can now log in.' });
});

// --- User CRUD Endpoints ---
// Add user
app.post('/api/users', async (req, res) => {
  try {
    const { email, invitationCode, vipLevel, balanceStatus, creditScore, realNameAuth, totalAssets, totalRecharge, totalWithdrawal, superiorAccount, registered } = req.body;
    const user = new User({
      email,
      invitationCode,
      vipLevel,
      balanceStatus,
      creditScore,
      realNameAuth,
      totalAssets,
      totalRecharge,
      totalWithdrawal,
      superiorAccount,
      registered: registered || new Date().toISOString().slice(0, 10),
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error adding user', error: err.message });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error updating user', error: err.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting user', error: err.message });
  }
});

// Freeze user endpoint
app.post('/api/users/:id/freeze', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { balanceStatus: 'Frozen' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User frozen', user });
  } catch (err) {
    res.status(400).json({ message: 'Error freezing user', error: err.message });
  }
});

// One-click login endpoint
app.post('/api/users/:id/login', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Simulate login action
    res.json({ message: 'One-click login successful', user });
  } catch (err) {
    res.status(400).json({ message: 'Error logging in user', error: err.message });
  }
});

// PATCH endpoint to update user status fields
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    ['withdrawalStatus', 'transactionStatus', 'accountStatus'].forEach(field => {
      if (typeof req.body[field] === 'boolean') update[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Error updating status', error: err.message });
  }
});

// --- User Bank Card Endpoints ---
// Get all bank cards for a user
app.get('/api/users/:id/bank-cards', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.bankCards || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bank cards', error: err.message });
  }
});

// Add a new bank card for a user
app.post('/api/users/:id/bank-cards', async (req, res) => {
  try {
    const { cardNumber, bankName, holderName } = req.body;
    if (!cardNumber || !bankName || !holderName) {
      return res.status(400).json({ message: 'Missing card fields' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.bankCards = user.bankCards || [];
    user.bankCards.push({ cardNumber, bankName, holderName });
    await user.save();
    res.status(201).json(user.bankCards);
  } catch (err) {
    res.status(500).json({ message: 'Error adding bank card', error: err.message });
  }
});

// Remove a bank card from a user
app.delete('/api/users/:id/bank-cards/:cardId', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.bankCards = user.bankCards || [];
    user.bankCards = user.bankCards.filter(card => card._id.toString() !== req.params.cardId);
    await user.save();
    res.json(user.bankCards);
  } catch (err) {
    res.status(500).json({ message: 'Error removing bank card', error: err.message });
  }
});

// --- User Notification Endpoints ---
// Get all notifications for a user
app.get('/api/users/:id/notifications', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notifications || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
});

// Add a notification for a user
app.post('/api/users/:id/notifications', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Missing notification fields' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.notifications = user.notifications || [];
    user.notifications.push({ title, content });
    await user.save();
    res.status(201).json(user.notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error adding notification', error: err.message });
  }
});

// Batch notification to multiple users
app.post('/api/users/batch-notification', async (req, res) => {
  try {
    const { userIds, title, content } = req.body;
    if (!Array.isArray(userIds) || !title || !content) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $push: { notifications: { title, content, createdAt: new Date() } } }
    );
    res.json({ notified: result.nModified || result.modifiedCount || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Error sending batch notification', error: err.message });
  }
});

// GET /api/user/assets - get asset balances for logged-in user
app.get('/api/user/assets', requireAdminAuth, async (req, res) => {
  try {
    const email = req.admin?.email;
    if (!email) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      usdt: user.usdt || 0,
      btc: user.btc || 0,
      eth: user.eth || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assets', error: err.message });
  }
});

// GET /api/market - fetch real market data from CoinGecko
app.get('/api/market', async (req, res) => {
  try {
    const ids = 'bitcoin,ethereum,binancecoin,solana,cardano';
    const vs = 'usdt';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs}&include_24hr_change=true`;
    const response = await fetch(url);
    const data = await response.json();
    const result = [
      {
        name: 'BTC/USDT',
        price: data.bitcoin.usdt,
        change: data.bitcoin.usdt_24h_change,
      },
      {
        name: 'ETH/USDT',
        price: data.ethereum.usdt,
        change: data.ethereum.usdt_24h_change,
      },
      {
        name: 'BNB/USDT',
        price: data.binancecoin.usdt,
        change: data.binancecoin.usdt_24h_change,
      },
      {
        name: 'SOL/USDT',
        price: data.solana.usdt,
        change: data.solana.usdt_24h_change,
      },
      {
        name: 'ADA/USDT',
        price: data.cardano.usdt,
        change: data.cardano.usdt_24h_change,
      },
    ];
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching market data', error: err.message });
  }
});

// --- Transaction Endpoints ---
// Create a transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const tx = new Transaction(req.body);
    await tx.save();
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ message: 'Error creating transaction', error: err.message });
  }
});
// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find().populate('user', 'email');
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions', error: err.message });
  }
});
// Get a single transaction
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id).populate('user', 'email');
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transaction', error: err.message });
  }
});
// Update a transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const tx = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    res.status(400).json({ message: 'Error updating transaction', error: err.message });
  }
});
// Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const tx = await Transaction.findByIdAndDelete(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting transaction', error: err.message });
  }
});

// --- Operation Log Endpoints ---
// Create an operation log
app.post('/api/operation-logs', async (req, res) => {
  try {
    const log = new OperationLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: 'Error creating log', error: err.message });
  }
});
// Get all operation logs
app.get('/api/operation-logs', async (req, res) => {
  try {
    const logs = await OperationLog.find().sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs', error: err.message });
  }
});

// --- Mining Payout Endpoints ---
// Create a mining payout
app.post('/api/mining-payouts', async (req, res) => {
  try {
    const payout = new MiningPayout(req.body);
    await payout.save();
    res.status(201).json(payout);
  } catch (err) {
    res.status(400).json({ message: 'Error creating mining payout', error: err.message });
  }
});
// Get all mining payouts
app.get('/api/mining-payouts', async (req, res) => {
  try {
    const payouts = await MiningPayout.find().populate('user', 'email');
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching mining payouts', error: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend API server running on http://localhost:${PORT}`);
}); 
