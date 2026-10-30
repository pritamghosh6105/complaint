const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const IndiaPostImporter = require('../backend/src/importers/indiaPostImporter');

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
  console.log('Usage: node scripts/import-india-post.js --file <path-to-csv>');
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB Atlas.');

    const importer = new IndiaPostImporter();
    const report = await importer.importFile(filePath);
    console.log('\n--- India Post Import Summary ---');
    console.table({
      File: report.filename,
      Total: report.totalRecords,
      Inserted: report.inserted,
      Updated: report.updated,
      Skipped: report.skipped,
      InvalidPin: report.invalidPin,
      Errors: report.errors.length
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ India Post Import failed: ${err.message}`);
    process.exit(1);
  }
}

main();
