const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthai_secret');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.userId = user._id;
    req.user = user;
    req.role = user.role || decoded.role || 'user';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function isAdminEmail(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(String(email || '').toLowerCase());
}

function signUserToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role || 'user' },
    process.env.JWT_SECRET || 'healthai_secret',
    { expiresIn: '7d' }
  );
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  isAdminEmail,
  signUserToken
};
