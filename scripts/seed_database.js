const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const db = require('../backend/src/models/db');

console.log('🌱 Starting Database Seeding...');

// Clear existing tables
db.data = {
  departments: [],
  users: [],
  complaints: [],
  complaint_timeline: [],
  feedback: [],
  notifications: [],
  _counters: {
    departments: 1,
    users: 1,
    complaints: 1,
    complaint_timeline: 1,
    feedback: 1,
    notifications: 1
  }
};

const DEPARTMENTS = [
  { name: 'Public Works Department', code: 'PWD', head_name: 'Dr. Alok Mukherjee', contact_email: 'head.pwd@civic.gov.in', description: 'Roads, flyovers, dividers, and asphalt infrastructure repair' },
  { name: 'Solid Waste Management', code: 'SWM', head_name: 'Ms. Sunita Banerjee', contact_email: 'head.swm@civic.gov.in', description: 'Garbage collection, dustbins, composting, and solid waste processing' },
  { name: 'Electrical & Lighting Department', code: 'ELD', head_name: 'Er. Rajesh Roy', contact_email: 'head.lighting@civic.gov.in', description: 'Streetlights, high-mast illumination, and public lighting poles' },
  { name: 'Water Supply Department', code: 'WSD', head_name: 'Er. Debasis Das', contact_email: 'head.water@civic.gov.in', description: 'Potable water pipelines, reservoirs, tankers, and water pressure' },
  { name: 'Drainage & Sewerage Board', code: 'DSB', head_name: 'Er. Subrata Pal', contact_email: 'head.drainage@civic.gov.in', description: 'Storm drains, sewer lines, desilting, and manhole covers' },
  { name: 'Electricity Supply & Maintenance', code: 'ESM', head_name: 'Er. Amitava Ghosh', contact_email: 'head.power@civic.gov.in', description: 'Power distribution, transformers, feeder lines, and electric safety' },
  { name: 'Traffic Police & Urban Mobility', code: 'TPUM', head_name: 'Inspector Vikram Singh', contact_email: 'head.traffic@civic.gov.in', description: 'Traffic signals, zebra crossings, road signage, and parking management' },
  { name: 'Parks & Recreation Department', code: 'PRD', head_name: 'Ms. Ritu Sen', contact_email: 'head.parks@civic.gov.in', description: 'Public parks, gardens, playgrounds, and tree maintenance' },
  { name: 'Public Health & Sanitation', code: 'PHS', head_name: 'Dr. Manoj Mondal', contact_email: 'head.sanitation@civic.gov.in', description: 'Public toilets, mosquito fogging, vector control, and hygiene' },
  { name: 'Municipal Infrastructure & Civil Works', code: 'MICW', head_name: 'Er. Tanmoy Dutta', contact_email: 'head.infra@civic.gov.in', description: 'Foot overbridges, bus stops, subways, and municipal community halls' }
];

console.log('Inserting departments...');
for (const d of DEPARTMENTS) {
  db.prepare('INSERT INTO departments (name, code, head_name, contact_email, description) VALUES (?, ?, ?, ?, ?)').run(
    d.name, d.code, d.head_name, d.contact_email, d.description
  );
}

const defaultPasswordHash = bcrypt.hashSync('password123', 10);

const USERS = [
  { name: 'Pritam Ghosh (Admin)', email: 'admin@demo.com', role: 'admin', phone: '+91 98765 43210', ward: 'Ward 1', dept_id: null },
  { name: 'Officer Sourav Roy', email: 'officer.pwd@demo.com', role: 'officer', phone: '+91 98301 11223', ward: 'Ward 4', dept_id: 1 },
  { name: 'Officer Ananya Dutta', email: 'officer.waste@demo.com', role: 'officer', phone: '+91 98302 22334', ward: 'Ward 8', dept_id: 2 },
  { name: 'Officer Bikash Paul', email: 'officer.elec@demo.com', role: 'officer', phone: '+91 98303 33445', ward: 'Ward 12', dept_id: 3 },
  { name: 'Officer Tanvi Sen', email: 'officer.drain@demo.com', role: 'officer', phone: '+91 98304 44556', ward: 'Ward 5', dept_id: 5 },
  { name: 'Rahul Sharma (Citizen)', email: 'citizen@demo.com', role: 'citizen', phone: '+91 98111 22334', ward: 'Ward 4', dept_id: null },
  { name: 'Priya Sen (Citizen)', email: 'citizen.priya@demo.com', role: 'citizen', phone: '+91 98222 33445', ward: 'Ward 8', dept_id: null },
  { name: 'Amit Roy (Citizen)', email: 'citizen.amit@demo.com', role: 'citizen', phone: '+91 98333 44556', ward: 'Ward 12', dept_id: null }
];

console.log('Inserting demo users...');
for (const u of USERS) {
  db.prepare('INSERT INTO users (name, email, password_hash, role, phone, ward, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    u.name, u.email, defaultPasswordHash, u.role, u.phone, u.ward, u.dept_id
  );
}

const DEMO_COMPLAINTS = [
  {
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
    predicted_resolution_days: 2.1,
    hours_ago: 18,
    sla_hours: 48,
    timeline: [
      { status: 'Submitted', notes: 'Complaint received and processed by ML categorization engine.' },
      { status: 'Assigned', notes: 'Assigned to PWD Field Officer Sourav Roy.' },
      { status: 'In Progress', notes: 'Road repair team dispatched with asphalt mixture.' }
    ]
  },
  {
    tracking_id: 'CMP-2026-10232',
    citizen_id: 7,
    title: 'Overflowing Garbage Bin near Vegetable Market',
    description: 'The community trash bin near Block B vegetable market has been overflowing for 3 days. Stray cattle and dogs are scattering waste across the road. Terrible stench.',
    category: 'Garbage & Waste',
    priority: 'MEDIUM',
    status: 'Resolved',
    department_id: 2,
    officer_id: 3,
    latitude: 22.9812,
    longitude: 88.4385,
    address: 'Block B Market Lane, Ward 8, Kalyani',
    ward: 'Ward 8',
    location_type: 'Market',
    affected_count: 450,
    image_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&q=80',
    resolution_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80',
    resolution_notes: 'Waste collection compactor truck deployed. Area fully cleaned, sanitized with bleaching powder.',
    ml_confidence: 0.94,
    predicted_resolution_days: 1.8,
    hours_ago: 36,
    sla_hours: 72,
    resolved_hours_ago: 4,
    rating: 5,
    comment: 'Super fast response! The municipal team cleaned the whole market perimeter.',
    timeline: [
      { status: 'Submitted', notes: 'Complaint submitted by citizen Priya Sen.' },
      { status: 'Assigned', notes: 'Routed to Solid Waste Inspector Ananya Dutta.' },
      { status: 'In Progress', notes: 'Sanitation team on site.' },
      { status: 'Resolved', notes: 'Dustbin cleared and area disinfected.' }
    ]
  },
  {
    tracking_id: 'CMP-2026-10233',
    citizen_id: 8,
    title: 'Open Live Electrical Wire Hanging near Central School',
    description: 'High tension wire snapped after storm and is dangerously hanging at 5 feet height near the entrance of Central Model School. Sparking was observed. Urgent safety hazard for schoolchildren!',
    category: 'Electricity',
    priority: 'CRITICAL',
    status: 'In Progress',
    department_id: 6,
    officer_id: 4,
    latitude: 22.9723,
    longitude: 88.4290,
    address: 'Central Model School Gate 2, Ward 12',
    ward: 'Ward 12',
    location_type: 'School',
    affected_count: 1200,
    image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=80',
    ml_confidence: 0.98,
    predicted_resolution_days: 0.8,
    hours_ago: 6,
    sla_hours: 24,
    timeline: [
      { status: 'Submitted', notes: 'Critical hazard flagged by ML safety score engine (Score: 2.0).' },
      { status: 'Assigned', notes: 'Emergency dispatch to Electrical Officer Bikash Paul.' },
      { status: 'In Progress', notes: 'Feeder line temporarily isolated; emergency crew replacing damaged cable.' }
    ]
  },
  {
    tracking_id: 'CMP-2026-10234',
    citizen_id: 6,
    title: 'Deep Uncovered Manhole on Gandhi Avenue Footpath',
    description: 'Concrete manhole cover missing on Gandhi Avenue. It is 8 feet deep and obscured by leaves. Pedestrians can fall into it at night.',
    category: 'Drainage & Sewage',
    priority: 'CRITICAL',
    status: 'Assigned',
    department_id: 5,
    officer_id: 5,
    latitude: 22.9780,
    longitude: 88.4315,
    address: 'Gandhi Avenue near Park Corner, Ward 5',
    ward: 'Ward 5',
    location_type: 'Residential',
    affected_count: 350,
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&q=80',
    ml_confidence: 0.95,
    predicted_resolution_days: 1.2,
    hours_ago: 26, // Exceeded 24h SLA -> Escalated!
    sla_hours: 24,
    is_escalated: 1,
    escalation_level: 1,
    timeline: [
      { status: 'Submitted', notes: 'Registered by citizen.' },
      { status: 'Assigned', notes: 'Assigned to Drainage Board Officer Tanvi Sen.' },
      { status: 'Assigned', notes: '⚠️ SLA Violation: 24h Critical target breached. Escalated to Department Head (Level 1).' }
    ]
  },
  {
    tracking_id: 'CMP-2026-10235',
    citizen_id: 7,
    title: 'Continuous Dark Stretch - 5 Streetlights Not Functioning',
    description: 'Streetlights from Pole SL-401 to SL-405 on Tagore Path have been fused for the last 5 days. Women and elderly feel unsafe walking after 7 PM.',
    category: 'Streetlight',
    priority: 'HIGH',
    status: 'Submitted',
    department_id: 3,
    officer_id: 4,
    latitude: 22.9695,
    longitude: 88.4410,
    address: 'Tagore Path, Sector 3, Ward 9',
    ward: 'Ward 9',
    location_type: 'Residential',
    affected_count: 280,
    image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&q=80',
    ml_confidence: 0.93,
    predicted_resolution_days: 2.0,
    hours_ago: 8,
    sla_hours: 48,
    timeline: [
      { status: 'Submitted', notes: 'Complaint logged. Pending officer inspection.' }
    ]
  }
];

console.log('Inserting demo complaints and audit timeline...');
for (const c of DEMO_COMPLAINTS) {
  const createdAt = new Date(Date.now() - (c.hours_ago || 10) * 3600 * 1000).toISOString();
  const slaDeadline = new Date(new Date(createdAt).getTime() + (c.sla_hours || 72) * 3600 * 1000).toISOString();
  const resolvedAt = c.status === 'Resolved' ? new Date(Date.now() - (c.resolved_hours_ago || 2) * 3600 * 1000).toISOString() : null;

  const insertInfo = db.prepare(`
    INSERT INTO complaints (
      tracking_id, citizen_id, title, description, category, priority, status,
      department_id, officer_id, latitude, longitude, address, ward, location_type,
      affected_count, image_url, is_duplicate, duplicate_of_id, duplicate_similarity,
      ml_confidence, ml_predicted_category, ml_predicted_priority,
      predicted_resolution_days, sla_deadline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    c.tracking_id,
    c.citizen_id,
    c.title,
    c.description,
    c.category,
    c.priority,
    c.status,
    c.department_id,
    c.officer_id,
    c.latitude,
    c.longitude,
    c.address,
    c.ward,
    c.location_type,
    c.affected_count,
    c.image_url,
    0,
    null,
    0,
    c.ml_confidence,
    c.category,
    c.priority,
    c.predicted_resolution_days,
    slaDeadline
  );

  const cid = insertInfo.lastInsertRowid;
  const complaintObj = db.data.complaints.find(comp => comp.id === cid);
  if (complaintObj) {
    complaintObj.created_at = createdAt;
    complaintObj.updated_at = createdAt;
    complaintObj.resolved_at = resolvedAt;
    complaintObj.resolution_image_url = c.resolution_image_url || null;
    complaintObj.resolution_notes = c.resolution_notes || null;
    complaintObj.is_escalated = c.is_escalated || 0;
    complaintObj.escalation_level = c.escalation_level || 0;
  }

  // Insert timeline steps
  if (c.timeline) {
    for (const step of c.timeline) {
      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, ?, ?, 'System', NULL)
      `).run(cid, step.status, step.notes);
    }
  }

  // Insert feedback if resolved
  if (c.status === 'Resolved' && c.rating) {
    db.prepare(`
      INSERT INTO feedback (complaint_id, citizen_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(cid, c.citizen_id, c.rating, c.comment);
  }
}

db.save();
console.log('✅ Database successfully seeded with departments, users, officers, and realistic complaints!');
