const fs = require('fs');
const path = require('path');

// Ensure env is loaded
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { cloudinary, isConfigured } = require('../src/config/cloudinary');

async function migrateAndCleanUploads() {
  console.log('=====================================================');
  console.log('🚀 MIGRATING LOCAL EVIDENCE UPLOADS TO CLOUDINARY');
  console.log('=====================================================');
  console.log('Cloudinary Configured:', isConfigured);

  if (!isConfigured) {
    console.error('❌ Cloudinary is not configured. Aborting migration.');
    process.exit(1);
  }

  const uploadsDir = path.resolve(__dirname, '../uploads');
  const dbPath = path.resolve(__dirname, '../data/database.json');
  let dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Map of local filename -> Cloudinary secure_url
  const uploadedUrls = {};

  const files = fs.readdirSync(uploadsDir);
  console.log(`Found ${files.length} items in ${uploadsDir}`);

  for (const filename of files) {
    if (filename === '.gitkeep') continue;
    const filePath = path.join(uploadsDir, filename);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    console.log(`Uploading ${filename} (${(stat.size / 1024).toFixed(1)} KB) to Cloudinary...`);
    try {
      const uploadRes = await cloudinary.uploader.upload(filePath, {
        folder: 'civicpulse/complaints/migrated_evidence',
        tags: ['civicpulse', 'migrated_evidence'],
        overwrite: false
      });

      console.log(`✓ Uploaded ${filename} -> ${uploadRes.secure_url}`);
      uploadedUrls[`/uploads/${filename}`] = {
        secure_url: uploadRes.secure_url,
        public_id: uploadRes.public_id,
        bytes: uploadRes.bytes,
        format: uploadRes.format,
        width: uploadRes.width,
        height: uploadRes.height
      };
    } catch (uploadErr) {
      console.error(`⚠️ Failed to upload ${filename}:`, uploadErr.message);
    }
  }

  // Update complaints in database.json
  let updatedComplaintsCount = 0;
  dbData.complaints = dbData.complaints.map(c => {
    let updated = false;
    if (c.image_url && uploadedUrls[c.image_url]) {
      c.image_url = uploadedUrls[c.image_url].secure_url;
      updated = true;
    }
    if (c.resolution_image_url && uploadedUrls[c.resolution_image_url]) {
      c.resolution_image_url = uploadedUrls[c.resolution_image_url].secure_url;
      updated = true;
    }
    if (updated) updatedComplaintsCount++;
    return c;
  });

  // Update evidence records in database.json
  let updatedEvidenceCount = 0;
  if (dbData.evidence) {
    dbData.evidence = dbData.evidence.map(e => {
      if (e.secure_url && uploadedUrls[e.secure_url]) {
        const cloudInfo = uploadedUrls[e.secure_url];
        e.secure_url = cloudInfo.secure_url;
        e.cloudinary_url = cloudInfo.secure_url;
        e.cloudinary_public_id = cloudInfo.public_id;
        e.file_size = cloudInfo.bytes || e.file_size;
        e.width = cloudInfo.width || e.width;
        e.height = cloudInfo.height || e.height;
        updatedEvidenceCount++;
      }
      return e;
    });
  }

  // Save updated database.json
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedComplaintsCount} complaints and ${updatedEvidenceCount} evidence records with live Cloudinary URLs.`);

  // Now delete all local files from uploadsDir except .gitkeep
  console.log('\n🧹 Deleting all local evidence files from uploads directory...');
  let deletedCount = 0;
  for (const filename of files) {
    if (filename === '.gitkeep') continue;
    const filePath = path.join(uploadsDir, filename);
    try {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`  Deleted local file: ${filename}`);
    } catch (delErr) {
      console.warn(`  Could not delete ${filename}:`, delErr.message);
    }
  }

  console.log(`\n=====================================================`);
  console.log(`🎉 SUCCESS: ${deletedCount} local evidence files deleted.`);
  console.log(`📁 Local uploads directory is now clean! All evidence resides in Cloudinary.`);
  console.log(`=====================================================`);
}

migrateAndCleanUploads().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});

