const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  complaint_id: { type: Number, required: true, index: true },
  model_name: { type: String, default: 'CivicPulse-MultiModel-Ensemble' },
  model_version: { type: String, default: '2.4.0' },
  category_prediction: {
    primary_department: { type: String, default: null },
    predicted_category: { type: String, default: null },
    subcategory: { type: String, default: null },
    secondary_departments: { type: [String], default: [] },
    confidence: { type: Number, default: 0.0 },
    requires_human_review: { type: Boolean, default: false },
    incident_type: { type: String, default: 'Standard Civic Complaint' },
    cause_known: { type: Boolean, default: false },
    reason: { type: String, default: null },
    top_categories: [{
      category: String,
      score: Number
    }]
  },
  priority_prediction: {
    predicted_priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    urgency_score: { type: Number, default: 0.5 },
    hazard_keywords: [String],
    risk_factors: [String]
  },
  duplicate_analysis: {
    is_duplicate: { type: Boolean, default: false },
    duplicate_of_id: { type: Number, default: null },
    similarity_score: { type: Number, default: 0.0 },
    spatial_distance_meters: { type: Number, default: 0.0 }
  },
  sla_prediction: {
    predicted_resolution_days: { type: Number, default: 3.0 },
    recommended_deadline_hours: { type: Number, default: 72 }
  },
  vision_analysis: {
    image_quality: { type: String, enum: ['GOOD', 'ACCEPTABLE', 'POOR', 'UNKNOWN'], default: 'GOOD' },
    detected_objects: [{
      label: String,
      confidence: Number,
      box: [Number]
    }],
    visual_severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    visual_risk: { type: String, default: 'Moderate' },
    evidence_consistency: { type: String, enum: ['MATCH', 'POSSIBLE MISMATCH', 'UNVERIFIED'], default: 'MATCH' },
    authenticity_score: { type: Number, default: 0.95 }
  },
  raw_response: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const AiPrediction = mongoose.models.AiPrediction || mongoose.model('AiPrediction', aiPredictionSchema, 'ai_predictions');

module.exports = AiPrediction;
