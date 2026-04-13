const express = require('express');
const router = express.Router();
const HealthReport = require('../models/HealthReport');
const jwt = require('jsonwebtoken');

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

// GET /api/alerts/zone-check?lat=&lng=
// Quick check: is this zone safe?
router.get('/zone-check', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const radiusDeg = 5 / 111; // 5km
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    const count = await HealthReport.countDocuments({
      'location.lat': { $gte: lat - radiusDeg, $lte: parseFloat(lat) + radiusDeg },
      'location.lng': { $gte: lng - radiusDeg, $lte: parseFloat(lng) + radiusDeg },
      createdAt: { $gte: since }
    });

    const riskLevel = count > 30 ? 'HIGH' : count > 10 ? 'MEDIUM' : 'LOW';
    const safe = count < 10;

    res.json({
      safe,
      riskLevel,
      reportCount: count,
      message: safe
        ? '✅ This area looks safe based on recent reports.'
        : `⚠️ ${count} health issues reported in this area in the last 7 days. Take precautions!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/trending — Trending diseases nationally
router.get('/trending', async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const reports = await HealthReport.find({ createdAt: { $gte: since } });

    const counts = {};
    reports.forEach(r => {
      counts[r.predictedDisease] = (counts[r.predictedDisease] || 0) + 1;
    });

    const trending = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([disease, count]) => ({ disease, count }));

    res.json({ trending, totalReports: reports.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
