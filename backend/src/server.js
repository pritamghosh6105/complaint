const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
// Guarantee backend/.env is loaded regardless of process launch directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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

// Robust Cross-Origin Resource Sharing (CORS) for Deployed Frontend + Localhost
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());
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
app.use('/api/locations', locationRoutes);
const evidenceRoutes = require('./routes/evidenceRoutes');
app.use('/api/evidence', evidenceRoutes);

const mlClient = require('./services/mlClient');
const aiAssistantService = require('./services/aiAssistantService');

// Real AI Complaint Drafting Assistant (Groq / OpenRouter)
app.post('/api/ai/draft-complaint', async (req, res) => {
  try {
    const draft = await aiAssistantService.draftComplaint(req.body);
    res.json(draft);
  } catch (err) {
    console.error('AI draft error:', err);
    res.status(500).json({ error: 'AI drafting failed', details: err.message });
  }
});

// AI Deep Incident Understanding & Clarification Assistant
app.post('/api/ai/understand-incident', async (req, res) => {
  try {
    const understanding = await aiAssistantService.understandIncident(req.body);
    res.json(understanding);
  } catch (err) {
    console.error('AI incident understanding error:', err);
    res.status(500).json({ error: 'AI incident understanding failed', details: err.message });
  }
});

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

const cloudinaryConfig = require('./config/cloudinary');

app.get('/api/health', (req, res) => {
  const mongo = getMongoStatus();
  res.json({
    status: 'healthy',
    service: 'Smart Citizen Complaint Backend API',
    mlServiceUrl: process.env.ML_SERVICE_URL || 'https://civicpulse-ml-service.onrender.com',
    database: mongo.connected ? 'MongoDB Atlas' : 'Embedded Relational JSON Storage',
    mongoStatus: mongo,
    mediaStorage: {
      engine: cloudinaryConfig.isConfigured ? 'Cloudinary Media Engine (CDN)' : 'Local Disk Fallback (/uploads)',
      cloudinaryConfigured: cloudinaryConfig.isConfigured,
      cloudName: cloudinaryConfig.cloudName || null
    },
    time: new Date().toISOString()
  });
});

app.get('/api/evidence/cloudinary-status', async (req, res) => {
  try {
    const status = await cloudinaryConfig.verifyConnection();
    res.json(status);
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});


app.get('/api/database/status', async (req, res) => {
  const mongo = getMongoStatus();
  const collectionNames = [
    'users',
    'complaints',
    'departments',
    'locations',
    'postal_locations',
    'police_stations',
    'location_boundaries',
    'evidence',
    'ai_predictions',
    'complaint_history',
    'notifications',
    'feedback'
  ];

  let collectionCounts = {};
  if (mongo.connected) {
    try {
      const mongoModels = require('./models/mongo');
      const [u, c, d, l, p, ps, lb, e, a, ch, n, f] = await Promise.all([
        mongoModels.User.countDocuments(),
        mongoModels.Complaint.countDocuments(),
        mongoModels.Department.countDocuments(),
        mongoModels.Location.countDocuments(),
        mongoModels.PostalLocation.countDocuments(),
        mongoModels.PoliceStation.countDocuments(),
        mongoModels.LocationBoundary.countDocuments(),
        mongoModels.Evidence.countDocuments(),
        mongoModels.AiPrediction.countDocuments(),
        mongoModels.ComplaintHistory.countDocuments(),
        mongoModels.Notification.countDocuments(),
        mongoModels.Feedback.countDocuments()
      ]);
      collectionCounts = {
        users: u,
        complaints: c,
        departments: d,
        locations: l,
        postal_locations: p,
        police_stations: ps,
        location_boundaries: lb,
        evidence: e,
        ai_predictions: a,
        complaint_history: ch,
        notifications: n,
        feedback: f
      };
    } catch (err) {
      console.warn('Failed counting mongo collections:', err.message);
    }
  }

  res.json({
    databaseName: 'CIVICPULSE DB',
    activeEngine: mongo.connected ? 'MongoDB Atlas (Cloud)' : 'Local JSON Relational Storage',
    connected: mongo.connected,
    host: mongo.host,
    database: mongo.dbName,
    totalCollections: collectionNames.length,
    collections: collectionNames,
    counts: collectionCounts
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
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Citizen Complaint API Server running on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Database status: http://localhost:${PORT}/api/database/status`);
  console.log(`=======================================================`);

  // Attempt connection to MongoDB Atlas
  const mongoConnected = await connectMongoDB();
  if (mongoConnected) {
    try {
      const mongoModels = require('./models/mongo');
      const delRes = await mongoModels.User.deleteMany({
        $or: [
          { email: 'pg9810487@gmail.com' },
          { phone: { $regex: '8695437468' } }
        ]
      });
      if (delRes.deletedCount > 0) {
        console.log(`✓ [Atlas Maintenance] Purged ${delRes.deletedCount} user record(s) for pg9810487@gmail.com / 8695437468 from MongoDB Atlas.`);
      }
    } catch (cleanErr) {
      console.warn('Atlas maintenance warning:', cleanErr.message);
    }
    await db.syncFromMongo();
  }

  // Automatically sync 30 Department Demo Officer Accounts
  const demoCredentialService = require('./services/demoCredentialService');
  demoCredentialService.seedOrSyncDemoAccounts(db);

  // Start SLA escalation scheduler
  escalationService.startScheduler(30000); // checks every 30 seconds
});

module.exports = app;
