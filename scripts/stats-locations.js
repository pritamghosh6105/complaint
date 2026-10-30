const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const { Location } = require('../backend/src/models/mongo/Location');
const PostalLocation = require('../backend/src/models/mongo/PostalLocation');
const PoliceStation = require('../backend/src/models/mongo/PoliceStation');
const LocationBoundary = require('../backend/src/models/mongo/LocationBoundary');

const uri = process.env.MONGODB_URI;

async function statsLocations() {
  console.log('=======================================================');
  console.log('📊 CivicPulse AI — Location Database Statistics');
  console.log('=======================================================');

  try {
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB Atlas.\n');

    // Aggregate by type
    const typeCounts = await Location.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const postals = await PostalLocation.countDocuments();
    const police = await PoliceStation.countDocuments();
    const boundaries = await LocationBoundary.countDocuments();

    console.log('--- Administrative Entities in "locations" ---');
    console.table(typeCounts.map(t => ({ Type: t._id, Documents: t.count })));

    console.log('--- Domain Specific Collections ---');
    console.table([
      { Collection: 'postal_locations (PIN Directory)', Documents: postals },
      { Collection: 'police_stations (Law Enforcement)', Documents: police },
      { Collection: 'location_boundaries (GIS Polygons)', Documents: boundaries }
    ]);

    // District-wise breakdown of Subdivisions, Blocks, and ULBs
    const districts = await Location.find({ type: 'DISTRICT' }).sort({ name: 1 }).lean();
    const districtBreakdown = [];

    for (const d of districts) {
      const [subs, blocks, ulbs] = await Promise.all([
        Location.countDocuments({ type: 'SUBDIVISION', parentId: d._id }),
        Location.countDocuments({ type: 'BLOCK', districtId: d._id }),
        Location.countDocuments({ type: { $in: ['MUNICIPALITY', 'MUNICIPAL_CORPORATION', 'NOTIFIED_AREA', 'ULB'] }, districtId: d._id })
      ]);
      districtBreakdown.push({
        District: d.name,
        Code: d.lgdCode || 'N/A',
        Subdivisions: subs,
        Blocks: blocks,
        ULBs: ulbs
      });
    }

    console.log('\n--- District Hierarchy Breakdown ---');
    console.table(districtBreakdown);
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ Stats failed: ${err.message}`);
    process.exit(1);
  }
}

statsLocations();
