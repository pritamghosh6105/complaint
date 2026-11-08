const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

let cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
let apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
let apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();
const cloudinaryUrl = (process.env.CLOUDINARY_URL || '').trim();

// Support CLOUDINARY_URL if provided
if (cloudinaryUrl && (!cloudName || !apiKey || !apiSecret)) {
  try {
    const urlPattern = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/;
    const match = cloudinaryUrl.match(urlPattern);
    if (match) {
      apiKey = match[1];
      apiSecret = match[2];
      cloudName = match[3];
    }
  } catch (e) {
    console.warn('⚠️ [Cloudinary] Failed to parse CLOUDINARY_URL string:', e.message);
  }
}

const isConfigured = Boolean(
  cloudName && 
  apiKey && 
  apiSecret && 
  cloudName !== '' &&
  apiKey !== '' &&
  apiSecret !== ''
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  console.log('✓ [Cloudinary] Initialized with Cloud Name:', cloudName);
} else {
  console.warn('⚠️ [Cloudinary] Credentials not configured in backend/.env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or CLOUDINARY_URL). Operating in local fallback storage mode.');
}

/**
 * Tests the Cloudinary connection with a live ping
 */
async function verifyConnection() {
  if (!isConfigured) {
    return {
      connected: false,
      configured: false,
      error: 'Cloudinary credentials missing in .env'
    };
  }

  try {
    const result = await cloudinary.api.ping();
    return {
      connected: result.status === 'ok',
      configured: true,
      cloudName,
      status: result.status
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      cloudName,
      error: err.message
    };
  }
}

module.exports = {
  cloudinary,
  isConfigured,
  cloudName,
  verifyConnection
};

