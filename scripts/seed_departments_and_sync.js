const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const mongoModels = require('../backend/src/models/mongo');
const uri = (process.env.MONGODB_URI || '').trim();

const DEPARTMENTS_30 = [
  { id: 1, name: 'Police & Law Enforcement', code: 'POL', head_name: 'Superintendent Rajesh Verma', contact_email: 'officer.police@demo.com', description: 'Theft, assault, robbery, public violence, missing persons, law and order' },
  { id: 2, name: 'Cyber Crime', code: 'CYB', head_name: 'Inspector Meera Sen', contact_email: 'officer.cyber@demo.com', description: 'Online financial fraud, UPI scam, phishing, account hacking, cyber harassment' },
  { id: 3, name: 'Women & Child Safety', code: 'WCS', head_name: 'Officer Ananya Roy', contact_email: 'officer.women@demo.com', description: 'Street harassment, domestic violence, child abuse, stalking, victim protection' },
  { id: 4, name: 'Traffic & Road Safety', code: 'TRS', head_name: 'Inspector Vikram Singh', contact_email: 'officer.traffic@demo.com', description: 'Dangerous driving, traffic signals, obstructive parking, road safety enforcement' },
  { id: 5, name: 'Roads & Public Works', code: 'PWD', head_name: 'Dr. Alok Mukherjee', contact_email: 'officer.pwd@demo.com', description: 'Potholes, broken roads, damaged bridges, flyovers, road surface engineering' },
  { id: 6, name: 'Drainage & Sewerage', code: 'DSB', head_name: 'Er. Subrata Pal', contact_email: 'officer.drainage@demo.com', description: 'Open manholes, sewage overflow, blocked drains, monsoon waterlogging' },
  { id: 7, name: 'Water Supply', code: 'WSD', head_name: 'Er. Debasis Das', contact_email: 'officer.water@demo.com', description: 'Pipeline bursts, contaminated tap water, drinking water scarcity, water tankers' },
  { id: 8, name: 'Solid Waste Management', code: 'SWM', head_name: 'Ms. Sunita Banerjee', contact_email: 'officer.solidwaste@demo.com', description: 'Garbage dumping, missed collections, overflowing bins, composting, bio-waste' },
  { id: 9, name: 'Street Lighting & Electrical', code: 'SLE', head_name: 'Er. Rajesh Roy', contact_email: 'officer.streetlighting@demo.com', description: 'Broken streetlights, dangling cables, high-mast illumination, pole repairs' },
  { id: 10, name: 'Public Health & Sanitation', code: 'PHS', head_name: 'Dr. Manoj Mondal', contact_email: 'officer.health@demo.com', description: 'Mosquito breeding, dengue control, public toilets, food market hygiene' },
  { id: 11, name: 'Fire & Emergency Services', code: 'FES', head_name: 'Chief Fire Officer S. K. Bose', contact_email: 'officer.fire@demo.com', description: 'Fire hazards, blocked emergency exits, fire hydrants, commercial fire safety' },
  { id: 12, name: 'Disaster Management', code: 'DMA', head_name: 'Officer Pradip Nandi', contact_email: 'officer.disaster@demo.com', description: 'Severe flood response, cyclone tree falls, building collapse, emergency relief' },
  { id: 13, name: 'Environment & Pollution', code: 'ENP', head_name: 'Dr. Sharmistha Guha', contact_email: 'officer.environment@demo.com', description: 'Industrial air smoke, chemical effluents, noise pollution, water contamination' },
  { id: 14, name: 'Parks & Public Spaces', code: 'PPS', head_name: 'Ms. Ritu Sen', contact_email: 'officer.parks@demo.com', description: 'Children playgrounds, municipal parks, broken benches, public recreation grounds' },
  { id: 15, name: 'Building & Municipal Engineering', code: 'BME', head_name: 'Er. Tanmoy Dutta', contact_email: 'officer.building@demo.com', description: 'Illegal construction, structurally unsound buildings, unauthorized floor additions' },
  { id: 16, name: 'Land & Land Records', code: 'LLR', head_name: 'Officer Bikas Chatterjee', contact_email: 'officer.land@demo.com', description: 'Government land encroachment, illegal property mutation, forged land deeds' },
  { id: 17, name: 'Housing & Urban Development', code: 'HUD', head_name: 'Er. Nilanjan Ghosh', contact_email: 'officer.housing@demo.com', description: 'Affordable housing defects, slum rehabilitation, urban master plan implementation' },
  { id: 18, name: 'Electricity & Power', code: 'ELP', head_name: 'Er. Amitava Ghosh', contact_email: 'officer.electricity@demo.com', description: 'Distribution transformers, high-tension lines, power outages, voltage stability' },
  { id: 19, name: 'Public Transport', code: 'PTR', head_name: 'Director Amitabha Basu', contact_email: 'officer.transport@demo.com', description: 'Municipal buses, route schedules, bus shelters, commuter grievances' },
  { id: 20, name: 'Railway-related Public Complaints', code: 'RPC', head_name: 'Liaison Officer Kalyan Das', contact_email: 'officer.railway@demo.com', description: 'Station approach sanitation, level crossing safety, passenger amenities' },
  { id: 21, name: 'Health & Hospitals', code: 'HNH', head_name: 'Dr. Arunima Sanyal', contact_email: 'officer.hospital@demo.com', description: 'Government hospital services, emergency medicines, clinic infrastructure' },
  { id: 22, name: 'Food & Public Distribution', code: 'FPD', head_name: 'Officer Soumen Barik', contact_email: 'officer.food@demo.com', description: 'Ration shop pricing, grain quality, fair price shops, public distribution' },
  { id: 23, name: 'Consumer Affairs', code: 'COA', head_name: 'Advocate Snehasis Dey', contact_email: 'officer.consumer@demo.com', description: 'Charging above MRP, warranty refusal, counterfeit goods, unfair trade practices' },
  { id: 24, name: 'Education - Schools', code: 'EDS', head_name: 'Dr. Kaushik Maitra', contact_email: 'officer.school@demo.com', description: 'Primary and high school infrastructure, classroom safety, drinking water, toilets' },
  { id: 25, name: 'Higher Education', code: 'HED', head_name: 'Prof. Debabrata Roy', contact_email: 'officer.higheredu@demo.com', description: 'Colleges, universities, campus facilities, examination scheduling, anti-ragging' },
  { id: 26, name: 'Labour & Employment', code: 'LAE', head_name: 'Officer Tanuja Mitra', contact_email: 'officer.labour@demo.com', description: 'Unpaid wages, construction workplace safety, minimum wage compliance' },
  { id: 27, name: 'Agriculture', code: 'AGR', head_name: 'Dr. Partha Sarathi Roy', contact_email: 'officer.agriculture@demo.com', description: 'Irrigation canals, crop damage surveys, seed quality, farmer subsidies' },
  { id: 28, name: 'Animal Resources', code: 'ANR', head_name: 'Dr. Sujit Karmakar (DVM)', contact_email: 'officer.animal@demo.com', description: 'Stray animal management, dog bite control, rabies vaccination, injured livestock' },
  { id: 29, name: 'Forest & Wildlife', code: 'FAW', head_name: 'DFO R. K. Singh', contact_email: 'officer.forest@demo.com', description: 'Illegal tree cutting, timber smuggling, wildlife rescue, green belt conservation' },
  { id: 30, name: 'Public Grievance / General Admin', code: 'PGA', head_name: 'Dy. Commissioner P. K. Mallick', contact_email: 'officer.grievance@demo.com', description: 'Certificate delays, official corruption complaints, citizen charter compliance' }
];

async function run() {
  const dbJsonPath = path.join(__dirname, '../backend/data/database.json');
  let localData = { departments: [], users: [], complaints: [], complaint_timeline: [], feedback: [], notifications: [], _counters: {} };
  if (fs.existsSync(dbJsonPath)) {
    try {
      localData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
    } catch (e) {}
  }

  localData.departments = DEPARTMENTS_30;
  if (!localData._counters) localData._counters = {};
  localData._counters.departments = 31;
  fs.writeFileSync(dbJsonPath, JSON.stringify(localData, null, 2), 'utf-8');
  console.log(`✓ Local database.json updated with all ${DEPARTMENTS_30.length} departments.`);

  if (uri) {
    try {
      console.log('⚡ Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
      console.log('✓ Connected to MongoDB Atlas.');

      await mongoModels.Department.deleteMany({});
      for (const d of DEPARTMENTS_30) {
        await mongoModels.Department.create(d);
      }
      console.log(`✓ MongoDB Atlas updated with all ${DEPARTMENTS_30.length} departments.`);

      await mongoModels.Counter.findOneAndUpdate(
        { _id: 'departments' },
        { $set: { seq: 31 } },
        { upsert: true }
      );
      await mongoose.disconnect();
    } catch (err) {
      console.error('MongoDB Atlas update notice:', err.message);
    }
  }
}

run().then(() => process.exit(0));
