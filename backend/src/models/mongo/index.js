const Department = require('./Department');
const User = require('./User');
const Complaint = require('./Complaint');
const ComplaintTimeline = require('./ComplaintTimeline');
const Feedback = require('./Feedback');
const Notification = require('./Notification');
const { Counter, getNextSequence } = require('./Counter');
const LocationModels = require('./Location');

module.exports = {
  Department,
  User,
  Complaint,
  ComplaintTimeline,
  Feedback,
  Notification,
  Counter,
  getNextSequence,
  ...LocationModels
};
