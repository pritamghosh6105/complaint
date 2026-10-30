const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const { Location } = require('../backend/src/models/mongo/Location');

const uri = process.env.MONGODB_URI;

async function checkOrphans() {
  console.log('=======================================================');
  console.log('🔍 Checking Orphan Locations (Missing or Dangling Parents)');
  console.log('=======================================================');

  try {
    await mongoose.connect(uri);

    const allDocs = await Location.find({}, { _id: 1, name: 1, type: 1, parentId: 1 }).lean();
    const allIdSet = new Set(allDocs.map(d => String(d._id)));
    const orphans = [];

    for (const loc of allDocs) {
      if (loc.type === 'DISTRICT') continue;
      if (!loc.parentId) {
        orphans.push({ ID: loc._id, Name: loc.name, Type: loc.type, Issue: 'Missing parentId' });
      } else if (!allIdSet.has(String(loc.parentId))) {
        orphans.push({ ID: loc._id, Name: loc.name, Type: loc.type, Issue: `Parent ${loc.parentId} does not exist` });
      }
    }

    if (orphans.length > 0) {
      console.log(`⚠️ Found ${orphans.length} orphan locations (showing up to 20):`);
      console.table(orphans.slice(0, 20));
    } else {
      console.log('✓ No orphan locations found! All non-district locations have valid parent references.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ Error: ${err.message}`);
    process.exit(1);
  }
}

checkOrphans();
