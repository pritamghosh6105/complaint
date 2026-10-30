// CIVICPULSE DB — 12 Core Collection Models
const User = require('./User');
const Complaint = require('./Complaint');
const Department = require('./Department');
const { Location, LOCATION_TYPES } = require('./Location');
const PostalLocation = require('./PostalLocation');
const PoliceStation = require('./PoliceStation');
const LocationBoundary = require('./LocationBoundary');
const Evidence = require('./Evidence');
const AiPrediction = require('./AiPrediction');
const ComplaintHistory = require('./ComplaintHistory');
const Notification = require('./Notification');
const Feedback = require('./Feedback');

// Utility / Counter Model
const { Counter, getNextSequence } = require('./Counter');

module.exports = {
  // 12 Primary Collections
  User,
  Complaint,
  Department,
  Location,
  PostalLocation,
  PoliceStation,
  LocationBoundary,
  Evidence,
  AiPrediction,
  ComplaintHistory,
  Notification,
  Feedback,

  // Backward-compatibility aliases for existing controllers/services
  ComplaintEvidence: Evidence,
  ComplaintTimeline: ComplaintHistory,
  LOCATION_TYPES,
  Counter,
  getNextSequence
};
