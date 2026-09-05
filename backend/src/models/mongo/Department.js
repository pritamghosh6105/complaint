const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  head_name: { type: String, default: '' },
  contact_email: { type: String, default: '' },
  description: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Department', departmentSchema);
