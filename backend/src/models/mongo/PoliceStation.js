const mongoose = require('mongoose');

const policeStationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },

  districtId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location',
    default: null,
    index: true 
  },
  districtName: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  policeDistrict: { 
    type: String, 
    default: null,
    trim: true 
  },
  commissionerate: { 
    type: String, 
    default: null,
    trim: true,
    index: true 
  },
  subdivision: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  subdivisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null,
    index: true
  },

  address: { 
    type: String, 
    default: '',
    trim: true 
  },

  contact: {
    phone: { type: String, default: null, trim: true },
    email: { type: String, default: null, trim: true }
  },

  location: {
    type: { 
      type: String, 
      enum: ['Point'], 
      default: 'Point' 
    },
    coordinates: { 
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          if (!Array.isArray(coords) || coords.length !== 2) return false;
          const [lng, lat] = coords;
          return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        },
        message: 'Coordinates must be valid [longitude (-180..180), latitude (-90..90)]'
      }
    }
  },

  source: { 
    type: String, 
    default: 'West Bengal Police' 
  },
  sourceUpdatedAt: { 
    type: Date, 
    default: null 
  },
  last_verified: {
    type: Date,
    default: Date.now
  },

  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for station_name compatibility
policeStationSchema.virtual('station_name').get(function() {
  return this.name;
});

// Spatial and organizational indexes
policeStationSchema.index({ policeDistrict: 1 });
policeStationSchema.index({ location: '2dsphere' });

const PoliceStation = mongoose.models.PoliceStation || mongoose.model('PoliceStation', policeStationSchema, 'police_stations');

module.exports = PoliceStation;
