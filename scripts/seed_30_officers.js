const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

const mongoModels = require('../backend/src/models/mongo');
const uri = (process.env.MONGODB_URI || '').trim();

const passwordHash = bcrypt.hashSync('password123', 10);

const ALL_30_OFFICERS = [
  { id: 1, dept_id: 1, email: 'officer.police@demo.com', name: 'Superintendent Rajesh Verma', role: 'police_officer', ward: 'Ward 1', phone: '+91 98301 10001' },
  { id: 2, dept_id: 2, email: 'officer.cyber@demo.com', name: 'Inspector Meera Sen', role: 'cyber_crime_officer', ward: 'Ward 2', phone: '+91 98301 10002' },
  { id: 3, dept_id: 3, email: 'officer.women@demo.com', name: 'Officer Ananya Roy', role: 'officer', ward: 'Ward 3', phone: '+91 98301 10003' },
  { id: 4, dept_id: 4, email: 'officer.traffic@demo.com', name: 'Inspector Vikram Singh', role: 'officer', ward: 'Ward 4', phone: '+91 98301 10004' },
  { id: 5, dept_id: 5, email: 'officer.pwd@demo.com', name: 'Dr. Alok Mukherjee', role: 'officer', ward: 'Ward 5', phone: '+91 98301 10005' },
  { id: 6, dept_id: 6, email: 'officer.drainage@demo.com', name: 'Er. Subrata Pal', role: 'officer', ward: 'Ward 6', phone: '+91 98301 10006' },
  { id: 7, dept_id: 7, email: 'officer.water@demo.com', name: 'Er. Debasis Das', role: 'officer', ward: 'Ward 7', phone: '+91 98301 10007' },
  { id: 8, dept_id: 8, email: 'officer.solidwaste@demo.com', name: 'Ms. Sunita Banerjee', role: 'officer', ward: 'Ward 8', phone: '+91 98301 10008' },
  { id: 9, dept_id: 9, email: 'officer.streetlighting@demo.com', name: 'Er. Rajesh Roy', role: 'officer', ward: 'Ward 9', phone: '+91 98301 10009' },
  { id: 10, dept_id: 10, email: 'officer.health@demo.com', name: 'Dr. Manoj Mondal', role: 'officer', ward: 'Ward 10', phone: '+91 98301 10010' },
  { id: 11, dept_id: 11, email: 'officer.fire@demo.com', name: 'Chief Fire Officer S. K. Bose', role: 'officer', ward: 'Ward 11', phone: '+91 98301 10011' },
  { id: 12, dept_id: 12, email: 'officer.disaster@demo.com', name: 'Officer Pradip Nandi', role: 'officer', ward: 'Ward 12', phone: '+91 98301 10012' },
  { id: 13, dept_id: 13, email: 'officer.environment@demo.com', name: 'Dr. Sharmistha Guha', role: 'officer', ward: 'Ward 13', phone: '+91 98301 10013' },
  { id: 14, dept_id: 14, email: 'officer.parks@demo.com', name: 'Ms. Ritu Sen', role: 'officer', ward: 'Ward 14', phone: '+91 98301 10014' },
  { id: 15, dept_id: 15, email: 'officer.building@demo.com', name: 'Er. Tanmoy Dutta', role: 'officer', ward: 'Ward 15', phone: '+91 98301 10015' },
  { id: 16, dept_id: 16, email: 'officer.land@demo.com', name: 'Officer Bikas Chatterjee', role: 'officer', ward: 'Ward 16', phone: '+91 98301 10016' },
  { id: 17, dept_id: 17, email: 'officer.housing@demo.com', name: 'Er. Nilanjan Ghosh', role: 'officer', ward: 'Ward 17', phone: '+91 98301 10017' },
  { id: 18, dept_id: 18, email: 'officer.electricity@demo.com', name: 'Er. Amitava Ghosh', role: 'officer', ward: 'Ward 18', phone: '+91 98301 10018' },
  { id: 19, dept_id: 19, email: 'officer.transport@demo.com', name: 'Director Amitabha Basu', role: 'officer', ward: 'Ward 19', phone: '+91 98301 10019' },
  { id: 20, dept_id: 20, email: 'officer.railway@demo.com', name: 'Liaison Officer Kalyan Das', role: 'officer', ward: 'Ward 20', phone: '+91 98301 10020' },
  { id: 21, dept_id: 21, email: 'officer.hospital@demo.com', name: 'Dr. Arunima Sanyal', role: 'officer', ward: 'Ward 1', phone: '+91 98301 10021' },
  { id: 22, dept_id: 22, email: 'officer.food@demo.com', name: 'Officer Soumen Barik', role: 'officer', ward: 'Ward 2', phone: '+91 98301 10022' },
  { id: 23, dept_id: 23, email: 'officer.consumer@demo.com', name: 'Advocate Snehasis Dey', role: 'officer', ward: 'Ward 3', phone: '+91 98301 10023' },
  { id: 24, dept_id: 24, email: 'officer.school@demo.com', name: 'Dr. Kaushik Maitra', role: 'officer', ward: 'Ward 4', phone: '+91 98301 10024' },
  { id: 25, dept_id: 25, email: 'officer.higheredu@demo.com', name: 'Prof. Debabrata Roy', role: 'officer', ward: 'Ward 5', phone: '+91 98301 10025' },
  { id: 26, dept_id: 26, email: 'officer.labour@demo.com', name: 'Officer Tanuja Mitra', role: 'officer', ward: 'Ward 6', phone: '+91 98301 10026' },
  { id: 27, dept_id: 27, email: 'officer.agriculture@demo.com', name: 'Dr. Partha Sarathi Roy', role: 'officer', ward: 'Ward 7', phone: '+91 98301 10027' },
  { id: 28, dept_id: 28, email: 'officer.animal@demo.com', name: 'Dr. Sujit Karmakar (DVM)', role: 'officer', ward: 'Ward 8', phone: '+91 98301 10028' },
  { id: 29, dept_id: 29, email: 'officer.forest@demo.com', name: 'DFO R. K. Singh', role: 'officer', ward: 'Ward 9', phone: '+91 98301 10029' },
  { id: 30, dept_id: 30, email: 'officer.grievance@demo.com', name: 'Deputy Commissioner P. K. Mallick', role: 'officer', ward: 'Ward 10', phone: '+91 98301 10030' }
];

const ADMIN_AND_CITIZEN_USERS = [
  { id: 100, dept_id: null, email: 'admin@demo.com', name: 'Pritam Ghosh (Admin)', role: 'admin', ward: 'Ward 1', phone: '+91 98765 43210' },
  { id: 101, dept_id: null, email: 'citizen@demo.com', name: 'Rahul Sharma (Citizen)', role: 'citizen', ward: 'Ward 4', phone: '+91 98111 22334' },
  { id: 102, dept_id: null, email: 'citizen.priya@demo.com', name: 'Priya Sen (Citizen)', role: 'citizen', ward: 'Ward 8', phone: '+91 98222 33445' },
  { id: 103, dept_id: null, email: 'citizen.amit@demo.com', name: 'Amit Roy (Citizen)', role: 'citizen', ward: 'Ward 12', phone: '+91 98333 44556' },
  // Backward compatibility alias for earlier drainage officer
  { id: 104, dept_id: 6, email: 'officer.drain@demo.com', name: 'Officer Tanvi Sen (Drainage)', role: 'officer', ward: 'Ward 5', phone: '+91 98304 44556' }
];

async function seedAll30Officers() {
  console.log('================================================================');
  console.log('👥 Seeding 30 Departmental Officers + Admin + Citizen Accounts');
  console.log('================================================================');

  const allUsers = [...ALL_30_OFFICERS, ...ADMIN_AND_CITIZEN_USERS].map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password_hash: passwordHash,
    role: u.role,
    phone: u.phone,
    department_id: u.dept_id,
    ward: u.ward,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  // 1. Update local database.json
  const dbJsonPath = path.join(__dirname, '../backend/data/database.json');
  let localData = { departments: [], users: [], complaints: [], complaint_timeline: [], feedback: [], notifications: [], _counters: {} };
  if (fs.existsSync(dbJsonPath)) {
    try {
      localData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
    } catch (e) {}
  }

  localData.users = allUsers;
  if (!localData._counters) localData._counters = {};
  localData._counters.users = 105;
  fs.writeFileSync(dbJsonPath, JSON.stringify(localData, null, 2), 'utf-8');
  console.log(`✓ Local database.json updated with ${allUsers.length} user accounts.`);

  // 2. Update MongoDB Atlas
  if (uri) {
    try {
      console.log('⚡ Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
      console.log('✓ Connected to MongoDB Atlas.');

      await mongoModels.User.deleteMany({});
      for (const u of allUsers) {
        await mongoModels.User.create(u);
      }
      console.log(`✓ MongoDB Atlas synced with all ${allUsers.length} officer and citizen accounts.`);
      await mongoose.disconnect();
    } catch (err) {
      console.error('MongoDB sync warning:', err.message);
    }
  }

  console.log('================================================================');
  console.log('✨ All 30 Department Logins Successfully Seeded!');
  console.log('Default password for all accounts: password123');
  console.log('================================================================');
}

seedAll30Officers().then(() => process.exit(0));
