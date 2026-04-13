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

// GET /api/location/stats?lat=&lng=&radius=
// Returns ANONYMOUS disease stats near a location
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const radiusDeg = parseFloat(radius) / 111;
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);

    // Only last 30 days data
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const reports = await HealthReport.find({
      'location.lat': { $gte: latF - radiusDeg, $lte: latF + radiusDeg },
      'location.lng': { $gte: lngF - radiusDeg, $lte: lngF + radiusDeg },
      createdAt: { $gte: since }
    });

    if (reports.length === 0) {
      return res.json({
        total: 0,
        riskLevel: 'LOW',
        diseases: [],
        message: `No health reports in ${radius}km radius in last 30 days.`
      });
    }

    // Aggregate disease counts — NO personal info
    const diseaseCounts = {};
    const symptomCounts = {};

    reports.forEach(r => {
      diseaseCounts[r.predictedDisease] = (diseaseCounts[r.predictedDisease] || 0) + 1;
      r.symptoms?.forEach(s => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    });

    const diseases = Object.entries(diseaseCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / reports.length) * 100),
        precautions: getPrecautionsForDisease(name)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const riskLevel =
      reports.length > 100 ? 'VERY HIGH' :
      reports.length > 50 ? 'HIGH' :
      reports.length > 20 ? 'MEDIUM' : 'LOW';

    res.json({
      total: reports.length,
      riskLevel,
      diseases,
      topSymptoms,
      radiusKm: radius,
      message: generateAlertMessage(diseases, riskLevel, radius)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/location/heatmap — Grid data for map visualization
router.get('/heatmap', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    const radiusDeg = parseFloat(radius) / 111;
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const reports = await HealthReport.find({
      'location.lat': { $gte: latF - radiusDeg, $lte: latF + radiusDeg },
      'location.lng': { $gte: lngF - radiusDeg, $lte: lngF + radiusDeg },
      createdAt: { $gte: since }
    }).select('location.lat location.lng predictedDisease -_id');

    // Return as lightweight array for heatmap
    const points = reports.map(r => ({
      lat: r.location.lat,
      lng: r.location.lng,
      disease: r.predictedDisease
    }));

    res.json({ points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateAlertMessage(diseases, riskLevel, radius) {
  if (!diseases.length) return `Area looks healthy! No reported cases nearby.`;
  const top = diseases[0];
  return `⚠️ In the last 30 days within ${radius}km: ${top.percentage}% of reports show ${top.name}. Risk level: ${riskLevel}. ${top.precautions[0] || 'Stay safe!'}`;
}

function getPrecautionsForDisease(disease) {
  const map = {
    'Flu': ['Wear a mask', 'Wash hands frequently', 'Avoid crowded places'],
    'COVID-19': ['Wear N95 mask', 'Maintain social distance', 'Get vaccinated'],
    'Dengue': ['Use mosquito repellent', 'Wear full-sleeve clothes', 'Remove standing water'],
    'Typhoid': ['Drink boiled water only', 'Avoid street food', 'Wash hands before eating'],
    'Malaria': ['Sleep under mosquito nets', 'Use insect repellent', 'Wear protective clothing'],
    'Skin Disease': ['Cover your skin outdoors', 'Use sunscreen', 'Avoid sharing towels'],
  };
  return map[disease] || ['Consult a doctor', 'Maintain hygiene', 'Stay hydrated'];
}

module.exports = router;
