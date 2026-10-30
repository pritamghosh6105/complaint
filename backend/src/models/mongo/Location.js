const mongoose = require('mongoose');

const LOCATION_TYPES = [
  'DISTRICT',
  'SUBDIVISION',
  'BLOCK',
  'GRAM_PANCHAYAT',
  'VILLAGE',
  'MUNICIPAL_CORPORATION',
  'MUNICIPALITY',
  'NOTIFIED_AREA',
  'ULB',
  'WARD'
];

const locationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: LOCATION_TYPES,
    required: true,
    index: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },

  state: { 
    type: String, 
    default: 'West Bengal',
    trim: true 
  },
  districtId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },
  subdivisionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },
  blockId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },
  gramPanchayatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },
  villageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },

  ulbId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },
  wardId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Location', 
    default: null,
    index: true 
  },

  lgdCode: { 
    type: String, 
    default: null, 
    trim: true 
  },

  latitude: { 
    type: Number, 
    default: null,
    min: -90,
    max: 90 
  },
  longitude: { 
    type: Number, 
    default: null,
    min: -180,
    max: 180 
  },

  boundaryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LocationBoundary', 
    default: null 
  },

  source: { 
    type: String, 
    default: 'Government of India LGD' 
  },
  sourceUpdatedAt: { 
    type: Date, 
    default: null 
  },

  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Composite and partial indexes
locationSchema.index({ type: 1, parentId: 1 });
locationSchema.index({ type: 1, districtId: 1 });
locationSchema.index({ type: 1, subdivisionId: 1 });
locationSchema.index({ type: 1, blockId: 1 });
locationSchema.index({ type: 1, ulbId: 1 });
locationSchema.index({ type: 1, gramPanchayatId: 1 });
locationSchema.index(
  { lgdCode: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { lgdCode: { $type: 'string', $gt: '' } } 
  }
);

const Location = mongoose.models.Location || mongoose.model('Location', locationSchema, 'locations');

module.exports = {
  Location,
  LOCATION_TYPES
};
