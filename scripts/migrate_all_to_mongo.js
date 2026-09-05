const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const mongoModels = require('../backend/src/models/mongo');

const uri = (process.env.MONGODB_URI || process.argv[2] || '').trim();

if (!uri) {
  console.error('\x1b[31m%s\x1b[0m', '✗ Error: No MONGODB_URI found in backend/.env or passed as argument.');
  console.log('Usage: node scripts/migrate_all_to_mongo.js [MONGODB_URI]');
  process.exit(1);
}

const dbFilePath = path.join(__dirname, '../backend/data/database.json');
if (!fs.existsSync(dbFilePath)) {
  console.error('\x1b[31m%s\x1b[0m', `✗ Error: Local database file not found at: ${dbFilePath}`);
  process.exit(1);
}

let localData;
try {
  localData = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
} catch (e) {
  console.error('\x1b[31m%s\x1b[0m', `✗ Error reading local database file: ${e.message}`);
  process.exit(1);
}

async function migrateAllToMongo() {
  const maskedUri = uri.replace(/\/\/[^@]+@/, '//***:***@');
  console.log('\x1b[36m%s\x1b[0m', `=======================================================`);
  console.log('\x1b[36m%s\x1b[0m', `📦 CivicPulse AI - Database Migration to MongoDB`);
  console.log('\x1b[36m%s\x1b[0m', `Connecting to: ${maskedUri}`);
  console.log('\x1b[36m%s\x1b[0m', `=======================================================`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MongoDB successfully!\n');

    // 1. Departments
    const departments = localData.departments || [];
    console.log(`⏳ Migrating ${departments.length} Municipal Departments...`);
    for (const d of departments) {
      await mongoModels.Department.updateOne(
        { id: d.id },
        {
          $set: {
            id: d.id,
            name: d.name,
            code: d.code,
            head_name: d.head_name || '',
            contact_email: d.contact_email || '',
            description: d.description || '',
            created_at: d.created_at ? new Date(d.created_at) : new Date()
          }
        },
        { upsert: true }
      );
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ ${departments.length} Departments migrated.`);

    // 2. Users
    const users = localData.users || [];
    console.log(`⏳ Migrating ${users.length} Users (Admin, Officers, Citizens)...`);
    for (const u of users) {
      await mongoModels.User.updateOne(
        { id: u.id },
        {
          $set: {
            id: u.id,
            name: u.name,
            email: u.email.toLowerCase().trim(),
            password_hash: u.password_hash,
            role: u.role || 'citizen',
            phone: u.phone || '',
            department_id: u.department_id !== undefined ? u.department_id : null,
            ward: u.ward || '',
            created_at: u.created_at ? new Date(u.created_at) : new Date()
          }
        },
        { upsert: true }
      );
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ ${users.length} Users migrated.`);

    // 3. Complaints
    const complaints = localData.complaints || [];
    console.log(`⏳ Migrating ${complaints.length} Complaints with GeoJSON & SLA...`);
    for (const c of complaints) {
      const lng = typeof c.longitude === 'number' && !isNaN(c.longitude) ? c.longitude : 88.4340;
      const lat = typeof c.latitude === 'number' && !isNaN(c.latitude) ? c.latitude : 22.9750;

      await mongoModels.Complaint.updateOne(
        { id: c.id },
        {
          $set: {
            id: c.id,
            tracking_id: c.tracking_id,
            citizen_id: c.citizen_id,
            title: c.title,
            description: c.description,
            category: c.category,
            priority: c.priority || 'MEDIUM',
            status: c.status || 'Submitted',
            department_id: c.department_id || null,
            officer_id: c.officer_id || null,
            latitude: lat,
            longitude: lng,
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            address: c.address || '',
            ward: c.ward || '',
            location_type: c.location_type || 'Residential',
            affected_count: c.affected_count || 1,
            image_url: c.image_url || null,
            resolution_image_url: c.resolution_image_url || null,
            resolution_notes: c.resolution_notes || null,
            is_duplicate: c.is_duplicate || 0,
            duplicate_of_id: c.duplicate_of_id || null,
            duplicate_similarity: c.duplicate_similarity || 0,
            is_escalated: c.is_escalated || 0,
            escalation_level: c.escalation_level || 0,
            escalated_to: c.escalated_to || null,
            ml_confidence: c.ml_confidence || 0.9,
            predicted_category: c.predicted_category || c.ml_predicted_category || null,
            predicted_priority: c.predicted_priority || c.ml_predicted_priority || null,
            ml_predicted_category: c.ml_predicted_category || c.predicted_category || null,
            ml_predicted_priority: c.ml_predicted_priority || c.predicted_priority || null,
            predicted_resolution_days: c.predicted_resolution_days || 3,
            sla_deadline: c.sla_deadline ? new Date(c.sla_deadline) : null,
            resolved_at: c.resolved_at ? new Date(c.resolved_at) : null,
            created_at: c.created_at ? new Date(c.created_at) : new Date(),
            updated_at: c.updated_at ? new Date(c.updated_at) : new Date()
          }
        },
        { upsert: true }
      );
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ ${complaints.length} Complaints migrated.`);

    // 4. Complaint Timelines
    const timelines = localData.complaint_timeline || [];
    console.log(`⏳ Migrating ${timelines.length} Complaint Timeline Events...`);
    for (const t of timelines) {
      await mongoModels.ComplaintTimeline.updateOne(
        { id: t.id },
        {
          $set: {
            id: t.id,
            complaint_id: t.complaint_id,
            status: t.status,
            notes: t.notes || '',
            updated_by_name: t.updated_by_name || 'System',
            updated_by_user_id: t.updated_by_user_id || null,
            created_at: t.created_at ? new Date(t.created_at) : new Date()
          }
        },
        { upsert: true }
      );
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ ${timelines.length} Timeline events migrated.`);

    // 5. Feedback
    const feedbacks = localData.feedback || [];
    console.log(`⏳ Migrating ${feedbacks.length} Feedback submissions...`);
    for (const f of feedbacks) {
      await mongoModels.Feedback.updateOne(
        { id: f.id },
        {
          $set: {
            id: f.id,
            complaint_id: f.complaint_id,
            citizen_id: f.citizen_id,
            rating: f.rating,
            comment: f.comment || '',
            created_at: f.created_at ? new Date(f.created_at) : new Date()
          }
        },
        { upsert: true }
      );
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ ${feedbacks.length} Feedback records migrated.`);

    // 6. Notifications
    const notifications = localData.notifications || [];
    console.log(`⏳ Migrating ${notifications.length} Notifications...`);
    for (const n of notifications) {
      await mongoModels.Notification.updateOne(
        { id: n.id },
        {
          $set: {
            id: n.id,
            user_id: n.user_id,
            title: n.title,
            message: n.message,
            link: n.link || null,
            type: n.type || 'info',
            is_read: Boolean(n.is_read),
            created_at: n.created_at ? new Date(n.created_at) : new Date()
          }
        },
        { upsert: true }
      );
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ ${notifications.length} Notifications migrated.`);

    // 7. Counters
    const counters = localData._counters || {};
    console.log(`⏳ Updating ID Counters in MongoDB...`);
    const counterMap = {
      departments: counters.departments || Math.max(...departments.map(d => d.id || 0), 0) + 1,
      users: counters.users || Math.max(...users.map(u => u.id || 0), 0) + 1,
      complaints: counters.complaints || Math.max(...complaints.map(c => c.id || 0), 0) + 1,
      complaint_timeline: counters.complaint_timeline || Math.max(...timelines.map(t => t.id || 0), 0) + 1,
      feedback: counters.feedback || Math.max(...feedbacks.map(f => f.id || 0), 0) + 1,
      notifications: counters.notifications || Math.max(...notifications.map(n => n.id || 0), 0) + 1
    };

    for (const [name, seq] of Object.entries(counterMap)) {
      await mongoModels.Counter.findByIdAndUpdate(
        name,
        { $set: { seq } },
        { upsert: true }
      );
    }
    console.log('\x1b[32m%s\x1b[0m', `✓ Counters updated.`);

    // Verify Counts
    const [deptCount, userCount, compCount, timelineCount, feedbackCount, notifCount] = await Promise.all([
      mongoModels.Department.countDocuments(),
      mongoModels.User.countDocuments(),
      mongoModels.Complaint.countDocuments(),
      mongoModels.ComplaintTimeline.countDocuments(),
      mongoModels.Feedback.countDocuments(),
      mongoModels.Notification.countDocuments()
    ]);

    console.log('\n\x1b[32m%s\x1b[0m', '=======================================================');
    console.log('\x1b[32m%s\x1b[0m', '🎉 All Database Data Successfully Migrated to MongoDB!');
    console.log('\x1b[32m%s\x1b[0m', '=======================================================');
    console.log(`  📁 Departments:         ${deptCount} documents`);
    console.log(`  👤 Users:               ${userCount} documents`);
    console.log(`  📋 Complaints:          ${compCount} documents`);
    console.log(`  🕒 Timeline Events:     ${timelineCount} documents`);
    console.log(`  ⭐ Feedback:            ${feedbackCount} documents`);
    console.log(`  🔔 Notifications:       ${notifCount} documents`);
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n\x1b[31m%s\x1b[0m', '=======================================================');
    console.error('\x1b[31m%s\x1b[0m', `✗ MongoDB Migration Failed: ${err.message}`);
    console.error('\x1b[31m%s\x1b[0m', '=======================================================');

    if (err.message.includes('whitelist') || err.message.includes('SSL alert number 80') || err.message.includes('Could not connect to any servers')) {
      console.log('\n\x1b[33m%s\x1b[0m', '📌 Action Required: IP Whitelist on MongoDB Atlas');
      console.log('1. Log into your MongoDB Atlas dashboard (https://cloud.mongodb.com)');
      console.log('2. Click on "Network Access" under the Security section');
      console.log('3. Click "Add IP Address"');
      console.log('4. Click "Allow Access from Anywhere" (0.0.0.0/0) or add your current IP');
      console.log('5. Click "Confirm" and re-run: npm run migrate:mongo\n');
    }

    process.exit(1);
  }
}

migrateAllToMongo();
