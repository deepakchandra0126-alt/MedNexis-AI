const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HealthReport = require('../models/HealthReport');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'healthai_secret');
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/health/my-history — User's own chat/report history
router.get('/my-history', authMiddleware, async (req, res) => {
  try {
    const crypto = require('crypto');
    const userHash = crypto.createHash('sha256').update(req.userId.toString()).digest('hex');
    
    const reports = await HealthReport.find({ userHash })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/health/update-location — Update user's current location
router.put('/update-location', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, city } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      location: { lat, lng, city, updatedAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
