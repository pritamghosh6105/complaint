const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  complaint_id: { type: Number, required: true, unique: true, index: true },
  citizen_id: { type: Number, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
