const mongoose = require('mongoose');

const complaintHistorySchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  complaint_id: { type: Number, required: true, index: true },
  action: { 
    type: String, 
    enum: [
      'SUBMITTED', 
      'AI_ANALYZED', 
      'UNDER_REVIEW',
      'VERIFIED', 
      'ASSIGNED', 
      'IN_PROGRESS', 
      'ESCALATED', 
      'EVIDENCE_UPLOADED', 
      'RESOLVED', 
      'CLOSED', 
      'REOPENED', 
      'FEEDBACK_SUBMITTED',
      'STATUS_CHANGE'
    ], 
    default: 'STATUS_CHANGE' 
  },
  status: { type: String, required: true }, // backward compatibility
  status_from: { type: String, default: null },
  status_to: { type: String, default: null },
  notes: { type: String, default: '' },
  updated_by_name: { type: String, default: 'System' },
  updated_by_user_id: { type: Number, default: null, index: true },
  updated_by_role: { type: String, default: null },
  escalation_level: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  created_at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ComplaintHistory = mongoose.models.ComplaintHistory || mongoose.model('ComplaintHistory', complaintHistorySchema, 'complaint_history');

module.exports = ComplaintHistory;
