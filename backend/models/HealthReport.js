const mongoose = require('mongoose');

const healthReportSchema = new mongoose.Schema({
  // Anonymous reference — only userId hash stored (NOT name/email)
  userHash: { type: String, required: true },

  symptoms: [{ type: String }],
  predictedDisease: { type: String, required: true },
  confidence: { type: Number },  // 0-100 percentage from ML API
  precautions: [{ type: String }],
  severity: { type: String, enum: ['mild', 'moderate', 'severe'] },

  // Geo location — stored for heatmap
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: String,
    state: String,
    country: String
  },

  // Basic anonymous health info
  ageGroup: { type: String, enum: ['child', 'teen', 'adult', 'senior'] },
  gender: { type: String, enum: ['male', 'female', 'other'] },

  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for fast geo queries
healthReportSchema.index({ 'location.lat': 1, 'location.lng': 1 });
healthReportSchema.index({ createdAt: -1 });
healthReportSchema.index({ predictedDisease: 1 });

module.exports = mongoose.model('HealthReport', healthReportSchema);
