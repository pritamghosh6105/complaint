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
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  userEnteredAddress: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true, default: [88.4340, 22.9750] }, // [longitude, latitude]

    address: { type: String, default: '' },
    pincode: { type: String, default: '' },
    postOffice: { type: String, default: '' },
    district: { type: String, default: '' },
    state: { type: String, default: 'West Bengal' },
    policeStation: { type: String, default: null },
    nearestPoliceStation: { type: String, default: null },
    nearestPoliceStationDistance: { type: Number, default: null },
    jurisdictionPoliceStation: { type: String, default: null },
    jurisdictionVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, default: 'PARTIALLY_VERIFIED' },
    administrativeUnit: { type: String, default: '' },

    districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    subdivisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },

    municipalityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },

    blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    gramPanchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },

    policeStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation', default: null },

    locality: { type: String, default: '' },
    street: { type: String, default: '' },
    landmark: { type: String, default: '' },

    source: { type: String, default: 'Citizen GPS' },
    accuracyMeters: { type: Number, default: null },
    capturedAt: { type: Date, default: Date.now }
  },

  // Immutable Location Snapshot preserved at submission time (Section 20)
  locationSnapshot: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: '' },
    state: { type: String, default: 'West Bengal' },
    urbanRural: { type: String, enum: ['Urban', 'Rural', 'Other', 'Unverified'], default: 'Urban' },
    district: { type: String, default: '' },
    subdivision: { type: String, default: '' },
    ulb: { type: String, default: null },
    municipality: { type: String, default: null },
    ward: { type: String, default: null },
    block: { type: String, default: null },
    gramPanchayat: { type: String, default: null },
    village: { type: String, default: null },
    pincode: { type: String, default: '' },
    postOffice: { type: String, default: '' },
    policeStation: { type: String, default: '' },
    nearestPoliceStation: { type: String, default: null },
    nearestPoliceStationDistance: { type: Number, default: null },
    jurisdictionPoliceStation: { type: String, default: null },
    jurisdictionVerified: { type: Boolean, default: false },
    formattedAddress: { type: String, default: '' },
    locationSource: { type: String, default: 'CivicPulse GIS Engine' },
    verificationStatus: { type: String, default: 'PARTIALLY_VERIFIED' },
    sources: { type: mongoose.Schema.Types.Mixed, default: {} },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [88.4800, 22.7230] }
    },
    locationResolvedAt: { type: Date, default: Date.now },
    locationDataVersion: { type: String, default: 'WB-LGD-2026.1' }
  },

  address: { type: String, default: '' },
  state: { type: String, default: 'West Bengal' },
  district: { type: String, default: '', index: true },
  subdivision: { type: String, default: '', index: true },
  administrative_type: { type: String, enum: ['Urban', 'Rural', 'Other'], default: 'Urban', index: true },
  municipality: { type: String, default: '', index: true },
  ward: { type: String, default: '' },
  block: { type: String, default: '', index: true },
  gram_panchayat: { type: String, default: '', index: true },
  village: { type: String, default: '' },
  mouza: { type: String, default: '' },
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
  resolution_notes: { type: String, default: null },
  resolution_evidence_id: { type: Number, default: null },
  text_priority: { type: String, default: null },
  visual_priority: { type: String, default: null },
  final_priority: { type: String, default: null },
  visual_analysis_id: { type: Number, default: null },
  scene_description: { type: String, default: null },
  scene_type: { type: String, default: null },
  direct_observations: { type: [String], default: [] },
  primary_department: { type: String, default: null, index: true },
  secondary_departments: { type: [String], default: [] },
  requires_human_review: { type: Boolean, default: false, index: true },
  incident_type: { type: String, default: 'Standard Civic Complaint' },
  cause_known: { type: Boolean, default: false },
  classification_reason: { type: String, default: null },
  original_predicted_department: { type: String, default: null },
  original_citizen_input: { type: String, default: null },
  structured_incident: { type: mongoose.Schema.Types.Mixed, default: null },
  was_overridden_by_citizen: { type: Boolean, default: false },
  final_citizen_category: { type: String, default: null },
  final_department: { type: String, default: null, index: true },
  reviewed_by: { type: String, default: null },
  reviewed_at: { type: Date, default: null },
  admin_override: { type: Boolean, default: false },
  admin_override_reason: { type: String, default: null },
  triage_status: { type: String, enum: ['PENDING_OFFICER_TRIAGE', 'CONFIRMED_CRITICAL', 'RECALIBRATED_NORMAL', null], default: null, index: true },
  triage_reason: { type: String, default: null },
  triaged_by: { type: String, default: null },
  triaged_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Pre-save hook: Enforce strict Urban / Rural administrative exclusivity & generate snapshot
complaintSchema.pre('save', function(next) {
  const isUrban = this.locationSnapshot?.urbanOrRural === 'Urban' || this.administrative_type === 'Urban';
  const isRural = this.locationSnapshot?.urbanOrRural === 'Rural' || this.administrative_type === 'Rural';

  if (isUrban) {
    if (this.location) {
      this.location.blockId = null;
      this.location.gramPanchayatId = null;
      this.location.villageId = null;
    }
    this.block = null;
    this.gram_panchayat = null;
    this.village = null;
    this.mouza = null;
  } else if (isRural) {
    if (this.location) {
      this.location.municipalityId = null;
      this.location.wardId = null;
    }
    this.municipality = null;
    this.ward = null;
  }

  // Generate locationSnapshot if not already created
  if (!this.locationSnapshot || !this.locationSnapshot.district) {
    this.locationSnapshot = {
      urbanOrRural: isRural ? 'Rural' : 'Urban',
      district: this.district || this.location?.district || '',
      subdivision: this.subdivision || this.location?.subdivision || '',
      municipality: isUrban ? (this.municipality || this.location?.municipality || null) : null,
      ward: isUrban ? (this.ward || this.location?.ward || null) : null,
      block: isRural ? (this.block || this.location?.block || null) : null,
      gramPanchayat: isRural ? (this.gram_panchayat || this.location?.gramPanchayat || null) : null,
      village: isRural ? (this.village || this.location?.village || null) : null,
      policeStation: this.police_station || this.location?.policeStation || '',
      pincode: this.postal_code || this.location?.pincode || '',
      state: 'West Bengal',
      snapshotTakenAt: new Date()
    };
  }

  if (typeof next === 'function') {
    next();
  }
});

// Enable geospatial indexing for GIS spatial queries & radius searches
complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema, 'complaints');
