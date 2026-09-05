const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const officerRoutes = require('./routes/officerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const escalationService = require('./services/escalationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Static uploads folder
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Route Registrations
app.use('/api/auth', authRoutes);
const { connectMongoDB, getMongoStatus } = require('./config/dbMongo');
const db = require('./models/db');

app.use('/api/complaints', complaintRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
const locationRoutes = require('./routes/locationRoutes');
app.use('/api/location', locationRoutes);

const mlClient = require('./services/mlClient');

// Public departments list
app.get('/api/departments', (req, res) => {
  try {
    const departments = db.prepare('SELECT id, name, code, head_name, contact_email, description FROM departments ORDER BY id ASC').all();
    res.json({ departments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// ML Transparency & API routes
app.get('/api/ml/taxonomy', async (req, res) => {
  try {
    const taxonomy = await mlClient.getTaxonomy();
    res.json(taxonomy);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch taxonomy' });
  }
});

app.post('/api/ml/analyze', async (req, res) => {
  try {
    const result = await mlClient.predictAll(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'ML analysis failed' });
  }
});

app.post('/api/ml/category', async (req, res) => {
  try {
    const result = await mlClient.predictCategory(req.body.text || '');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'ML category prediction failed' });
  }
});

app.post('/api/ml/priority', async (req, res) => {
  try {
    const result = await mlClient.predictPriority(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'ML priority prediction failed' });
  }
});

app.post('/api/ml/duplicate', async (req, res) => {
  try {
    const result = await mlClient.checkDuplicate(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'ML duplicate check failed' });
  }
});

app.post('/api/ml/resolution-time', async (req, res) => {
  try {
    const result = await mlClient.predictResolutionTime(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'ML resolution time prediction failed' });
  }
});

app.get('/api/health', (req, res) => {
  const mongo = getMongoStatus();
  res.json({
    status: 'healthy',
    service: 'Smart Citizen Complaint Backend API',
    database: mongo.connected ? 'MongoDB Atlas' : 'Embedded Relational JSON Storage',
    mongoStatus: mongo,
    time: new Date().toISOString()
  });
});

app.get('/api/database/status', (req, res) => {
  const mongo = getMongoStatus();
  res.json({
    activeEngine: mongo.connected ? 'MongoDB Atlas (Cloud)' : 'Local JSON Relational Storage',
    connected: mongo.connected,
    host: mongo.host,
    database: mongo.dbName,
    collections: ['departments', 'users', 'complaints', 'complaint_timeline', 'feedback', 'notifications']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server, Connect MongoDB, and Start SLA Watchdog
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Citizen Complaint API Server running on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Database status: http://localhost:${PORT}/api/database/status`);
  console.log(`=======================================================`);

  // Attempt connection to MongoDB Atlas
  const mongoConnected = await connectMongoDB();
  if (mongoConnected) {
    await db.syncFromMongo();
  }

  // Start SLA escalation scheduler
  escalationService.startScheduler(30000); // checks every 30 seconds
});
