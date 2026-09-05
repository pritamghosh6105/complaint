const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const mongoModels = require('../backend/src/models/mongo');

const uri = (process.env.MONGODB_URI || '').trim();

async function clearAllComplaints() {
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');
  console.log('\x1b[36m%s\x1b[0m', '🧹 CivicPulse AI - Removing All Complaints & Associated Data');
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');

  // 1. Clear from MongoDB Atlas
  if (uri) {
    try {
      console.log('⚡ Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
      console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MongoDB Atlas.');

      const compRes = await mongoModels.Complaint.deleteMany({});
      const timeRes = await mongoModels.ComplaintTimeline.deleteMany({});
      const feedRes = await mongoModels.Feedback.deleteMany({});
      const notifRes = await mongoModels.Notification.deleteMany({});

      // Reset sequence counters in Mongo
      await mongoModels.Counter.findOneAndUpdate({ _id: 'complaints' }, { $set: { seq: 1 } }, { upsert: true });
      await mongoModels.Counter.findOneAndUpdate({ _id: 'complaint_timeline' }, { $set: { seq: 1 } }, { upsert: true });
      await mongoModels.Counter.findOneAndUpdate({ _id: 'feedback' }, { $set: { seq: 1 } }, { upsert: true });
      await mongoModels.Counter.findOneAndUpdate({ _id: 'notifications' }, { $set: { seq: 1 } }, { upsert: true });

      console.log('\x1b[32m%s\x1b[0m', `✓ MongoDB: Removed ${compRes.deletedCount} complaints.`);
      console.log('\x1b[32m%s\x1b[0m', `✓ MongoDB: Removed ${timeRes.deletedCount} complaint timeline events.`);
      console.log('\x1b[32m%s\x1b[0m', `✓ MongoDB: Removed ${feedRes.deletedCount} feedback entries.`);
      console.log('\x1b[32m%s\x1b[0m', `✓ MongoDB: Removed ${notifRes.deletedCount} complaint notifications.`);
      console.log('\x1b[32m%s\x1b[0m', `✓ MongoDB: Reset complaint ID counters.`);

      await mongoose.disconnect();
    } catch (err) {
      console.error('\x1b[31m%s\x1b[0m', `MongoDB Atlas clear warning: ${err.message}`);
    }
  }

  // 2. Clear from local embedded storage (database.json)
  const dbJsonPath = path.join(__dirname, '../backend/data/database.json');
  if (fs.existsSync(dbJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
      const prevComplaints = (data.complaints || []).length;

      data.complaints = [];
      data.complaint_timeline = [];
      data.feedback = [];
      data.notifications = [];

      if (!data._counters) data._counters = {};
      data._counters.complaints = 1;
      data._counters.complaint_timeline = 1;
      data._counters.feedback = 1;
      data._counters.notifications = 1;

      fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('\x1b[32m%s\x1b[0m', `✓ Local JSON: Cleared ${prevComplaints} complaints and reset counters.`);
    } catch (e) {
      console.error('Local JSON clear error:', e.message);
    }
  }

  // 3. Remove uploaded evidence files in uploads folder
  const uploadsDir = path.join(__dirname, '../backend/uploads');
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      let removedCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          removedCount++;
        }
      }
      console.log('\x1b[32m%s\x1b[0m', `✓ Uploads: Cleaned ${removedCount} uploaded complaint image files.`);
    } catch (e) {
      console.error('Uploads clear error:', e.message);
    }
  }

  console.log('\n\x1b[32m%s\x1b[0m', '=======================================================');
  console.log('\x1b[32m%s\x1b[0m', '✨ All Complaints Have Been Successfully Removed!');
  console.log('\x1b[32m%s\x1b[0m', '   - Departments and User Accounts were preserved.');
  console.log('\x1b[32m%s\x1b[0m', '   - New complaints will start cleanly from ID #1.');
  console.log('=======================================================\n');
  process.exit(0);
}

clearAllComplaints();
