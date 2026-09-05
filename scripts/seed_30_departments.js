const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

const mongoModels = require('../backend/src/models/mongo');
const uri = (process.env.MONGODB_URI || '').trim();

const DEPARTMENTS_30 = [
  { id: 1, name: 'Police & Law Enforcement', code: 'POL', head_name: 'Superintendent Rajesh Verma', contact_email: 'police.dept@civic.gov.in', description: 'Theft, assault, robbery, public violence, missing persons, law and order' },
  { id: 2, name: 'Cyber Crime', code: 'CYB', head_name: 'Inspector Meera Sen', contact_email: 'cyber.crime@civic.gov.in', description: 'Online financial fraud, UPI scam, phishing, account hacking, cyber harassment' },
  { id: 3, name: 'Women & Child Safety', code: 'WCS', head_name: 'Officer Ananya Roy', contact_email: 'women.safety@civic.gov.in', description: 'Street harassment, domestic violence, child abuse, stalking, victim protection' },
  { id: 4, name: 'Traffic & Road Safety', code: 'TRS', head_name: 'Inspector Vikram Singh', contact_email: 'traffic.safety@civic.gov.in', description: 'Dangerous driving, traffic signals, obstructive parking, road safety enforcement' },
  { id: 5, name: 'Roads & Public Works', code: 'PWD', head_name: 'Dr. Alok Mukherjee', contact_email: 'roads.pwd@civic.gov.in', description: 'Potholes, broken roads, damaged bridges, flyovers, road surface engineering' },
  { id: 6, name: 'Drainage & Sewerage', code: 'DSB', head_name: 'Er. Subrata Pal', contact_email: 'drainage.sewerage@civic.gov.in', description: 'Open manholes, sewage overflow, blocked drains, monsoon waterlogging' },
  { id: 7, name: 'Water Supply', code: 'WSD', head_name: 'Er. Debasis Das', contact_email: 'water.supply@civic.gov.in', description: 'Pipeline bursts, contaminated tap water, drinking water scarcity, water tankers' },
  { id: 8, name: 'Solid Waste Management', code: 'SWM', head_name: 'Ms. Sunita Banerjee', contact_email: 'solid.waste@civic.gov.in', description: 'Garbage dumping, missed collections, overflowing bins, composting, bio-waste' },
  { id: 9, name: 'Street Lighting & Electrical', code: 'SLE', head_name: 'Er. Rajesh Roy', contact_email: 'street.lighting@civic.gov.in', description: 'Broken streetlights, dangling cables, high-mast illumination, pole repairs' },
  { id: 10, name: 'Public Health & Sanitation', code: 'PHS', head_name: 'Dr. Manoj Mondal', contact_email: 'public.health@civic.gov.in', description: 'Mosquito breeding, dengue control, public toilets, food market hygiene' },
  { id: 11, name: 'Fire & Emergency Services', code: 'FES', head_name: 'Chief Fire Officer S. K. Bose', contact_email: 'fire.emergency@civic.gov.in', description: 'Fire hazards, blocked emergency exits, fire hydrants, commercial fire safety' },
  { id: 12, name: 'Disaster Management', code: 'DMA', head_name: 'Officer Pradip Nandi', contact_email: 'disaster.mgmt@civic.gov.in', description: 'Severe flood response, cyclone tree falls, building collapse, emergency relief' },
  { id: 13, name: 'Environment & Pollution', code: 'ENP', head_name: 'Dr. Sharmistha Guha', contact_email: 'env.pollution@civic.gov.in', description: 'Industrial air smoke, chemical effluents, noise pollution, water contamination' },
  { id: 14, name: 'Parks & Public Spaces', code: 'PPS', head_name: 'Ms. Ritu Sen', contact_email: 'parks.spaces@civic.gov.in', description: 'Children playgrounds, municipal parks, broken benches, public recreation grounds' },
  { id: 15, name: 'Building & Municipal Engineering', code: 'BME', head_name: 'Er. Tanmoy Dutta', contact_email: 'building.eng@civic.gov.in', description: 'Illegal construction, structurally unsound buildings, unauthorized floor additions' },
  { id: 16, name: 'Land & Land Records', code: 'LLR', head_name: 'Officer Bikas Chatterjee', contact_email: 'land.records@civic.gov.in', description: 'Government land encroachment, illegal property mutation, forged land deeds' },
  { id: 17, name: 'Housing & Urban Development', code: 'HUD', head_name: 'Er. Nilanjan Ghosh', contact_email: 'housing.urban@civic.gov.in', description: 'Affordable housing defects, slum rehabilitation, urban master plan implementation' },
  { id: 18, name: 'Electricity & Power', code: 'ELP', head_name: 'Er. Amitava Ghosh', contact_email: 'electricity.power@civic.gov.in', description: 'Distribution transformers, high-tension lines, power outages, voltage stability' },
  { id: 19, name: 'Public Transport', code: 'PTR', head_name: 'Director Amitabha Basu', contact_email: 'public.transport@civic.gov.in', description: 'Municipal buses, route schedules, bus shelters, commuter grievances' },
  { id: 20, name: 'Railway-related Public Complaints', code: 'RPC', head_name: 'Liaison Officer Kalyan Das', contact_email: 'railway.complaints@civic.gov.in', description: 'Station approach sanitation, level crossing safety, passenger amenities' },
  { id: 21, name: 'Health & Hospitals', code: 'HNH', head_name: 'Dr. Arunima Sanyal', contact_email: 'health.hospitals@civic.gov.in', description: 'Government hospital services, emergency medicines, clinic infrastructure' },
  { id: 22, name: 'Food & Public Distribution', code: 'FPD', head_name: 'Officer Soumen Barik', contact_email: 'food.distribution@civic.gov.in', description: 'Ration shop pricing, grain quality, fair price shops, public distribution' },
  { id: 23, name: 'Consumer Affairs', code: 'COA', head_name: 'Advocate Snehasis Dey', contact_email: 'consumer.affairs@civic.gov.in', description: 'Charging above MRP, warranty refusal, counterfeit goods, unfair trade practices' },
  { id: 24, name: 'Education - Schools', code: 'EDS', head_name: 'Dr. Kaushik Maitra', contact_email: 'education.schools@civic.gov.in', description: 'Primary and high school infrastructure, classroom safety, drinking water, toilets' },
  { id: 25, name: 'Higher Education', code: 'HED', head_name: 'Prof. Debabrata Roy', contact_email: 'higher.education@civic.gov.in', description: 'Colleges, universities, campus facilities, examination scheduling, anti-ragging' },
  { id: 26, name: 'Labour & Employment', code: 'LAE', head_name: 'Officer Tanuja Mitra', contact_email: 'labour.employment@civic.gov.in', description: 'Unpaid wages, construction workplace safety, minimum wage compliance' },
  { id: 27, name: 'Agriculture', code: 'AGR', head_name: 'Dr. Partha Sarathi Roy', contact_email: 'agriculture.dept@civic.gov.in', description: 'Irrigation canals, crop damage surveys, seed quality, farmer subsidies' },
  { id: 28, name: 'Animal Resources', code: 'ANR', head_name: 'Dr. Sujit Karmakar (DVM)', contact_email: 'animal.resources@civic.gov.in', description: 'Stray animal management, dog bite control, rabies vaccination, injured livestock' },
  { id: 29, name: 'Forest & Wildlife', code: 'FAW', head_name: 'Divisional Forest Officer R. K. Singh', contact_email: 'forest.wildlife@civic.gov.in', description: 'Illegal tree cutting, timber smuggling, wildlife rescue, green belt conservation' },
  { id: 30, name: 'Public Grievance / General Administration', code: 'PGA', head_name: 'Deputy Commissioner P. K. Mallick', contact_email: 'public.grievance@civic.gov.in', description: 'Certificate delays, official corruption complaints, citizen charter compliance' }
];

async function seedAll30Departments() {
  console.log('=======================================================');
  console.log('🏛️  Seeding All 30 Complaint Departments in CivicPulse AI');
  console.log('=======================================================');

  // 1. Update local database.json
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

  // Ensure Demo Users cover core roles and departments
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);
  
  // Base users
  const baseUsers = [
    { id: 1, name: 'Pritam Ghosh (Admin)', email: 'admin@demo.com', role: 'admin', phone: '+91 98765 43210', ward: 'Ward 1', department_id: null, password_hash: defaultPasswordHash },
    { id: 2, name: 'Officer Sourav Roy (PWD)', email: 'officer.pwd@demo.com', role: 'officer', phone: '+91 98301 11223', ward: 'Ward 4', department_id: 5, password_hash: defaultPasswordHash },
    { id: 3, name: 'Officer Rajesh Verma (Police)', email: 'officer.police@demo.com', role: 'police_officer', phone: '+91 98301 99887', ward: 'Ward 1', department_id: 1, password_hash: defaultPasswordHash },
    { id: 4, name: 'Officer Meera Sen (Cyber)', email: 'officer.cyber@demo.com', role: 'cyber_crime_officer', phone: '+91 98302 88776', ward: 'Ward 2', department_id: 2, password_hash: defaultPasswordHash },
    { id: 5, name: 'Officer Tanvi Sen (Drainage)', email: 'officer.drain@demo.com', role: 'officer', phone: '+91 98304 44556', ward: 'Ward 5', department_id: 6, password_hash: defaultPasswordHash },
    { id: 6, name: 'Rahul Sharma (Citizen)', email: 'citizen@demo.com', role: 'citizen', phone: '+91 98111 22334', ward: 'Ward 4', department_id: null, password_hash: defaultPasswordHash },
    { id: 7, name: 'Priya Sen (Citizen)', email: 'citizen.priya@demo.com', role: 'citizen', phone: '+91 98222 33445', ward: 'Ward 8', department_id: null, password_hash: defaultPasswordHash },
    { id: 8, name: 'Amit Roy (Citizen)', email: 'citizen.amit@demo.com', role: 'citizen', phone: '+91 98333 44556', ward: 'Ward 12', department_id: null, password_hash: defaultPasswordHash }
  ];

  localData.users = baseUsers;
  localData._counters.users = baseUsers.length + 1;

  fs.writeFileSync(dbJsonPath, JSON.stringify(localData, null, 2), 'utf-8');
  console.log(`✓ Local JSON: Configured all 30 departments and demo users.`);

  // 2. Update MongoDB Atlas
  if (uri) {
    try {
      console.log('⚡ Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
      console.log('✓ Connected to MongoDB Atlas.');

      // Clear existing departments
      await mongoModels.Department.deleteMany({});
      
      // Insert 30 departments
      for (const d of DEPARTMENTS_30) {
        await mongoModels.Department.create(d);
      }
      console.log(`✓ MongoDB Atlas: Successfully inserted all 30 departments.`);

      // Update counter
      await mongoModels.Counter.findOneAndUpdate(
        { _id: 'departments' },
        { $set: { seq: 31 } },
        { upsert: true }
      );

      // Clear and re-insert base users in Mongo
      await mongoModels.User.deleteMany({});
      for (const u of baseUsers) {
        await mongoModels.User.create(u);
      }
      console.log(`✓ MongoDB Atlas: Synced demo users and police/cyber officers.`);

      await mongoose.disconnect();
    } catch (err) {
      console.error('MongoDB Atlas update notice:', err.message);
    }
  }

  console.log('=======================================================');
  console.log('✨ 30-Department Seeding Complete!');
  console.log('=======================================================');
}

seedAll30Departments().then(() => process.exit(0));
