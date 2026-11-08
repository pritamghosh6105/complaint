const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  complaint_id: { type: Number, required: true, index: true },
  uploaded_by: { type: Number, required: true, index: true },
  uploader_role: { type: String, default: 'citizen' },
  cloudinary_public_id: { type: String, default: null, index: true },
  cloudinary_url: { type: String, default: null },
  secure_url: { type: String, required: true },
  thumbnail_url: { type: String, default: null },
  blurred_url: { type: String, default: null },
  file_type: { type: String, enum: ['image', 'video', 'document', 'audio'], default: 'image' },
  format: { type: String, default: 'jpg' },
  original_filename: { type: String, default: 'evidence' },
  file_size_bytes: { type: Number, default: 0 },
  file_size: { type: Number, default: 0 }, // backward compatibility
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  duration: { type: Number, default: null },
  stage: { 
    type: String, 
    enum: ['initial_submission', 'initial', 'field_inspection', 'work_in_progress', 'resolution_proof', 'resolution'], 
    default: 'initial_submission' 
  },
  evidence_type: { type: String, default: 'initial' }, // backward compatibility
  gps_latitude: { type: Number, default: null },
  gps_longitude: { type: Number, default: null },
  sha256_hash: { type: String, default: null },
  verification_status: { 
    type: String, 
    enum: ['pending', 'verified', 'flagged_manipulated', 'rejected'], 
    default: 'pending' 
  },
  ai_analysis_id: { type: Number, default: null, index: true },
  is_sensitive: { type: Boolean, default: false },
  processing_status: {
    type: String,
    enum: ['UPLOADED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW'],
    default: 'UPLOADED'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Evidence = mongoose.models.Evidence || mongoose.model('Evidence', evidenceSchema, 'evidence');

module.exports = Evidence;
