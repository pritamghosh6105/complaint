const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const LgdImporter = require('../backend/src/importers/lgdImporter');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('✗ Error: No MONGODB_URI in backend/.env');
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
let filePath = null;
let dirPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    filePath = path.resolve(process.cwd(), args[i + 1]);
    i++;
  } else if (args[i] === '--directory' && args[i + 1]) {
    dirPath = path.resolve(process.cwd(), args[i + 1]);
    i++;
  }
}

if (!filePath && !dirPath) {
  console.log('Usage:');
  console.log('  node scripts/import-lgd.js --file <path-to-csv-or-json>');
  console.log('  node scripts/import-lgd.js --directory <path-to-dir>');
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB Atlas.');

    const importer = new LgdImporter();
    if (filePath) {
      console.log(`Processing file: ${filePath}`);
      const report = await importer.importFile(filePath);
      console.log('\n--- LGD Import Summary ---');
      console.table({
        File: report.filename,
        Total: report.totalRecords,
        Inserted: report.inserted,
        Updated: report.updated,
        Skipped: report.skipped,
        InvalidParents: report.invalidParent,
        Errors: report.errors.length
      });
    } else if (dirPath) {
      console.log(`Processing directory: ${dirPath}`);
      const report = await importer.importDirectory(dirPath);
      console.log('\n--- LGD Directory Import Summary ---');
      console.table(report.totals);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ LGD Import failed: ${err.message}`);
    process.exit(1);
  }
}

main();
