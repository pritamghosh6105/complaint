const mongoose = require('mongoose');

const complaintEvidenceSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  complaint_id: { type: Number, required: true, index: true },
  uploaded_by: { type: Number, required: true, index: true },
  cloudinary_public_id: { type: String, required: true, index: true },
  cloudinary_url: { type: String, required: true },
  secure_url: { type: String, required: true },
  resource_type: { type: String, enum: ['image', 'video'], default: 'image' },
  format: { type: String, default: 'jpg' },
  original_filename: { type: String, default: 'evidence' },
  file_size: { type: Number, default: 0 },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  duration: { type: Number, default: null },
  thumbnail_url: { type: String, default: null },
  blurred_url: { type: String, default: null },
  ai_analysis_id: { type: Number, default: null, index: true },
  scene_description: { type: String, default: null },
  scene_type: { type: String, default: null },
  direct_observations: { type: [String], default: [] },
  evidence_type: { type: String, enum: ['initial', 'resolution'], default: 'initial' },
  is_sensitive: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('ComplaintEvidence', complaintEvidenceSchema);
