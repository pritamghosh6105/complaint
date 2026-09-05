const mongoose = require('mongoose');

const complaintTimelineSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  complaint_id: { type: Number, required: true, index: true },
  status: { type: String, required: true },
  notes: { type: String, default: '' },
  updated_by_name: { type: String, default: 'System' },
  updated_by_user_id: { type: Number, default: null },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ComplaintTimeline', complaintTimelineSchema);
