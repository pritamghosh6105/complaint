const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const uri = (process.env.MONGODB_URI || '').trim();

if (!uri) {
  console.error('\x1b[31m%s\x1b[0m', '✗ Error: No MONGODB_URI found in backend/.env');
  process.exit(1);
}

async function viewMongoData() {
  try {
    console.log('\x1b[36m%s\x1b[0m', '⚡ Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MongoDB Atlas successfully!\n');

    // 1. List all databases on the cluster
    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const dbsResult = await admin.listDatabases();
    
    console.log('\x1b[35m%s\x1b[0m', '=======================================================');
    console.log('\x1b[35m%s\x1b[0m', '📁 DATABASES ON YOUR MONGODB CLUSTER:');
    console.log('\x1b[35m%s\x1b[0m', '=======================================================');
    console.table(dbsResult.databases.map(d => ({
      'Database Name': d.name,
      'Size on Disk': `${(d.sizeOnDisk / (1024 * 1024)).toFixed(2)} MB`,
      'Empty': d.empty ? 'Yes' : 'No'
    })));

    // 2. List all collections & document counts in active database
    const currentDbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('\x1b[36m%s\x1b[0m', '\n=======================================================');
    console.log('\x1b[36m%s\x1b[0m', `🗄️ COLLECTIONS IN DATABASE "${currentDbName}":`);
    console.log('\x1b[36m%s\x1b[0m', '=======================================================');

    const summary = [];
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      summary.push({
        'Collection Name': col.name,
        'Total Documents': count,
        'Type': col.type || 'collection'
      });
    }
    console.table(summary);

    // 3. Quick peek at sample complaints
    console.log('\x1b[33m%s\x1b[0m', '\n📋 RECENT COMPLAINTS IN MONGODB:');
    console.log('\x1b[33m%s\x1b[0m', '-------------------------------------------------------');
    const sampleComplaints = await mongoose.connection.db.collection('complaints')
      .find({}, { projection: { tracking_id: 1, title: 1, category: 1, priority: 1, status: 1 } })
      .limit(5)
      .toArray();

    console.table(sampleComplaints.map(c => ({
      'Tracking ID': c.tracking_id,
      'Title': c.title ? c.title.substring(0, 32) + '...' : 'N/A',
      'Category': c.category,
      'Priority': c.priority,
      'Status': c.status
    })));

    console.log('\x1b[32m%s\x1b[0m', '\n✓ Database check complete.\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `✗ Error: ${err.message}`);
    process.exit(1);
  }
}

viewMongoData();
