const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { cloudinary, isConfigured, cloudName, verifyConnection } = require('../backend/src/config/cloudinary');

async function testCloudinary() {
  console.log('====================================================');
  console.log('       CivicPulse AI — Cloudinary Diagnostic');
  console.log('====================================================');
  console.log('Configured:', isConfigured ? 'YES' : 'NO');
  console.log('Cloud Name:', cloudName || '(not set)');

  if (!isConfigured) {
    console.log('\n❌ Cloudinary is not configured yet.');
    console.log('Please add your Cloudinary credentials to backend/.env:');
    console.log('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('  CLOUDINARY_API_KEY=your_api_key');
    console.log('  CLOUDINARY_API_SECRET=your_api_secret');
    console.log('  OR');
    console.log('  CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>\n');
    process.exit(1);
  }

  console.log('\n[1/3] Testing Cloudinary API Connectivity (ping)...');
  try {
    const pingResult = await verifyConnection();
    if (pingResult.connected) {
      console.log('  ✓ API Ping Successful! Status:', pingResult.status);
    } else {
      console.error('  ✗ API Ping Failed:', pingResult.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('  ✗ Ping Exception:', err.message);
    process.exit(1);
  }

  console.log('\n[2/3] Testing Upload (sample 1x1 buffer)...');
  const sample1x1PngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  let uploadedPublicId = null;

  try {
    const uploadRes = await cloudinary.uploader.upload(sample1x1PngBase64, {
      folder: 'civicpulse/tests',
      tags: ['civicpulse', 'diagnostic_test']
    });

    uploadedPublicId = uploadRes.public_id;
    console.log('  ✓ Upload Successful!');
    console.log('    Public ID :', uploadRes.public_id);
    console.log('    Secure URL:', uploadRes.secure_url);
    console.log('    Format    :', uploadRes.format);
  } catch (err) {
    console.error('  ✗ Upload failed:', err.message);
    process.exit(1);
  }

  console.log('\n[3/3] Cleaning up test asset...');
  if (uploadedPublicId) {
    try {
      const delRes = await cloudinary.uploader.destroy(uploadedPublicId);
      console.log('  ✓ Cleanup successful! Result:', delRes.result);
    } catch (err) {
      console.warn('  ⚠️ Asset cleanup warning:', err.message);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 Cloudinary is 100% operational for CivicPulse!');
  console.log('====================================================\n');
}

testCloudinary();
