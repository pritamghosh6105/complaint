const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: null },
  type: { type: String, default: 'info' },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
