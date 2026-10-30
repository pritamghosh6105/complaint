const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const BoundaryImporter = require('../backend/src/importers/boundaryImporter');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('✗ Error: No MONGODB_URI in backend/.env');
  process.exit(1);
}

const args = process.argv.slice(2);
let filePath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    filePath = path.resolve(process.cwd(), args[i + 1]);
    i++;
  }
}

if (!filePath) {
  console.log('Usage: node scripts/import-boundaries.js --file <path-to-geojson>');
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB Atlas.');

    const importer = new BoundaryImporter();
    const report = await importer.importFile(filePath);
    console.log('\n--- GIS Boundaries Import Summary ---');
    console.table({
      File: report.filename,
      Total: report.totalFeatures,
      Inserted: report.inserted,
      Updated: report.updated,
      Rejected: report.rejected,
      Errors: report.errors.length
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ Boundary Import failed: ${err.message}`);
    process.exit(1);
  }
}

main();
