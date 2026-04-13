const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/health', require('./routes/health'));
app.use('/api/location', require('./routes/location'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/admin', require('./routes/admin'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthai')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Socket.io - Real-time location alerts
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User sends their location
  socket.on('update_location', async (data) => {
    const { userId, lat, lng } = data;
    try {
      // Find disease stats near this location
      const stats = await getNearbyDiseaseStats(lat, lng, 5); // 5km radius
      socket.emit('location_alert', stats);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

async function getNearbyDiseaseStats(lat, lng, radiusKm) {
  const HealthReport = require('./models/HealthReport');
  const radiusDeg = radiusKm / 111;

  const reports = await HealthReport.find({
    'location.lat': { $gte: lat - radiusDeg, $lte: lat + radiusDeg },
    'location.lng': { $gte: lng - radiusDeg, $lte: lng + radiusDeg },
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // last 30 days
  });

  if (reports.length === 0) return { total: 0, diseases: [] };

  // Aggregate disease counts anonymously
  const diseaseCounts = {};
  reports.forEach(r => {
    const d = r.predictedDisease;
    diseaseCounts[d] = (diseaseCounts[d] || 0) + 1;
  });

  const diseases = Object.entries(diseaseCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / reports.length) * 100)
  })).sort((a, b) => b.count - a.count);

  return {
    total: reports.length,
    areaName: `${radiusKm}km radius`,
    diseases: diseases.slice(0, 5), // top 5
    riskLevel: reports.length > 50 ? 'HIGH' : reports.length > 20 ? 'MEDIUM' : 'LOW'
  };
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
