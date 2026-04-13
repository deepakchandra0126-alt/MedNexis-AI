const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const HealthReport = require('../models/HealthReport');
const jwt = require('jsonwebtoken');

// Auth middleware
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

// POST /api/chat/predict — Send symptoms, get prediction
router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const { symptoms, lat, lng } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one symptom' });
    }

    // Call Python ML model API
    const mlResponse = await axios.post(
      `${process.env.ML_API_URL || 'http://localhost:5001'}/predict`,
      { symptoms }
    );

    const {
      disease,
      confidence,
      precautions,
      description,
      medications,
      workouts,
      diets,
      matched_symptoms,
      unmatched_symptoms,
      alternatives,
      needs_more_info,
      disclaimer
    } = mlResponse.data;

    // Save anonymous health report (for location heatmap)
    if (lat && lng) {
      const user = await User.findById(req.userId);
      const userHash = crypto.createHash('sha256').update(req.userId.toString()).digest('hex');
      
      const ageGroup = getAgeGroup(user?.healthProfile?.age);

      await HealthReport.create({
        userHash,
        symptoms,
        predictedDisease: disease,
        confidence,
        precautions,
        severity: getSeverity(confidence),
        location: { lat, lng },
        ageGroup,
        gender: user?.healthProfile?.gender
      });
    }

    res.json({
      disease,
      confidence: Math.round(confidence),
      description,
      precautions,
      medications,
      workouts,
      diets,
      severity: getSeverity(confidence),
      matched_symptoms,
      unmatched_symptoms,
      alternatives,
      needs_more_info,
      disclaimer: "⚠️ This is AI-generated information only. Please consult a doctor for proper diagnosis."
    });

  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'ML model service unavailable. Please start the Python server.' });
    }
    if (err.response?.data?.error) {
      return res.status(err.response.status || 500).json({
        error: err.response.data.error,
        unmatched: err.response.data.unmatched || []
      });
    }
    console.error('Chat prediction error:', err.message);
    res.status(500).json({ error: 'Prediction failed. Please check that backend, ML API, and MongoDB are running.' });
  }
});

// GET /api/chat/symptoms-list — Get all known symptoms
router.get('/symptoms-list', async (req, res) => {
  try {
    const mlResponse = await axios.get(
      `${process.env.ML_API_URL || 'http://localhost:5001'}/symptoms`
    );
    res.json(mlResponse.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getAgeGroup(age) {
  if (!age) return 'adult';
  if (age < 13) return 'child';
  if (age < 20) return 'teen';
  if (age < 60) return 'adult';
  return 'senior';
}

function getSeverity(confidence) {
  if (confidence > 80) return 'severe';
  if (confidence > 50) return 'moderate';
  return 'mild';
}

module.exports = router;
