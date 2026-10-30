const mongoose = require('mongoose');

const locationBoundarySchema = new mongoose.Schema({
  locationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location',
    required: true,
    index: true 
  },

  locationType: { 
    type: String, 
    required: true,
    index: true 
  },

  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },

  source: { 
    type: String, 
    default: 'Official GIS Boundary Dataset' 
  },
  sourceUpdatedAt: { 
    type: Date, 
    default: null 
  }
}, {
  timestamps: true
});

// Spatial 2dsphere index for GIS point-in-polygon matching
locationBoundarySchema.index({ geometry: '2dsphere' });

const LocationBoundary = mongoose.models.LocationBoundary || mongoose.model('LocationBoundary', locationBoundarySchema, 'location_boundaries');

module.exports = LocationBoundary;
