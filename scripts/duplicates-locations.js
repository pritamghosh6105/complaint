const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const { Location } = require('../backend/src/models/mongo/Location');

const uri = process.env.MONGODB_URI;

async function checkDuplicates() {
  console.log('=======================================================');
  console.log('🔍 Checking Duplicate Locations & LGD Codes');
  console.log('=======================================================');

  try {
    await mongoose.connect(uri);

    // 1. Duplicate LGD Codes
    const lgdDuplicates = await Location.aggregate([
      { $match: { lgdCode: { $exists: true, $ne: null, $gt: '' } } },
      { $group: { _id: '$lgdCode', count: { $sum: 1 }, names: { $push: '$name' }, types: { $push: '$type' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (lgdDuplicates.length > 0) {
      console.log(`⚠️ Found ${lgdDuplicates.length} duplicate LGD codes:`);
      console.table(lgdDuplicates.map(d => ({ LGD_Code: d._id, Duplicates: d.count, Names: d.names.join(', '), Types: d.types.join(', ') })));
    } else {
      console.log('✓ No duplicate LGD codes found! All LGD codes are unique.');
    }

    // 2. Duplicate Names under same Parent
    const parentDuplicates = await Location.aggregate([
      { $match: { parentId: { $ne: null } } },
      { $group: { _id: { name: '$name', parentId: '$parentId', type: '$type' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (parentDuplicates.length > 0) {
      console.log(`\n⚠️ Found ${parentDuplicates.length} duplicate names under same parent:`);
      console.table(parentDuplicates.map(p => ({ Name: p._id.name, ParentId: p._id.parentId, Type: p._id.type, Count: p.count })));
    } else {
      console.log('✓ No duplicate names under same parent found!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ Error: ${err.message}`);
    process.exit(1);
  }
}

checkDuplicates();
