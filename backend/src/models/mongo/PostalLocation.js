const mongoose = require('mongoose');

const postalLocationSchema = new mongoose.Schema({
  pincode: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: function(v) {
        return typeof v === 'string' && /^[1-9][0-9]{5}$/.test(v);
      },
      message: props => `${props.value} is not a valid 6-digit Indian PIN code string!`
    },
    index: true 
  },
  postOffice: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  district: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  state: { 
    type: String, 
    default: 'West Bengal',
    trim: true 
  },
  officeType: { 
    type: String, 
    default: 'S.O',
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

  source: { 
    type: String, 
    default: 'India Post' 
  },
  sourceUpdatedAt: { 
    type: Date, 
    default: null 
  }
}, {
  timestamps: true
});

// Compound unique index for post office within PIN
postalLocationSchema.index({ pincode: 1, postOffice: 1 }, { unique: true });

const PostalLocation = mongoose.models.PostalLocation || mongoose.model('PostalLocation', postalLocationSchema, 'postal_locations');

module.exports = PostalLocation;
