const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'officer', 'admin', 'field_officer', 'department_officer', 'municipal_admin', 'police_officer', 'cyber_crime_officer', 'super_admin'], 
    default: 'citizen' 
  },
  phone: { type: String, default: '' },
  department_id: { type: Number, default: null },
  ward: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('User', userSchema);
