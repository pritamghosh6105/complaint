const mongoose = require('mongoose');

const visualAnalysisSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  complaint_id: { type: Number, required: true, index: true },
  complaint_evidence_id: { type: Number, required: true, index: true },
  analysis_id: { type: String, default: null, index: true },
  image_id: { type: String, default: null },
  model_name: { type: String, default: 'CivicPulse-Vision-Engine-v2' },
  model_version: { type: String, default: '2.0.0' },
  detected_incident: { type: String, default: 'General Civic Infrastructure Feature' },
  predicted_category: { type: String, default: 'Roads & Public Works' },
  predicted_subcategory: { type: String, default: 'General Infrastructure' },
  visible_damage_level: { type: String, enum: ['LOW', 'MODERATE', 'SEVERE', 'CRITICAL', 'UNKNOWN'], default: 'UNKNOWN' },
  image_quality: {
    type: String,
    enum: ['GOOD', 'ACCEPTABLE', 'BLURRY', 'LOW_LIGHT', 'DAMAGED_IMAGE', 'UNRELATED_IMAGE', 'INSUFFICIENT_EVIDENCE', 'POOR', 'UNKNOWN', 'PENDING'],
    default: 'GOOD'
  },
  model_confidence: { type: Number, default: null },
  confidence: { type: Number, default: null },
  match_confidence: { type: Number, default: null },
  evidence_description: { type: String, default: '' },
  recommended_human_review: { type: Boolean, default: false },
  limitations: { type: String, default: '' },
  quality_metrics: {
    blur_score: { type: Number, default: 0 },
    brightness: { type: Number, default: 0 },
    contrast: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    resolution_label: { type: String, default: 'Standard' }
  },
  detected_objects: [{
    label: { type: String, required: true },
    confidence: { type: Number, required: true },
    box: { type: [Number], default: [] }
  }],
  visual_severity: { type: String, enum: ['LOW', 'MEDIUM', 'MODERATE', 'HIGH', 'SEVERE', 'CRITICAL', 'UNKNOWN'], default: 'UNKNOWN' },
  visual_risk: { type: String, default: 'Moderate' },
  evidence_consistency: { type: String, enum: ['MATCH', 'PARTIAL_MATCH', 'MISMATCH', 'INSUFFICIENT_EVIDENCE', 'PENDING_ANALYSIS', 'POSSIBLE MISMATCH', 'UNVERIFIED', 'MISMATCH_WARNING'], default: 'INSUFFICIENT_EVIDENCE' },
  evidence_match: { type: String, enum: ['MATCH', 'PARTIAL_MATCH', 'MISMATCH', 'INSUFFICIENT_EVIDENCE', 'PENDING_ANALYSIS', 'POSSIBLE MISMATCH', 'UNVERIFIED', 'MISMATCH_WARNING'], default: 'INSUFFICIENT_EVIDENCE' },
  consistency_badge: { type: String, default: '' },
  consistency_details: { type: String, default: '' },
  explanation: { type: String, default: '' },
  mismatch_warning: { type: Boolean, default: false },
  image_findings: { type: mongoose.Schema.Types.Mixed, default: null },
  complaint_matching: { type: mongoose.Schema.Types.Mixed, default: null },
  analysis_status: {
    type: String,
    enum: ['UPLOADED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW', 'PENDING', 'ANALYZING'],
    default: 'COMPLETED'
  },
  recommended_action: { type: String, default: '' },
  // Phase 13 Human Review & Officer Correction
  human_verified: { type: Boolean, default: false },
  reviewed_by: { type: Number, default: null },
  reviewed_at: { type: Date, default: null },
  officer_action: { type: String, enum: ['CONFIRMED', 'CORRECTED', 'REJECTED_MISLEADING', 'PENDING'], default: 'PENDING' },
  corrected_category: { type: String, default: null },
  corrected_subcategory: { type: String, default: null },
  corrected_authority: { type: String, default: null },
  corrected_damage_level: { type: String, enum: ['LOW', 'MODERATE', 'SEVERE', 'CRITICAL', null], default: null },
  officer_notes: { type: String, default: '' },
  raw_response: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('VisualAnalysis', visualAnalysisSchema);
