const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

// Load Mongoose models
const mongoModels = require('../backend/src/models/mongo');

const uri = process.env.MONGODB_URI || process.argv[2];

if (!uri) {
  console.error('\x1b[31m%s\x1b[0m', '✗ Error: No MONGODB_URI found.');
  console.log('Please set MONGODB_URI in backend/.env or pass it as an argument:');
  console.log('  node scripts/seed_mongo.js "mongodb+srv://user:pass@cluster0.../civicpulse"');
  process.exit(1);
}

async function seedMongo() {
  console.log('\x1b[36m%s\x1b[0m', `🌱 Connecting to MongoDB: ${uri.replace(/\/\/[^@]+@/, '//***:***@')}...`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MongoDB Atlas successfully.');

    console.log('Cleaning existing collections...');
    await Promise.all([
      mongoModels.Department.deleteMany({}),
      mongoModels.User.deleteMany({}),
      mongoModels.Complaint.deleteMany({}),
      mongoModels.ComplaintTimeline.deleteMany({}),
      mongoModels.Feedback.deleteMany({}),
      mongoModels.Notification.deleteMany({}),
      mongoModels.Counter.deleteMany({})
    ]);

    // 1. Departments
    console.log('Inserting municipal departments...');
    const DEPARTMENTS = [
      { id: 1, name: 'Public Works Department', code: 'PWD', head_name: 'Dr. Alok Mukherjee', contact_email: 'head.pwd@civic.gov.in', description: 'Roads, flyovers, dividers, and asphalt infrastructure repair' },
      { id: 2, name: 'Solid Waste Management', code: 'SWM', head_name: 'Ms. Sunita Banerjee', contact_email: 'head.swm@civic.gov.in', description: 'Garbage collection, dustbins, composting, and solid waste processing' },
      { id: 3, name: 'Electrical & Lighting Department', code: 'ELD', head_name: 'Er. Rajesh Roy', contact_email: 'head.lighting@civic.gov.in', description: 'Streetlights, high-mast illumination, and public lighting poles' },
      { id: 4, name: 'Water Supply Department', code: 'WSD', head_name: 'Er. Debasis Das', contact_email: 'head.water@civic.gov.in', description: 'Potable water pipelines, reservoirs, tankers, and water pressure' },
      { id: 5, name: 'Drainage & Sewerage Board', code: 'DSB', head_name: 'Er. Subrata Pal', contact_email: 'head.drainage@civic.gov.in', description: 'Storm drains, sewer lines, desilting, and manhole covers' },
      { id: 6, name: 'Electricity Supply & Maintenance', code: 'ESM', head_name: 'Er. Amitava Ghosh', contact_email: 'head.power@civic.gov.in', description: 'Power distribution, transformers, feeder lines, and electric safety' },
      { id: 7, name: 'Traffic Police & Urban Mobility', code: 'TPUM', head_name: 'Inspector Vikram Singh', contact_email: 'head.traffic@civic.gov.in', description: 'Traffic signals, zebra crossings, road signage, and parking management' },
      { id: 8, name: 'Parks & Recreation Department', code: 'PRD', head_name: 'Ms. Ritu Sen', contact_email: 'head.parks@civic.gov.in', description: 'Public parks, gardens, playgrounds, and tree maintenance' },
      { id: 9, name: 'Public Health & Sanitation', code: 'PHS', head_name: 'Dr. Manoj Mondal', contact_email: 'head.sanitation@civic.gov.in', description: 'Public toilets, mosquito fogging, vector control, and hygiene' },
      { id: 10, name: 'Municipal Infrastructure & Civil Works', code: 'MICW', head_name: 'Er. Tanmoy Dutta', contact_email: 'head.infra@civic.gov.in', description: 'Foot overbridges, bus stops, subways, and municipal community halls' }
    ];
    await mongoModels.Department.insertMany(DEPARTMENTS);

    // 2. Users
    console.log('Inserting default users (Admin, Officers, Citizens)...');
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const USERS = [
      { id: 1, name: 'Pritam Ghosh (Admin)', email: 'admin@demo.com', role: 'admin', phone: '+91 98765 43210', ward: 'Ward 1', department_id: null },
      { id: 2, name: 'Officer Sourav Roy', email: 'officer.pwd@demo.com', role: 'officer', phone: '+91 98301 11223', ward: 'Ward 4', department_id: 1 },
      { id: 3, name: 'Officer Ananya Dutta', email: 'officer.waste@demo.com', role: 'officer', phone: '+91 98302 22334', ward: 'Ward 8', department_id: 2 },
      { id: 4, name: 'Officer Bikash Paul', email: 'officer.elec@demo.com', role: 'officer', phone: '+91 98303 33445', ward: 'Ward 12', department_id: 3 },
      { id: 5, name: 'Officer Tanvi Sen', email: 'officer.drain@demo.com', role: 'officer', phone: '+91 98304 44556', ward: 'Ward 5', department_id: 5 },
      { id: 6, name: 'Rahul Sharma (Citizen)', email: 'citizen@demo.com', role: 'citizen', phone: '+91 98111 22334', ward: 'Ward 4', department_id: null },
      { id: 7, name: 'Priya Sen (Citizen)', email: 'citizen.priya@demo.com', role: 'citizen', phone: '+91 98222 33445', ward: 'Ward 8', department_id: null },
      { id: 8, name: 'Amit Roy (Citizen)', email: 'citizen.amit@demo.com', role: 'citizen', phone: '+91 98333 44556', ward: 'Ward 12', department_id: null }
    ];
    for (const u of USERS) {
      u.password_hash = defaultPasswordHash;
    }
    await mongoModels.User.insertMany(USERS);

    // 3. Complaints & Timelines
    console.log('Inserting seed complaints with GeoJSON & SLA...');
    const COMPLAINTS = [
      {
        id: 1,
        tracking_id: 'CMP-2026-10231',
        citizen_id: 6,
        title: 'Massive Pothole near Kalyani Station Road Gate 1',
        description: 'There is a huge deep pothole right on Station Road opposite the ticket counter. Several two-wheeler riders slipped in rain yesterday. Extremely hazardous during peak morning hours.',
        category: 'Road Damage',
        priority: 'HIGH',
        status: 'In Progress',
        department_id: 1,
        officer_id: 2,
        latitude: 22.9751,
        longitude: 88.4342,
        address: 'Station Road, Opp Gate 1, Kalyani',
        ward: 'Ward 4',
        location_type: 'Highway',
        affected_count: 850,
        image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80',
        ml_confidence: 0.96,
        predicted_category: 'Road Damage',
        predicted_priority: 'HIGH',
        predicted_resolution_days: 2.1,
        sla_deadline: new Date(Date.now() + 30 * 3600 * 1000),
        location: { type: 'Point', coordinates: [88.4342, 22.9751] }
      },
      {
        id: 2,
        tracking_id: 'CMP-2026-10232',
        citizen_id: 7,
        title: 'Overflowing Garbage Bin near Vegetable Market',
        description: 'The community trash bin near Block B vegetable market has been overflowing for 3 days. Stray cattle and dogs are scattering waste across the road. Terrible stench.',
        category: 'Garbage & Waste',
        priority: 'MEDIUM',
        status: 'Resolved',
        department_id: 2,
        officer_id: 3,
        latitude: 22.9782,
        longitude: 88.4365,
        address: 'Block B Market Square, Kalyani',
        ward: 'Ward 8',
        location_type: 'Market',
        affected_count: 420,
        image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&q=80',
        ml_confidence: 0.94,
        predicted_category: 'Garbage & Waste',
        predicted_priority: 'MEDIUM',
        predicted_resolution_days: 1.5,
        sla_deadline: new Date(Date.now() - 12 * 3600 * 1000),
        resolved_at: new Date(Date.now() - 10 * 3600 * 1000),
        location: { type: 'Point', coordinates: [88.4365, 22.9782] }
      },
      {
        id: 3,
        tracking_id: 'CMP-2026-10233',
        citizen_id: 8,
        title: 'Open Live Electrical Wire Hanging near Central School',
        description: 'An overhead LT distribution cable snapped and is hanging less than 5 feet above the pedestrian walkway near the main gate of Central Model School. Severe electrocution hazard for school children.',
        category: 'Electricity',
        priority: 'CRITICAL',
        status: 'In Progress',
        department_id: 6,
        officer_id: 4,
        latitude: 22.9723,
        longitude: 88.4289,
        address: 'Near Central Model School Gate, Kalyani',
        ward: 'Ward 12',
        location_type: 'School',
        affected_count: 1200,
        image_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&q=80',
        ml_confidence: 0.98,
        predicted_category: 'Electricity',
        predicted_priority: 'CRITICAL',
        predicted_resolution_days: 1.0,
        sla_deadline: new Date(Date.now() + 6 * 3600 * 1000),
        location: { type: 'Point', coordinates: [88.4289, 22.9723] }
      }
    ];
    await mongoModels.Complaint.insertMany(COMPLAINTS);

    // 4. Timelines
    const TIMELINES = [
      { id: 1, complaint_id: 1, status: 'Submitted', notes: 'Complaint received and processed by ML categorization engine.', updated_by_name: 'System' },
      { id: 2, complaint_id: 1, status: 'Assigned', notes: 'Assigned to PWD Field Officer Sourav Roy.', updated_by_name: 'System' },
      { id: 3, complaint_id: 1, status: 'In Progress', notes: 'Road repair team dispatched with asphalt mixture.', updated_by_name: 'Officer Sourav Roy' },
      { id: 4, complaint_id: 2, status: 'Submitted', notes: 'Complaint logged.', updated_by_name: 'System' },
      { id: 5, complaint_id: 2, status: 'Resolved', notes: 'Garbage removed and bin sanitized.', updated_by_name: 'Officer Ananya Dutta' }
    ];
    await mongoModels.ComplaintTimeline.insertMany(TIMELINES);

    // 5. Feedback
    const FEEDBACKS = [
      { id: 1, complaint_id: 2, citizen_id: 7, rating: 5, comment: 'Quick response! The waste was cleared within 24 hours.' }
    ];
    await mongoModels.Feedback.insertMany(FEEDBACKS);

    // 6. Set sequences
    await mongoModels.Counter.create({ _id: 'departments', seq: 11 });
    await mongoModels.Counter.create({ _id: 'users', seq: 9 });
    await mongoModels.Counter.create({ _id: 'complaints', seq: 4 });
    await mongoModels.Counter.create({ _id: 'complaint_timeline', seq: 6 });
    await mongoModels.Counter.create({ _id: 'feedback', seq: 2 });
    await mongoModels.Counter.create({ _id: 'notifications', seq: 1 });

    console.log('\x1b[32m%s\x1b[0m', '=======================================================');
    console.log('\x1b[32m%s\x1b[0m', '✓ MongoDB Atlas Database Successfully Seeded!');
    console.log(`  - ${DEPARTMENTS.length} Municipal Departments`);
    console.log(`  - ${USERS.length} Demo Accounts (Admin, Officers, Citizens)`);
    console.log(`  - ${COMPLAINTS.length} Geolocated Incident Documents`);
    console.log('\x1b[32m%s\x1b[0m', '=======================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `✗ Seeding Error: ${err.message}`);
    process.exit(1);
  }
}

seedMongo();
