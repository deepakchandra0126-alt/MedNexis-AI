const express = require('express');
const router = express.Router();
const User = require('../models/User');
const HealthReport = require('../models/HealthReport');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

// GET /api/admin/dashboard - high-level anonymous totals for admin cards
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalReports, diseaseStats, areaStats] = await Promise.all([
      User.countDocuments(),
      HealthReport.countDocuments(),
      getDiseaseStats(5),
      getAreaStats()
    ]);

    res.json({
      totalUsers,
      totalReports,
      diseaseStats,
      areaStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats - aggregated disease, symptom, and area data
router.get('/stats', async (req, res) => {
  try {
    const [diseaseStats, symptomStats, areaStats, ageGroupStats] = await Promise.all([
      getDiseaseStats(10),
      getSymptomStats(),
      getAreaStats(),
      getAgeGroupStats()
    ]);

    res.json({
      diseaseStats,
      symptomStats,
      areaStats,
      ageGroupStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users - list users without password or disease history
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/delete-user/:id - delete a user account
router.delete('/delete-user/:id', async (req, res) => {
  try {
    if (String(req.userId) === String(req.params.id)) {
      return res.status(400).json({ error: 'Admin cannot delete their own account' });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, deletedUserId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getDiseaseStats(limit = 10) {
  const totalReports = await HealthReport.countDocuments();
  if (!totalReports) return [];

  const rows = await HealthReport.aggregate([
    { $group: { _id: '$predictedDisease', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return rows.map(row => ({
    disease: row._id || 'Unknown',
    count: row.count,
    percentage: Math.round((row.count / totalReports) * 100)
  }));
}

async function getSymptomStats(limit = 10) {
  const rows = await HealthReport.aggregate([
    { $unwind: '$symptoms' },
    { $group: { _id: '$symptoms', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return rows.map(row => ({
    symptom: row._id || 'Unknown',
    count: row.count
  }));
}

async function getAreaStats() {
  const rows = await HealthReport.aggregate([
    {
      $group: {
        _id: {
          area: { $ifNull: ['$location.city', 'Unknown area'] },
          disease: '$predictedDisease'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return rows.map(row => ({
    area: row._id.area,
    disease: row._id.disease || 'Unknown',
    count: row.count
  }));
}

async function getAgeGroupStats() {
  const rows = await HealthReport.aggregate([
    { $group: { _id: { $ifNull: ['$ageGroup', 'unknown'] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return rows.map(row => ({
    ageGroup: row._id,
    count: row.count
  }));
}

module.exports = router;
