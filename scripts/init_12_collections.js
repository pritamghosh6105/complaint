/**
 * CivicPulse AI — 12 Collections Database Initializer & Migration Script
 * 
 * Creates and populates the 12 core CIVICPULSE DB collections in MongoDB Atlas:
 *  1. users
 *  2. complaints
 *  3. departments
 *  4. locations
 *  5. postal_locations
 *  6. police_stations
 *  7. location_boundaries
 *  8. evidence
 *  9. ai_predictions
 *  10. complaint_history
 *  11. notifications
 *  12. feedback
 */

const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

// Load 12 Collection Models
const models = require('../backend/src/models/mongo');

const uri = (process.env.MONGODB_URI || process.argv[2] || '').trim();
if (!uri) {
  console.error('\x1b[31m%s\x1b[0m', '✗ Error: No MONGODB_URI found in backend/.env');
  process.exit(1);
}

const LOCATION_DIR = path.join(__dirname, '../location-data');

function readJsonFile(filename) {
  const fp = path.join(LOCATION_DIR, filename);
  if (fs.existsSync(fp)) {
    try {
      return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch (e) {
      console.warn(`Warning reading ${filename}: ${e.message}`);
    }
  }
  return [];
}

async function init12Collections() {
  const maskedUri = uri.replace(/\/\/[^@]+@/, '//***:***@');
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');
  console.log('\x1b[36m%s\x1b[0m', '🏛️  CivicPulse AI — 12-Collection Database Initializer');
  console.log('\x1b[36m%s\x1b[0m', `Connecting to: ${maskedUri}`);
  console.log('\x1b[36m%s\x1b[0m', '=======================================================');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const db = mongoose.connection.db;
    console.log('\x1b[32m%s\x1b[0m', `✓ Connected to MongoDB database: "${db.databaseName}"\n`);

    // 12 Target Collection Names
    const COLLECTION_NAMES = [
      'users',
      'complaints',
      'departments',
      'locations',
      'postal_locations',
      'police_stations',
      'location_boundaries',
      'evidence',
      'ai_predictions',
      'complaint_history',
      'notifications',
      'feedback'
    ];

    console.log('📌 Verifying / Creating 12 explicit collections in MongoDB...');
    const existingColls = (await db.listCollections().toArray()).map(c => c.name);

    for (const name of COLLECTION_NAMES) {
      if (!existingColls.includes(name)) {
        await db.createCollection(name);
        console.log(`  + Created collection: "${name}"`);
      } else {
        console.log(`  ✓ Collection exists:  "${name}"`);
      }
    }

    console.log('\n🧹 Clearing existing records to prepare clean structured seed...');
    await Promise.all([
      models.User.deleteMany({}),
      models.Complaint.deleteMany({}),
      models.Department.deleteMany({}),
      models.Location.deleteMany({}),
      models.PostalLocation.deleteMany({}),
      models.PoliceStation.deleteMany({}),
      models.LocationBoundary.deleteMany({}),
      models.Evidence.deleteMany({}),
      models.AiPrediction.deleteMany({}),
      models.ComplaintHistory.deleteMany({}),
      models.Notification.deleteMany({}),
      models.Feedback.deleteMany({})
    ]);

    // -------------------------------------------------------------
    // 1. DEPARTMENTS (10 Core Civic Departments)
    // -------------------------------------------------------------
    console.log('\n⏳ [1/12] Seeding departments collection...');
    const DEPARTMENTS = [
      { id: 1, name: 'Public Works Department', code: 'PWD', head_name: 'Dr. Alok Mukherjee', contact_email: 'head.pwd@civic.gov.in', description: 'Roads, bridges, flyovers, potholes, pavements and asphalt infrastructure repair' },
      { id: 2, name: 'Solid Waste Management', code: 'SWM', head_name: 'Ms. Sunita Banerjee', contact_email: 'head.swm@civic.gov.in', description: 'Garbage collection, dustbins, composting, and solid waste processing' },
      { id: 3, name: 'Electrical & Lighting Department', code: 'ELD', head_name: 'Er. Rajesh Roy', contact_email: 'head.lighting@civic.gov.in', description: 'Streetlights, high-mast illumination, electrical poles, and public lighting' },
      { id: 4, name: 'Water Supply Department', code: 'WSD', head_name: 'Er. Debasis Das', contact_email: 'head.water@civic.gov.in', description: 'Potable water pipelines, reservoirs, tankers, leaks, and low pressure' },
      { id: 5, name: 'Drainage & Sewerage Board', code: 'DSB', head_name: 'Er. Subrata Pal', contact_email: 'head.drainage@civic.gov.in', description: 'Storm drains, sewer lines, waterlogging, desilting, and manhole covers' },
      { id: 6, name: 'Electricity Supply & Maintenance', code: 'ESM', head_name: 'Er. Amitava Ghosh', contact_email: 'head.power@civic.gov.in', description: 'Power distribution, transformers, feeder lines, overhead cables, and electric safety' },
      { id: 7, name: 'Traffic Police & Urban Mobility', code: 'TPUM', head_name: 'Inspector Vikram Singh', contact_email: 'head.traffic@civic.gov.in', description: 'Traffic signals, zebra crossings, road signage, congestion, and parking management' },
      { id: 8, name: 'Parks & Recreation Department', code: 'PRD', head_name: 'Ms. Ritu Sen', contact_email: 'head.parks@civic.gov.in', description: 'Public parks, gardens, playgrounds, tree pruning, and green spaces' },
      { id: 9, name: 'Public Health & Sanitation', code: 'PHS', head_name: 'Dr. Manoj Mondal', contact_email: 'head.sanitation@civic.gov.in', description: 'Public toilets, mosquito fogging, vector control, vector hygiene, and sanitation' },
      { id: 10, name: 'Municipal Infrastructure & Civil Works', code: 'MICW', head_name: 'Er. Tanmoy Dutta', contact_email: 'head.infra@civic.gov.in', description: 'Foot overbridges, bus stops, subways, and municipal community halls' }
    ];
    await models.Department.insertMany(DEPARTMENTS);
    console.log(`  ✓ Inserted ${DEPARTMENTS.length} departments.`);

    // -------------------------------------------------------------
    // 2. USERS (Admin, Officers, Citizens)
    // -------------------------------------------------------------
    console.log('⏳ [2/12] Seeding users collection...');
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const USERS = [
      { id: 1, name: 'Pritam Ghosh (Admin)', email: 'admin@demo.com', password_hash: defaultPasswordHash, role: 'admin', phone: '+91 98765 43210', ward: 'Ward 1', department_id: null },
      { id: 2, name: 'Officer Sourav Roy', email: 'officer.pwd@demo.com', password_hash: defaultPasswordHash, role: 'officer', phone: '+91 98301 11223', ward: 'Ward 4', department_id: 1 },
      { id: 3, name: 'Officer Ananya Dutta', email: 'officer.waste@demo.com', password_hash: defaultPasswordHash, role: 'officer', phone: '+91 98302 22334', ward: 'Ward 8', department_id: 2 },
      { id: 4, name: 'Officer Bikash Paul', email: 'officer.elec@demo.com', password_hash: defaultPasswordHash, role: 'officer', phone: '+91 98303 33445', ward: 'Ward 12', department_id: 3 },
      { id: 5, name: 'Officer Tanvi Sen', email: 'officer.drain@demo.com', password_hash: defaultPasswordHash, role: 'officer', phone: '+91 98304 44556', ward: 'Ward 5', department_id: 5 },
      { id: 6, name: 'Rahul Sharma (Citizen)', email: 'citizen@demo.com', password_hash: defaultPasswordHash, role: 'citizen', phone: '+91 98111 22334', ward: 'Ward 4', department_id: null },
      { id: 7, name: 'Priya Sen (Citizen)', email: 'citizen.priya@demo.com', password_hash: defaultPasswordHash, role: 'citizen', phone: '+91 98222 33445', ward: 'Ward 8', department_id: null },
      { id: 8, name: 'Amit Roy (Citizen)', email: 'citizen.amit@demo.com', password_hash: defaultPasswordHash, role: 'citizen', phone: '+91 98333 44556', ward: 'Ward 12', department_id: null }
    ];
    await models.User.insertMany(USERS);
    console.log(`  ✓ Inserted ${USERS.length} users.`);

    // -------------------------------------------------------------
    // 3. LOCATIONS (Unified Administrative Entities)
    // -------------------------------------------------------------
    console.log('⏳ [3/12] Seeding locations collection (Districts, Subdivisions, ULBs, Wards, Blocks, GPs, Mouzas)...');
    const rawDistricts = readJsonFile('districts.json');
    const rawSubdivisions = readJsonFile('subdivisions.json');
    const rawUlbs = readJsonFile('urban_local_bodies.json');
    const rawWards = readJsonFile('wards.json');
    const rawBlocks = readJsonFile('blocks.json');
    const rawGps = readJsonFile('gram_panchayats.json');
    const rawMouzas = readJsonFile('villages_mouzas.json');

    const unifiedLocations = [];
    let locCounter = 1;

    // A. Districts
    for (const d of rawDistricts) {
      unifiedLocations.push({
        id: locCounter++,
        name: d.name,
        code: d.code,
        type: 'district',
        parent_id: null,
        parent_type: 'state',
        district_id: d.id,
        division: d.division,
        headquarters: d.headquarters,
        center_lat: d.center_lat || 22.5,
        center_lng: d.center_lng || 88.3,
        location: {
          type: 'Point',
          coordinates: [d.center_lng || 88.3, d.center_lat || 22.5]
        },
        is_active: d.is_active !== undefined ? d.is_active : 1
      });
    }

    // B. Subdivisions
    for (const s of rawSubdivisions) {
      unifiedLocations.push({
        id: locCounter++,
        name: s.name,
        code: `SUB-${s.id}`,
        type: 'subdivision',
        parent_id: s.district_id,
        parent_type: 'district',
        district_id: s.district_id,
        subdivision_id: s.id,
        headquarters: s.headquarters,
        center_lat: 22.7,
        center_lng: 88.4,
        location: { type: 'Point', coordinates: [88.4, 22.7] },
        is_active: s.is_active !== undefined ? s.is_active : 1
      });
    }

    // C. ULBs (Municipal Corporations & Municipalities)
    for (const u of rawUlbs) {
      unifiedLocations.push({
        id: locCounter++,
        name: u.name,
        code: u.code || `ULB-${u.id}`,
        type: 'ulb',
        ulb_type: u.type || 'Municipality',
        parent_id: u.subdivision_id || u.district_id,
        parent_type: u.subdivision_id ? 'subdivision' : 'district',
        district_id: u.district_id,
        subdivision_id: u.subdivision_id,
        ulb_id: u.id,
        center_lat: u.lat || 22.7,
        center_lng: u.lng || 88.4,
        location: { type: 'Point', coordinates: [u.lng || 88.4, u.lat || 22.7] },
        is_active: u.is_active !== undefined ? u.is_active : 1
      });
    }

    // D. Wards (Sample top 100 to ensure fast initialization)
    const sampledWards = (rawWards || []).slice(0, 100);
    for (const w of sampledWards) {
      unifiedLocations.push({
        id: locCounter++,
        name: w.name || `Ward ${w.ward_number}`,
        code: w.code || `WRD-${w.id}`,
        type: 'ward',
        ward_number: w.ward_number,
        parent_id: w.ulb_id,
        parent_type: 'ulb',
        ulb_id: w.ulb_id,
        center_lat: 22.72 + (w.ward_number * 0.005),
        center_lng: 88.45 + (w.ward_number * 0.005),
        location: { type: 'Point', coordinates: [88.45 + (w.ward_number * 0.005), 22.72 + (w.ward_number * 0.005)] },
        is_active: w.is_active !== undefined ? w.is_active : 1
      });
    }

    // E. CD Blocks
    for (const b of rawBlocks) {
      unifiedLocations.push({
        id: locCounter++,
        name: b.name,
        code: b.code || `BLK-${b.id}`,
        type: 'block',
        parent_id: b.subdivision_id || b.district_id,
        parent_type: 'subdivision',
        district_id: b.district_id,
        subdivision_id: b.subdivision_id,
        block_id: b.id,
        headquarters: b.headquarters,
        center_lat: b.lat || 22.8,
        center_lng: b.lng || 88.5,
        location: { type: 'Point', coordinates: [b.lng || 88.5, b.lat || 22.8] },
        is_active: b.is_active !== undefined ? b.is_active : 1
      });
    }

    // F. Gram Panchayats
    for (const g of rawGps) {
      unifiedLocations.push({
        id: locCounter++,
        name: g.name,
        code: g.code || `GP-${g.id}`,
        type: 'gram_panchayat',
        parent_id: g.block_id,
        parent_type: 'block',
        block_id: g.block_id,
        gram_panchayat_id: g.id,
        headquarters: g.headquarters,
        center_lat: g.lat || 22.82,
        center_lng: g.lng || 88.52,
        location: { type: 'Point', coordinates: [g.lng || 88.52, g.lat || 22.82] },
        is_active: g.is_active !== undefined ? g.is_active : 1
      });
    }

    // G. Villages / Mouzas
    for (const v of rawMouzas) {
      unifiedLocations.push({
        id: locCounter++,
        name: v.name,
        code: `MOUZA-${v.id}`,
        type: 'village_mouza',
        jl_no: v.jl_no,
        mouza: v.mouza || v.name,
        parent_id: v.gram_panchayat_id,
        parent_type: 'gram_panchayat',
        gram_panchayat_id: v.gram_panchayat_id,
        center_lat: v.lat || 22.85,
        center_lng: v.lng || 88.55,
        location: { type: 'Point', coordinates: [v.lng || 88.55, v.lat || 22.85] },
        is_active: v.is_active !== undefined ? v.is_active : 1
      });
    }

    await models.Location.insertMany(unifiedLocations);
    console.log(`  ✓ Inserted ${unifiedLocations.length} locations across all administrative levels.`);

    // -------------------------------------------------------------
    // 4. POSTAL LOCATIONS (Pincodes & Localities)
    // -------------------------------------------------------------
    console.log('⏳ [4/12] Seeding postal_locations collection...');
    const rawPostcodes = readJsonFile('postcodes.json');
    const postalDocs = rawPostcodes.map((p, idx) => ({
      id: idx + 1,
      pincode: String(p.pincode).trim(),
      district_id: p.district_id || 1,
      subdivision_id: p.subdivision_id || 1,
      post_office: p.post_office,
      locality: p.locality || p.post_office,
      lat: p.lat || 22.57,
      lng: p.lng || 88.36,
      location: {
        type: 'Point',
        coordinates: [p.lng || 88.36, p.lat || 22.57]
      },
      state: 'West Bengal',
      circle: 'West Bengal Circle',
      is_active: 1
    }));
    await models.PostalLocation.insertMany(postalDocs);
    console.log(`  ✓ Inserted ${postalDocs.length} postal_locations.`);

    // -------------------------------------------------------------
    // 5. POLICE STATIONS (Thanas & Commissionerates)
    // -------------------------------------------------------------
    console.log('⏳ [5/12] Seeding police_stations collection...');
    const rawPs = readJsonFile('police_stations.json');
    const psDocs = rawPs.map((ps) => ({
      id: ps.id,
      name: ps.name,
      code: ps.code,
      commissionerate: ps.commissionerate || 'State Police',
      district_id: ps.district_id,
      subdivision_id: ps.subdivision_id || 1,
      phone: ps.phone || '+91 33 2214 3000',
      email: `${(ps.code || 'ps').toLowerCase()}@wbpolice.gov.in`,
      officer_in_charge: 'Inspector In-Charge',
      lat: ps.lat || 22.58,
      lng: ps.lng || 88.38,
      location: {
        type: 'Point',
        coordinates: [ps.lng || 88.38, ps.lat || 22.58]
      },
      jurisdiction_area: ps.commissionerate || 'Local Municipal Limits',
      is_active: ps.is_active !== undefined ? ps.is_active : 1
    }));
    await models.PoliceStation.insertMany(psDocs);
    console.log(`  ✓ Inserted ${psDocs.length} police_stations.`);

    // -------------------------------------------------------------
    // 6. LOCATION BOUNDARIES (GIS Polygons & Heatmap Zones)
    // -------------------------------------------------------------
    console.log('⏳ [6/12] Seeding location_boundaries collection...');
    const BOUNDARIES = [
      {
        id: 1,
        location_id: 1,
        location_type: 'district',
        name: 'Kolkata District Metropolitan Boundary',
        code: 'GEO-KOL',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.3100, 22.5000],
            [88.4200, 22.5000],
            [88.4200, 22.6200],
            [88.3100, 22.6200],
            [88.3100, 22.5000]
          ]]
        },
        bbox: [88.3100, 22.5000, 88.4200, 22.6200],
        area_sq_km: 206.08,
        centroid_lat: 22.5726,
        centroid_lng: 88.3639
      },
      {
        id: 2,
        location_id: 2,
        location_type: 'district',
        name: 'North 24 Parganas Administrative Boundary',
        code: 'GEO-N24P',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.3500, 22.6000],
            [88.6500, 22.6000],
            [88.6500, 22.9500],
            [88.3500, 22.9500],
            [88.3500, 22.6000]
          ]]
        },
        bbox: [88.3500, 22.6000, 88.6500, 22.9500],
        area_sq_km: 4094.00,
        centroid_lat: 22.7230,
        centroid_lng: 88.4800
      },
      {
        id: 3,
        location_id: 4,
        location_type: 'ulb',
        name: 'Bidhannagar Municipal Corporation (BMC)',
        code: 'GEO-BMC',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.4000, 22.5600],
            [88.4600, 22.5600],
            [88.4600, 22.6200],
            [88.4000, 22.6200],
            [88.4000, 22.5600]
          ]]
        },
        bbox: [88.4000, 22.5600, 88.4600, 22.6200],
        area_sq_km: 60.50,
        centroid_lat: 22.5850,
        centroid_lng: 88.4330
      },
      {
        id: 4,
        location_id: 6,
        location_type: 'ulb',
        name: 'Kalyani Municipality Urban Zone',
        code: 'GEO-KLY',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.4100, 22.9500],
            [88.4600, 22.9500],
            [88.4600, 23.0000],
            [88.4100, 23.0000],
            [88.4100, 22.9500]
          ]]
        },
        bbox: [88.4100, 22.9500, 88.4600, 23.0000],
        area_sq_km: 29.14,
        centroid_lat: 22.9750,
        centroid_lng: 88.4340
      }
    ];
    await models.LocationBoundary.insertMany(BOUNDARIES);
    console.log(`  ✓ Inserted ${BOUNDARIES.length} location_boundaries.`);

    // -------------------------------------------------------------
    // 7. COMPLAINTS (Civic Grievances)
    // -------------------------------------------------------------
    console.log('⏳ [7/12] Seeding complaints collection...');
    const COMPLAINTS = [
      {
        id: 1,
        tracking_id: 'CMP-2026-10231',
        citizen_id: 6,
        title: 'Massive Pothole near Kalyani Station Road Gate 1',
        description: 'There is a huge deep pothole right on Station Road opposite the ticket counter. Several two-wheeler riders slipped in rain yesterday. Extremely hazardous during peak morning hours.',
        category: 'Roads & Public Works',
        subcategory: 'Pothole / Surface Crater',
        priority: 'HIGH',
        status: 'In Progress',
        department_id: 1,
        officer_id: 2,
        latitude: 22.9750,
        longitude: 88.4340,
        location: { type: 'Point', coordinates: [88.4340, 22.9750] },
        address: 'Station Road, Gate No 1, Kalyani, Nadia, WB',
        district_id: 6,
        district: 'Nadia',
        subdivision: 'Kalyani',
        municipality: 'Kalyani Municipality',
        ward: 'Ward 4',
        location_type: 'Commercial / Transit Corridor',
        affected_count: 350,
        sla_deadline: new Date(Date.now() + 48 * 3600000),
        created_at: new Date(Date.now() - 36 * 3600000),
        updated_at: new Date(Date.now() - 6 * 3600000)
      },
      {
        id: 2,
        tracking_id: 'CMP-2026-10232',
        citizen_id: 7,
        title: 'Overflowing Garbage Vat near Salt Lake City Centre 1',
        description: 'Municipal garbage vat has been overflowing for 3 days. Stray cattle and dogs are scattering waste across the roadway causing foul odor and health hazard.',
        category: 'Solid Waste Management',
        subcategory: 'Overflowing Garbage Vat / Bin',
        priority: 'HIGH',
        status: 'Under Review',
        department_id: 2,
        officer_id: 3,
        latitude: 22.5850,
        longitude: 88.4100,
        location: { type: 'Point', coordinates: [88.4100, 22.5850] },
        address: 'Block DC, Sector 1, Bidhannagar, Kolkata 700064',
        district_id: 2,
        district: 'North 24 Parganas',
        subdivision: 'Bidhannagar',
        municipality: 'Bidhannagar Municipal Corporation',
        ward: 'Ward 8',
        location_type: 'Market / Commercial',
        affected_count: 500,
        sla_deadline: new Date(Date.now() + 24 * 3600000),
        created_at: new Date(Date.now() - 20 * 3600000),
        updated_at: new Date(Date.now() - 4 * 3600000)
      },
      {
        id: 3,
        tracking_id: 'CMP-2026-10233',
        citizen_id: 8,
        title: 'Streetlights Out for 5 Consecutive Days in Sector V',
        description: 'Complete blackout of 6 consecutive LED high-mast lights along Ring Road in Sector V near Webel Bhavan. Women commuters feel unsafe walking to metro after 8 PM.',
        category: 'Street Lighting & Electrical',
        subcategory: 'Streetlight Completely Off (Dark Corridor)',
        priority: 'CRITICAL',
        status: 'Assigned',
        department_id: 3,
        officer_id: 4,
        latitude: 22.5720,
        longitude: 88.4330,
        location: { type: 'Point', coordinates: [88.4330, 22.5720] },
        address: 'Ring Road near Webel Bhavan, Sector V, Salt Lake, Kolkata 700091',
        district_id: 2,
        district: 'North 24 Parganas',
        subdivision: 'Bidhannagar',
        municipality: 'Bidhannagar Municipal Corporation',
        ward: 'Ward 12',
        location_type: 'Tech Park / Public Transit Corridor',
        affected_count: 850,
        sla_deadline: new Date(Date.now() + 18 * 3600000),
        created_at: new Date(Date.now() - 12 * 3600000),
        updated_at: new Date(Date.now() - 2 * 3600000)
      },
      {
        id: 4,
        tracking_id: 'CMP-2026-10234',
        citizen_id: 6,
        title: 'Clogged Stormwater Drain Causing Waterlogging in Gariahat',
        description: 'Storm drain is blocked with construction plastic debris. Rainwater is accumulating up to 1.5 feet on the footpath preventing pedestrian access to shops.',
        category: 'Drainage & Sewerage',
        subcategory: 'Blocked Storm Water Drain',
        priority: 'MEDIUM',
        status: 'Resolved',
        department_id: 5,
        officer_id: 5,
        latitude: 22.5180,
        longitude: 88.3650,
        location: { type: 'Point', coordinates: [88.3650, 22.5180] },
        address: 'Rashbehari Avenue crossing, Gariahat, Kolkata 700019',
        district_id: 1,
        district: 'Kolkata',
        subdivision: 'Kolkata South',
        municipality: 'Kolkata Municipal Corporation',
        ward: 'Ward 85',
        location_type: 'Shopping Arcade',
        affected_count: 200,
        sla_deadline: new Date(Date.now() - 10 * 3600000),
        resolved_at: new Date(Date.now() - 8 * 3600000),
        created_at: new Date(Date.now() - 72 * 3600000),
        updated_at: new Date(Date.now() - 8 * 3600000)
      }
    ];
    await models.Complaint.insertMany(COMPLAINTS);
    console.log(`  ✓ Inserted ${COMPLAINTS.length} complaints.`);

    // -------------------------------------------------------------
    // 8. EVIDENCE (Photo/Document/Proof Storage)
    // -------------------------------------------------------------
    console.log('⏳ [8/12] Seeding evidence collection...');
    const EVIDENCE = [
      {
        id: 1,
        complaint_id: 1,
        uploaded_by: 6,
        uploader_role: 'citizen',
        secure_url: '/uploads/pothole_kalyani_initial.jpg',
        thumbnail_url: '/uploads/pothole_kalyani_initial.jpg',
        file_type: 'image',
        format: 'jpg',
        original_filename: 'camera_capture_pothole_1.jpg',
        file_size_bytes: 342150,
        stage: 'initial_submission',
        gps_latitude: 22.9750,
        gps_longitude: 88.4340,
        sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        verification_status: 'verified'
      },
      {
        id: 2,
        complaint_id: 2,
        uploaded_by: 7,
        uploader_role: 'citizen',
        secure_url: '/uploads/garbage_vat_bidhannagar.jpg',
        thumbnail_url: '/uploads/garbage_vat_bidhannagar.jpg',
        file_type: 'image',
        format: 'jpg',
        original_filename: 'vat_overflow_waste.jpg',
        file_size_bytes: 489200,
        stage: 'initial_submission',
        gps_latitude: 22.5850,
        gps_longitude: 88.4100,
        sha256_hash: 'd41d8cd98f00b204e9800998ecf8427e',
        verification_status: 'verified'
      },
      {
        id: 3,
        complaint_id: 4,
        uploaded_by: 5,
        uploader_role: 'officer',
        secure_url: '/uploads/drain_cleared_after.jpg',
        thumbnail_url: '/uploads/drain_cleared_after.jpg',
        file_type: 'image',
        format: 'jpg',
        original_filename: 'work_completion_photo.jpg',
        file_size_bytes: 512000,
        stage: 'resolution_proof',
        gps_latitude: 22.5180,
        gps_longitude: 88.3650,
        verification_status: 'verified'
      }
    ];
    await models.Evidence.insertMany(EVIDENCE);
    console.log(`  ✓ Inserted ${EVIDENCE.length} evidence records.`);

    // -------------------------------------------------------------
    // 9. AI PREDICTIONS (NLP + Vision Multi-Model Analytics)
    // -------------------------------------------------------------
    console.log('⏳ [9/12] Seeding ai_predictions collection...');
    const AI_PREDICTIONS = [
      {
        id: 1,
        complaint_id: 1,
        model_name: 'CivicPulse-NLP-TFIDF-LR-v2.4',
        model_version: '2.4.0',
        category_prediction: {
          predicted_category: 'Roads & Public Works',
          subcategory: 'Pothole / Surface Crater',
          confidence: 0.964,
          top_categories: [
            { category: 'Roads & Public Works', score: 0.964 },
            { category: 'Traffic Police & Urban Mobility', score: 0.021 }
          ]
        },
        priority_prediction: {
          predicted_priority: 'HIGH',
          urgency_score: 0.88,
          hazard_keywords: ['pothole', 'riders slipped', 'hazardous', 'morning peak'],
          risk_factors: ['High vehicle transit corridor', 'Physical injury danger']
        },
        duplicate_analysis: {
          is_duplicate: false,
          similarity_score: 0.12,
          spatial_distance_meters: 1420.0
        },
        sla_prediction: {
          predicted_resolution_days: 2.1,
          recommended_deadline_hours: 48
        },
        vision_analysis: {
          image_quality: 'GOOD',
          detected_objects: [{ label: 'pothole', confidence: 0.94, box: [120, 80, 480, 360] }],
          visual_severity: 'HIGH',
          visual_risk: 'High vehicle hazard',
          evidence_consistency: 'MATCH',
          authenticity_score: 0.98
        }
      },
      {
        id: 2,
        complaint_id: 2,
        model_name: 'CivicPulse-NLP-TFIDF-LR-v2.4',
        model_version: '2.4.0',
        category_prediction: {
          predicted_category: 'Solid Waste Management',
          subcategory: 'Overflowing Garbage Vat / Bin',
          confidence: 0.982,
          top_categories: [
            { category: 'Solid Waste Management', score: 0.982 },
            { category: 'Public Health & Sanitation', score: 0.015 }
          ]
        },
        priority_prediction: {
          predicted_priority: 'HIGH',
          urgency_score: 0.82,
          hazard_keywords: ['overflowing', 'health hazard', 'odor', 'stray cattle'],
          risk_factors: ['Public health disease vector', 'Footpath blockage']
        },
        duplicate_analysis: {
          is_duplicate: false,
          similarity_score: 0.08
        },
        sla_prediction: {
          predicted_resolution_days: 1.0,
          recommended_deadline_hours: 24
        },
        vision_analysis: {
          image_quality: 'GOOD',
          detected_objects: [{ label: 'garbage_pile', confidence: 0.96 }],
          visual_severity: 'HIGH',
          evidence_consistency: 'MATCH',
          authenticity_score: 0.99
        }
      },
      {
        id: 3,
        complaint_id: 3,
        model_name: 'CivicPulse-NLP-TFIDF-LR-v2.4',
        model_version: '2.4.0',
        category_prediction: {
          predicted_category: 'Street Lighting & Electrical',
          subcategory: 'Streetlight Completely Off (Dark Corridor)',
          confidence: 0.975,
          top_categories: [
            { category: 'Street Lighting & Electrical', score: 0.975 },
            { category: 'Women & Child Safety', score: 0.018 }
          ]
        },
        priority_prediction: {
          predicted_priority: 'CRITICAL',
          urgency_score: 0.95,
          hazard_keywords: ['blackout', 'unsafe', 'metro', 'darkness'],
          risk_factors: ['Women safety corridor', 'High pedestrian night commute']
        },
        duplicate_analysis: {
          is_duplicate: false,
          similarity_score: 0.05
        },
        sla_prediction: {
          predicted_resolution_days: 0.8,
          recommended_deadline_hours: 18
        }
      }
    ];
    await models.AiPrediction.insertMany(AI_PREDICTIONS);
    console.log(`  ✓ Inserted ${AI_PREDICTIONS.length} ai_predictions.`);

    // -------------------------------------------------------------
    // 10. COMPLAINT HISTORY (Audit Stepper & Timeline Events)
    // -------------------------------------------------------------
    console.log('⏳ [10/12] Seeding complaint_history collection...');
    const HISTORY = [
      {
        id: 1,
        complaint_id: 1,
        action: 'SUBMITTED',
        status: 'Submitted',
        notes: 'Complaint submitted by citizen via Mobile Web Portal with geotagged photo evidence.',
        updated_by_name: 'Rahul Sharma (Citizen)',
        updated_by_user_id: 6,
        updated_by_role: 'citizen',
        created_at: new Date(Date.now() - 36 * 3600000)
      },
      {
        id: 2,
        complaint_id: 1,
        action: 'AI_ANALYZED',
        status: 'AI Analyzed',
        notes: 'AI Model classified domain as Roads & Public Works (96.4% confidence) with HIGH priority safety alert.',
        updated_by_name: 'CivicPulse AI Engine',
        updated_by_role: 'system',
        created_at: new Date(Date.now() - 35 * 3600000)
      },
      {
        id: 3,
        complaint_id: 1,
        action: 'ASSIGNED',
        status: 'Assigned',
        notes: 'Assigned automatically to Field Officer Sourav Roy (PWD Zone 4).',
        updated_by_name: 'Automated Dispatcher',
        updated_by_role: 'system',
        created_at: new Date(Date.now() - 30 * 3600000)
      },
      {
        id: 4,
        complaint_id: 1,
        action: 'IN_PROGRESS',
        status: 'In Progress',
        notes: 'PWD road crew arrived at site with cold-mix asphalt patching material. Work underway.',
        updated_by_name: 'Officer Sourav Roy',
        updated_by_user_id: 2,
        updated_by_role: 'officer',
        created_at: new Date(Date.now() - 6 * 3600000)
      },
      {
        id: 5,
        complaint_id: 4,
        action: 'RESOLVED',
        status: 'Resolved',
        notes: 'Stormwater culvert cleared of plastic bottles and sediment. Water flowing freely without stagnation.',
        updated_by_name: 'Officer Tanvi Sen',
        updated_by_user_id: 5,
        updated_by_role: 'officer',
        created_at: new Date(Date.now() - 8 * 3600000)
      }
    ];
    await models.ComplaintHistory.insertMany(HISTORY);
    console.log(`  ✓ Inserted ${HISTORY.length} complaint_history records.`);

    // -------------------------------------------------------------
    // 11. NOTIFICATIONS (Citizen & Officer In-App Alerts)
    // -------------------------------------------------------------
    console.log('⏳ [11/12] Seeding notifications collection...');
    const NOTIFICATIONS = [
      {
        id: 1,
        user_id: 6,
        title: 'Status Update: In Progress',
        message: 'Your complaint CMP-2026-10231 regarding "Massive Pothole" is now being repaired by PWD.',
        type: 'status_update',
        complaint_id: 1,
        tracking_id: 'CMP-2026-10231',
        link: '/track/CMP-2026-10231',
        is_read: false,
        created_at: new Date(Date.now() - 6 * 3600000)
      },
      {
        id: 2,
        user_id: 2,
        title: 'New High-Priority Ticket Assigned',
        message: 'Ticket CMP-2026-10231 (Pothole near Kalyani Station Road) assigned to your ward roster.',
        type: 'assignment',
        complaint_id: 1,
        tracking_id: 'CMP-2026-10231',
        link: '/officer',
        is_read: true,
        created_at: new Date(Date.now() - 30 * 3600000)
      },
      {
        id: 3,
        user_id: 4,
        title: 'SLA Escalation Alert',
        message: 'Ticket CMP-2026-10233 (Sector V Streetlight Blackout) has 18 hours left before Level 1 Escalation.',
        type: 'sla_warning',
        complaint_id: 3,
        tracking_id: 'CMP-2026-10233',
        link: '/officer',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 3600000)
      }
    ];
    await models.Notification.insertMany(NOTIFICATIONS);
    console.log(`  ✓ Inserted ${NOTIFICATIONS.length} notifications.`);

    // -------------------------------------------------------------
    // 12. FEEDBACK (Citizen Star Reviews & Satisfaction)
    // -------------------------------------------------------------
    console.log('⏳ [12/12] Seeding feedback collection...');
    const FEEDBACK = [
      {
        id: 1,
        complaint_id: 4,
        citizen_id: 6,
        rating: 5,
        timeliness_rating: 5,
        quality_rating: 5,
        officer_behavior_rating: 5,
        comment: 'Outstanding response! The drainage board cleared the waterlogging within 24 hours of filing.',
        is_public: true,
        created_at: new Date(Date.now() - 6 * 3600000)
      }
    ];
    await models.Feedback.insertMany(FEEDBACK);
    console.log(`  ✓ Inserted ${FEEDBACK.length} feedback records.`);

    // -------------------------------------------------------------
    // COUNTERS INITIALIZATION
    // -------------------------------------------------------------
    console.log('\n🔢 Initializing sequence counters...');
    const seqs = [
      { _id: 'users', seq: USERS.length + 1 },
      { _id: 'complaints', seq: COMPLAINTS.length + 1 },
      { _id: 'departments', seq: DEPARTMENTS.length + 1 },
      { _id: 'locations', seq: unifiedLocations.length + 1 },
      { _id: 'postal_locations', seq: postalDocs.length + 1 },
      { _id: 'police_stations', seq: psDocs.length + 1 },
      { _id: 'location_boundaries', seq: BOUNDARIES.length + 1 },
      { _id: 'evidence', seq: EVIDENCE.length + 1 },
      { _id: 'ai_predictions', seq: AI_PREDICTIONS.length + 1 },
      { _id: 'complaint_history', seq: HISTORY.length + 1 },
      { _id: 'notifications', seq: NOTIFICATIONS.length + 1 },
      { _id: 'feedback', seq: FEEDBACK.length + 1 }
    ];
    for (const s of seqs) {
      await models.Counter.findByIdAndUpdate(s._id, { $set: { seq: s.seq } }, { upsert: true });
    }

    // -------------------------------------------------------------
    // VERIFICATION & REPORT
    // -------------------------------------------------------------
    console.log('\n=======================================================');
    console.log('🎉 CIVICPULSE DB — 12 Collections Verification');
    console.log('=======================================================');

    const counts = await Promise.all([
      models.User.countDocuments(),
      models.Complaint.countDocuments(),
      models.Department.countDocuments(),
      models.Location.countDocuments(),
      models.PostalLocation.countDocuments(),
      models.PoliceStation.countDocuments(),
      models.LocationBoundary.countDocuments(),
      models.Evidence.countDocuments(),
      models.AiPrediction.countDocuments(),
      models.ComplaintHistory.countDocuments(),
      models.Notification.countDocuments(),
      models.Feedback.countDocuments()
    ]);

    const report = [
      { index: 1, collection: 'users', documents: counts[0], status: 'Active' },
      { index: 2, collection: 'complaints', documents: counts[1], status: 'Active' },
      { index: 3, collection: 'departments', documents: counts[2], status: 'Active' },
      { index: 4, collection: 'locations', documents: counts[3], status: 'Active' },
      { index: 5, collection: 'postal_locations', documents: counts[4], status: 'Active' },
      { index: 6, collection: 'police_stations', documents: counts[5], status: 'Active' },
      { index: 7, collection: 'location_boundaries', documents: counts[6], status: 'Active' },
      { index: 8, collection: 'evidence', documents: counts[7], status: 'Active' },
      { index: 9, collection: 'ai_predictions', documents: counts[8], status: 'Active' },
      { index: 10, collection: 'complaint_history', documents: counts[9], status: 'Active' },
      { index: 11, collection: 'notifications', documents: counts[10], status: 'Active' },
      { index: 12, collection: 'feedback', documents: counts[11], status: 'Active' }
    ];

    console.table(report);
    console.log('=======================================================');
    console.log(`Database "${db.databaseName}" now contains all 12 operational collections.`);
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `✗ Initialization failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

init12Collections();
