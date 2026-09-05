const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  tracking_id: { type: String, required: true, unique: true, index: true },
  citizen_id: { type: Number, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, default: null, index: true },
  predicted_category: { type: String, default: null },
  predicted_subcategory: { type: String, default: null },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM', index: true },
  status: { 
    type: String, 
    enum: ['Submitted', 'AI Analyzed', 'Under Review', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'], 
    default: 'Submitted',
    index: true 
  },
  is_emergency: { type: Boolean, default: false, index: true },
  is_crime: { type: Boolean, default: false, index: true },
  is_sensitive: { type: Boolean, default: false, index: true },
  department_id: { type: Number, default: null, index: true },
  officer_id: { type: Number, default: null, index: true },
  latitude: { type: Number, default: 0.0 },
  longitude: { type: Number, default: 0.0 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [88.4340, 22.9750] } // [longitude, latitude]
  },
  address: { type: String, default: '' },
  state: { type: String, default: 'West Bengal' },
  district_id: { type: Number, default: null, index: true },
  district: { type: String, default: 'North 24 Parganas', index: true },
  subdivision_id: { type: Number, default: null, index: true },
  subdivision: { type: String, default: '', index: true },
  administrative_type: { type: String, enum: ['Urban', 'Rural', 'Other'], default: 'Urban', index: true },
  ulb_id: { type: Number, default: null, index: true },
  ulb_type: { type: String, default: null },
  municipality: { type: String, default: '', index: true },
  ward_id: { type: Number, default: null, index: true },
  ward: { type: String, default: '' },
  block_id: { type: Number, default: null, index: true },
  block: { type: String, default: '', index: true },
  gram_panchayat_id: { type: Number, default: null, index: true },
  gram_panchayat: { type: String, default: '', index: true },
  village_id: { type: Number, default: null, index: true },
  village: { type: String, default: '' },
  mouza: { type: String, default: '' },
  police_station_id: { type: Number, default: null, index: true },
  police_station: { type: String, default: '', index: true },
  locality: { type: String, default: '' },
  landmark: { type: String, default: '' },
  postal_code: { type: String, default: '', index: true },
  location_type: { type: String, default: 'Residential' },
  affected_count: { type: Number, default: 1 },
  image_url: { type: String, default: null },
  is_escalated: { type: Number, default: 0 },
  escalated_to: { type: String, default: null },
  escalation_level: { type: Number, default: 0 },
  is_duplicate: { type: Number, default: 0 },
  duplicate_of_id: { type: Number, default: null },
  duplicate_similarity: { type: Number, default: 0 },
  ml_confidence: { type: Number, default: 0.9 },
  predicted_category: { type: String, default: null },
  predicted_priority: { type: String, default: null },
  ml_predicted_category: { type: String, default: null },
  ml_predicted_priority: { type: String, default: null },
  predicted_resolution_days: { type: Number, default: 3 },
  sla_deadline: { type: Date, default: null },
  resolved_at: { type: Date, default: null },
  resolution_image_url: { type: String, default: null },
  resolution_notes: { type: String, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Enable geospatial indexing for GIS spatial queries & radius searches
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
