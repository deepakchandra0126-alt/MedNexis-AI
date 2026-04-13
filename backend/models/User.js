const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Health Profile
  healthProfile: {
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: Number,  // in cm
    weight: Number,  // in kg
    bloodGroup: String,
    medications: [String],
    allergies: [String],
    chronicConditions: [String]
  },

  // Current Location (updated on login/use)
  location: {
    lat: Number,
    lng: Number,
    city: String,
    updatedAt: Date
  },

  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Virtual: BMI
userSchema.virtual('bmi').get(function() {
  if (!this.healthProfile.height || !this.healthProfile.weight) return null;
  const h = this.healthProfile.height / 100;
  return (this.healthProfile.weight / (h * h)).toFixed(1);
});

module.exports = mongoose.model('User', userSchema);
