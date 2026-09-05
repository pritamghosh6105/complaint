const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  code: { type: String, required: true },
  name: { type: String, required: true, index: true },
  division: { type: String },
  headquarters: { type: String },
  center_lat: { type: Number, default: 0.0 },
  center_lng: { type: Number, default: 0.0 },
  is_active: { type: Number, default: 1 }
});

const subdivisionSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  district_id: { type: Number, required: true, index: true },
  name: { type: String, required: true, index: true },
  headquarters: { type: String },
  is_active: { type: Number, default: 1 }
});

const ulbSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  district_id: { type: Number, required: true, index: true },
  subdivision_id: { type: Number, index: true },
  name: { type: String, required: true, index: true },
  code: { type: String },
  type: { type: String, enum: ['Municipal Corporation', 'Municipality', 'Notified Area Authority', 'Other'], default: 'Municipality' },
  total_wards: { type: Number, default: 20 },
  lat: { type: Number, default: 0.0 },
  lng: { type: Number, default: 0.0 },
  is_active: { type: Number, default: 1 }
});

const wardSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  ulb_id: { type: Number, required: true, index: true },
  ward_number: { type: Number, required: true },
  name: { type: String, required: true },
  code: { type: String },
  is_active: { type: Number, default: 1 }
});

const blockSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  district_id: { type: Number, required: true, index: true },
  subdivision_id: { type: Number, index: true },
  name: { type: String, required: true, index: true },
  code: { type: String },
  headquarters: { type: String },
  lat: { type: Number, default: 0.0 },
  lng: { type: Number, default: 0.0 },
  is_active: { type: Number, default: 1 }
});

const gramPanchayatSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  block_id: { type: Number, required: true, index: true },
  name: { type: String, required: true, index: true },
  code: { type: String },
  headquarters: { type: String },
  lat: { type: Number, default: 0.0 },
  lng: { type: Number, default: 0.0 },
  is_active: { type: Number, default: 1 }
});

const villageMouzaSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  gram_panchayat_id: { type: Number, required: true, index: true },
  name: { type: String, required: true, index: true },
  mouza: { type: String },
  jl_no: { type: String },
  lat: { type: Number, default: 0.0 },
  lng: { type: Number, default: 0.0 },
  is_active: { type: Number, default: 1 }
});

const policeStationSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  district_id: { type: Number, required: true, index: true },
  subdivision_id: { type: Number, index: true },
  commissionerate: { type: String },
  name: { type: String, required: true, index: true },
  code: { type: String },
  is_active: { type: Number, default: 1 }
});

const postcodeSchema = new mongoose.Schema({
  pincode: { type: String, required: true, unique: true, index: true },
  district_id: { type: Number, required: true },
  subdivision_id: { type: Number },
  post_office: { type: String },
  locality: { type: String },
  lat: { type: Number },
  lng: { type: Number }
});

module.exports = {
  District: mongoose.models.District || mongoose.model('District', districtSchema),
  Subdivision: mongoose.models.Subdivision || mongoose.model('Subdivision', subdivisionSchema),
  ULB: mongoose.models.ULB || mongoose.model('ULB', ulbSchema),
  Ward: mongoose.models.Ward || mongoose.model('Ward', wardSchema),
  Block: mongoose.models.Block || mongoose.model('Block', blockSchema),
  GramPanchayat: mongoose.models.GramPanchayat || mongoose.model('GramPanchayat', gramPanchayatSchema),
  VillageMouza: mongoose.models.VillageMouza || mongoose.model('VillageMouza', villageMouzaSchema),
  PoliceStation: mongoose.models.PoliceStation || mongoose.model('PoliceStation', policeStationSchema),
  Postcode: mongoose.models.Postcode || mongoose.model('Postcode', postcodeSchema)
};
