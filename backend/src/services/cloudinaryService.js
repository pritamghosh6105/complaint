const fs = require('fs');
const path = require('path');
const { cloudinary, isConfigured } = require('../config/cloudinary');

/**
 * Enterprise Cloudinary Evidence Management Service
 * Handles folder-organized uploads, asset transformations, signed URLs, and cleanup.
 */
class CloudinaryService {
  /**
   * Builds the designated Cloudinary folder path for an evidence asset
   * Structure: civicpulse/complaints/{complaintId}/{folderType}/
   */
  getFolderPath(complaintId = 'general', folderType = 'images') {
    const cleanId = String(complaintId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const validFolders = ['images', 'videos', 'thumbnails', 'ai-analysis', 'resolution'];
    const selectedFolder = validFolders.includes(folderType) ? folderType : 'images';
    return `civicpulse/complaints/${cleanId}/${selectedFolder}`;
  }

  /**
   * Uploads an evidence file to Cloudinary with folder hierarchy & tags
   * Supports local file path, file buffer, or stream
   */
  async uploadEvidence(filePathOrBuffer, options = {}) {
    const {
      complaintId = 'temp',
      folderType = 'images',
      resourceType = 'auto', // 'image' | 'video' | 'auto'
      originalFilename = 'evidence',
      tags = []
    } = options;

    const folder = this.getFolderPath(complaintId, folderType);
    const publicIdPrefix = path.parse(originalFilename).name.replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. If Cloudinary credentials configured, upload to Cloudinary
    if (isConfigured) {
      try {
        let uploadResult;

        if (Buffer.isBuffer(filePathOrBuffer)) {
          // Stream upload for buffer
          uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type: resourceType,
                public_id: `${publicIdPrefix}_${Date.now()}`,
                tags: ['civicpulse', 'evidence', String(complaintId), ...tags],
                overwrite: false
              },
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
            stream.end(filePathOrBuffer);
          });
        } else {
          // Direct file path upload
          uploadResult = await cloudinary.uploader.upload(filePathOrBuffer, {
            folder,
            resource_type: resourceType,
            public_id: `${publicIdPrefix}_${Date.now()}`,
            tags: ['civicpulse', 'evidence', String(complaintId), ...tags],
            overwrite: false
          });
        }

        const isVideo = uploadResult.resource_type === 'video';

        // Cleanup local temporary file once safely stored in Cloudinary
        if (typeof filePathOrBuffer === 'string' && fs.existsSync(filePathOrBuffer)) {
          try {
            fs.unlinkSync(filePathOrBuffer);
            console.log(`✓ [Cloudinary] Cleaned up temporary local upload: ${path.basename(filePathOrBuffer)}`);
          } catch (unlinkErr) {
            console.warn(`⚠️ [Cloudinary] Failed to unlink temporary local upload: ${unlinkErr.message}`);
          }
        }

        return {
          success: true,
          is_cloud: true,
          cloudinary_public_id: uploadResult.public_id,
          cloudinary_url: uploadResult.url,
          secure_url: uploadResult.secure_url,
          resource_type: uploadResult.resource_type || (isVideo ? 'video' : 'image'),
          format: uploadResult.format,
          width: uploadResult.width || null,
          height: uploadResult.height || null,
          file_size: uploadResult.bytes || 0,
          duration: uploadResult.duration || null,
          original_filename: originalFilename,
          thumbnail_url: this.getThumbnailUrl(uploadResult.public_id, { resourceType: uploadResult.resource_type }),
          optimized_url: this.getOptimizedUrl(uploadResult.public_id, { resourceType: uploadResult.resource_type })
        };
      } catch (cloudErr) {
        // Also cleanup temporary file on failure
        if (typeof filePathOrBuffer === 'string' && fs.existsSync(filePathOrBuffer)) {
          try { fs.unlinkSync(filePathOrBuffer); } catch (_) {}
        }
        console.error('Cloudinary API upload failed:', cloudErr.message);
        throw new Error(`Cloudinary upload failed: ${cloudErr.message}`);
      }
    }

    // 2. If credentials are intentionally not configured, throw explicit error
    if (typeof filePathOrBuffer === 'string' && fs.existsSync(filePathOrBuffer)) {
      try { fs.unlinkSync(filePathOrBuffer); } catch (_) {}
    }
    throw new Error('Cloudinary credentials are not configured in backend/.env. Evidence must be uploaded to Cloudinary.');
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let destFilename = '';
    let finalPath = '';
    let fileSize = 0;

    if (Buffer.isBuffer(filePathOrBuffer)) {
      destFilename = `evidence-${Date.now()}-${originalFilename}`;
      finalPath = path.join(uploadsDir, destFilename);
      fs.writeFileSync(finalPath, filePathOrBuffer);
      fileSize = filePathOrBuffer.length;
    } else if (typeof filePathOrBuffer === 'string') {
      if (filePathOrBuffer.startsWith(uploadsDir)) {
        finalPath = filePathOrBuffer;
        destFilename = path.basename(filePathOrBuffer);
      } else {
        destFilename = `evidence-${Date.now()}-${path.basename(filePathOrBuffer)}`;
        finalPath = path.join(uploadsDir, destFilename);
        fs.copyFileSync(filePathOrBuffer, finalPath);
      }
      if (fs.existsSync(finalPath)) {
        fileSize = fs.statSync(finalPath).size;
      }
    }

    const ext = path.extname(destFilename).replace('.', '').toLowerCase();
    const isVideo = ['mp4', 'webm', 'mov', 'quicktime'].includes(ext);
    const localUrl = `/uploads/${destFilename}`;

    return {
      success: true,
      is_cloud: false,
      cloudinary_public_id: `local_civicpulse_${destFilename}`,
      cloudinary_url: localUrl,
      secure_url: localUrl,
      resource_type: isVideo ? 'video' : 'image',
      format: ext || 'jpg',
      width: 1280,
      height: 720,
      file_size: fileSize,
      duration: isVideo ? 10.0 : null,
      original_filename: originalFilename,
      thumbnail_url: localUrl,
      optimized_url: localUrl
    };
  }

  /**
   * Deletes an asset from Cloudinary cleanly to prevent orphaned storage
   */
  async deleteEvidence(publicId, resourceType = 'image') {
    if (!publicId) return { success: false, message: 'No public ID provided' };

    if (publicId.startsWith('local_civicpulse_')) {
      // Local fallback removal
      const filename = publicId.replace('local_civicpulse_', '');
      const localPath = path.resolve(__dirname, '../../uploads', filename);
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (e) {}
      }
      return { success: true, result: 'ok', local: true };
    }

    if (!isConfigured) {
      return { success: true, result: 'skipped_not_configured' };
    }

    try {
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
      });
      return { success: res.result === 'ok' || res.result === 'not found', result: res.result };
    } catch (err) {
      console.error('Cloudinary destroy error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates optimized delivery URL with automatic format and quality (f_auto, q_auto)
   */
  getOptimizedUrl(publicId, options = {}) {
    if (!publicId || publicId.startsWith('local_') || publicId.startsWith('http')) {
      return publicId;
    }
    if (!isConfigured) return publicId;

    const { width, height, crop = 'limit', resourceType = 'image' } = options;
    const transformation = [
      { fetch_format: 'auto', quality: 'auto' }
    ];

    if (width || height) {
      transformation.push({ width, height, crop });
    }

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      transformation
    });
  }

  /**
   * Generates thumbnail transformation URL for complaint lists and cards
   * (e.g., 300x200 smart gravity crop)
   */
  getThumbnailUrl(publicId, options = {}) {
    if (!publicId || publicId.startsWith('local_') || publicId.startsWith('http')) {
      return publicId;
    }
    if (!isConfigured) return publicId;

    const { width = 320, height = 220, resourceType = 'image' } = options;

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      transformation: [
        { width, height, crop: 'fill', gravity: 'auto', fetch_format: 'auto', quality: 'auto' }
      ]
    });
  }

  /**
   * Generates a heavily blurred URL for sensitive or restricted incident previews
   */
  getBlurredUrl(publicId, options = {}) {
    if (!publicId || publicId.startsWith('local_') || publicId.startsWith('http')) {
      return publicId;
    }
    if (!isConfigured) return publicId;

    return cloudinary.url(publicId, {
      resource_type: options.resourceType || 'image',
      secure: true,
      transformation: [
        { effect: 'blur:1200' },
        { fetch_format: 'auto', quality: 'auto' }
      ]
    });
  }

  /**
   * Generates time-limited signed URL for authorized access
   */
  generateSignedUrl(publicId, options = {}) {
    if (!publicId || publicId.startsWith('local_') || publicId.startsWith('http')) {
      return publicId;
    }
    if (!isConfigured) return publicId;

    const { expiresInSeconds = 3600, resourceType = 'image' } = options;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      sign_url: true,
      expires_at: expiresAt
    });
  }
}

module.exports = new CloudinaryService();
