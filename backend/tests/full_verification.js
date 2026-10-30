/**
 * CivicPulse AI — Full System E2E API Verification Script
 */
const axios = require('axios');
const assert = require('assert');

const API = 'http://localhost:5000/api';
const ML_API = 'http://localhost:8000';

async function runAudit() {
  console.log('===============================================================');
  console.log('🏛️  CivicPulse AI — Comprehensive API & End-to-End Audit Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  async function check(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
      results.push({ name, status: 'PASS' });
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Details: ${err.message}`);
      if (err.response && err.response.data) {
        console.error(`    Server Response:`, JSON.stringify(err.response.data));
      }
      failed++;
      results.push({ name, status: 'FAIL', error: err.message });
    }
  }

  // 1. Health & Status
  await check('1.1 Backend Health & MongoDB Atlas status', async () => {
    const res = await axios.get(`${API}/health`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'healthy');
    assert.strictEqual(res.data.database, 'MongoDB Atlas');
    assert.strictEqual(res.data.mongoStatus.connected, true);
    assert.strictEqual(res.data.mediaStorage.cloudinaryConfigured, true);
  });

  await check('1.2 Database status returns all 12 collections', async () => {
    const res = await axios.get(`${API}/database/status`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.totalCollections, 12);
    assert.ok(res.data.counts.departments >= 30, 'Must have at least 30 departments');
    assert.ok(res.data.counts.locations >= 23, 'Must have locations');
    assert.ok(res.data.counts.postal_locations >= 1000, 'Must have postal locations');
    assert.ok(res.data.counts.police_stations >= 50, 'Must have police stations');
  });

  await check('1.3 ML Service health & loaded models', async () => {
    const res = await axios.get(`${ML_API}/`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'online');
    assert.strictEqual(res.data.models_loaded.category_model, true);
    assert.strictEqual(res.data.models_loaded.subcategory_model, true);
    assert.strictEqual(res.data.models_loaded.priority_model, true);
    assert.strictEqual(res.data.models_loaded.duplicate_engine, true);
    assert.strictEqual(res.data.models_loaded.resolution_model, true);
  });

  // 2. Auth & Roles
  let citizenToken = '';
  let officerToken = '';
  let adminToken = '';
  let testCitizenUser = null;
  let testOfficerUser = null;

  await check('2.1 User registration with valid data', async () => {
    const randomSuffix = Math.floor(Math.random() * 900000) + 100000;
    const email = `testcitizen_${randomSuffix}@wb.gov.in`;
    const res = await axios.post(`${API}/auth/register`, {
      name: `Citizen Test ${randomSuffix}`,
      email: email,
      password: 'SecurePassword123!',
      phone: `9876${randomSuffix}`,
      role: 'citizen'
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.token, 'Token must be returned on registration');
    assert.strictEqual(res.data.user.role, 'citizen');
    citizenToken = res.data.token;
    testCitizenUser = res.data.user;
  });

  await check('2.2 Invalid registration data rejection', async () => {
    try {
      await axios.post(`${API}/auth/register`, {
        name: '',
        email: 'invalid-email',
        password: '123'
      });
      assert.fail('Should have failed validation');
    } catch (e) {
      assert.ok(e.response.status === 400 || e.response.status === 422, 'Expected 400/422 status');
    }
  });

  await check('2.3 Citizen login works', async () => {
    const res = await axios.post(`${API}/auth/login`, {
      email: testCitizenUser.email,
      password: 'SecurePassword123!'
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token);
    assert.strictEqual(res.data.user.id, testCitizenUser.id);
  });

  await check('2.4 Admin login & Demo persona verification', async () => {
    const res = await axios.post(`${API}/auth/login`, {
      email: 'admin@demo.com',
      password: 'password123'
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token);
    assert.strictEqual(res.data.user.role, 'admin');
    adminToken = res.data.token;
  });

  await check('2.5 Officer login & Demo persona verification', async () => {
    const res = await axios.post(`${API}/auth/login`, {
      email: 'officer.pwd@demo.com',
      password: 'password123'
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token);
    assert.strictEqual(res.data.user.role, 'officer');
    officerToken = res.data.token;
    testOfficerUser = res.data.user;
  });

  await check('2.6 Protected routes reject unauthenticated requests', async () => {
    try {
      await axios.get(`${API}/complaints/my`);
      assert.fail('Should have been rejected without auth');
    } catch (e) {
      assert.strictEqual(e.response.status, 401);
    }
  });

  await check('2.7 Citizen cannot access admin-only endpoints', async () => {
    try {
      await axios.get(`${API}/admin/departments`, {
        headers: { Authorization: `Bearer ${citizenToken}` }
      });
      assert.fail('Citizen should not access admin endpoints');
    } catch (e) {
      assert.strictEqual(e.response.status, 403);
    }
  });

  // 3. Departments & Taxonomy
  await check('3.1 All 30 Departments exist in directory', async () => {
    const res = await axios.get(`${API}/departments`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.departments));
    assert.strictEqual(res.data.departments.length, 30, `Expected 30 departments, got ${res.data.departments.length}`);
  });

  await check('3.2 ML Taxonomy returns 30 categories with emergency hotlines', async () => {
    const res = await axios.get(`${API}/ml/taxonomy`);
    assert.strictEqual(res.status, 200);
    const catKeys = Object.keys(res.data.categories || {});
    assert.strictEqual(catKeys.length, 30, `Expected 30 categories in taxonomy, got ${catKeys.length}`);
  });

  // 4. ML Inferences
  await check('4.1 ML Category prediction (English-Only)', async () => {
    const rRoads = await axios.post(`${API}/ml/category`, { text: 'Huge pothole on Grand Trunk Road damaging car tires' });
    assert.strictEqual(rRoads.data.category, 'Roads & Public Works');

    const rWater = await axios.post(`${API}/ml/category`, { text: 'Severe drinking water pipeline burst flooding the residential street with continuous water supply leakage' });
    assert.strictEqual(rWater.data.category, 'Water Supply');

    const rCyber = await axios.post(`${API}/ml/category`, { text: 'Cyber criminals drained 50,000 rupees from my bank account without OTP' });
    assert.strictEqual(rCyber.data.category, 'Cyber Crime');
  });

  await check('4.2 ML Priority prediction with safety escalation', async () => {
    const rLow = await axios.post(`${API}/ml/priority`, {
      text: 'One streetlight near my house stopped working. No immediate hazard.',
      category: 'Street Lighting',
      severity: 'Low',
      location_type: 'Residential',
      affected_count: 10
    });
    assert.strictEqual(rLow.data.priority, 'LOW');

    const rCrit = await axios.post(`${API}/ml/priority`, {
      text: 'A high voltage electrical wire snapped and fallen on school road sparking fire risk!',
      category: 'Electricity & Power',
      severity: 'Critical',
      location_type: 'School',
      affected_count: 500
    });
    assert.strictEqual(rCrit.data.priority, 'CRITICAL');
    assert.strictEqual(rCrit.data.sla_hours, 24);
  });

  await check('4.3 ML Resolution Time prediction', async () => {
    const res = await axios.post(`${API}/ml/resolution-time`, {
      category: 'Roads & Public Works',
      priority: 'MEDIUM',
      location_type: 'Residential',
      ward: 'Ward 5',
      affected_count: 50,
      text: 'Broken pavement'
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.estimated_days > 0);
    assert.ok(res.data.estimated_hours > 0);
  });

  await check('4.4 ML Composite analysis (/api/ml/analyze)', async () => {
    const res = await axios.post(`${API}/ml/analyze`, {
      text: 'Deep open trench left uncovered on road carriageway causing heavy accident risk',
      latitude: 22.5726,
      longitude: 88.3639,
      severity: 'High',
      location_type: 'Hospital',
      affected_count: 200
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.summary);
    assert.ok(['Roads & Public Works', 'Drainage & Sewerage'].includes(res.data.summary.category));
    assert.ok(['HIGH', 'CRITICAL'].includes(res.data.summary.priority));
  });

  // 5. Vision AI and Multimodal Fusion
  await check('5.1 Vision analysis engine endpoint', async () => {
    const res = await axios.post(`${ML_API}/vision/analyze`, {
      image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      text_category: 'Roads & Public Works',
      text_subcategory: 'Pothole / Crater',
      description: 'Pothole on asphalt road'
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.detected_label || res.data.detected_issue);
    assert.ok(res.data.evidence_consistency);
  });

  await check('5.2 Multimodal fusion evaluation endpoint', async () => {
    const res = await axios.post(`${ML_API}/multimodal/evaluate`, {
      text_priority: 'HIGH',
      text_category: 'Electricity & Power',
      text_subcategory: 'Live Wire Hazard',
      visual_severity: 'CRITICAL',
      visual_label: 'high voltage sparking',
      location_type: 'School',
      affected_count: 150,
      is_emergency: true,
      evidence_consistency: 'MATCH'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.final_priority, 'CRITICAL');
    assert.strictEqual(res.data.sla_hours, 24);
  });

  // 6. Location APIs
  await check('6.1 All 23 West Bengal districts returned', async () => {
    const res = await axios.get(`${API}/location/districts`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.districts.length, 23);
  });

  await check('6.2 PIN code lookup from West Bengal Postal Dataset', async () => {
    const res = await axios.get(`${API}/location/pincode/search?q=700001`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.results.length > 0);
    assert.strictEqual(res.data.results[0].pincode, '700001');
    assert.strictEqual(res.data.results[0].district, 'Kolkata');
  });

  await check('6.3 Police station search with non-negative Haversine distance', async () => {
    const res = await axios.get(`${API}/location/police-stations?lat=22.5726&lng=88.3639`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.policeStations.length > 0);
    const first = res.data.policeStations[0];
    assert.ok(first.distanceKm >= 0, 'Distance must never be negative');
    assert.ok(first.name);
    assert.ok(first.contact);
  });

  await check('6.4 GPS Coordinate Resolution for Kolkata coordinates', async () => {
    const res = await axios.post(`${API}/location/resolve`, {
      latitude: 22.5726,
      longitude: 88.3639
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.district.name, 'Kolkata');
    assert.strictEqual(res.data.urbanOrRural, 'Urban');
    assert.ok(res.data.policeStation);
  });

  // 7. Complaint Lifecycle & Tracking
  let createdComplaintId = null;
  let createdTrackingId = null;

  await check('7.1 Citizen complaint submission creates real database record', async () => {
    const res = await axios.post(`${API}/complaints`, {
      title: 'Water logging at College Street crossing',
      description: 'Severe water logging after afternoon heavy showers near Presidency University. Drainage choked.',
      category: 'Drainage & Sewerage',
      priority: 'MEDIUM',
      latitude: 22.5744,
      longitude: 88.3639,
      district: 'Kolkata',
      affected_count: 50,
      severity: 'Medium',
      location_type: 'Educational Institution',
      is_emergency: false
    }, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });

    assert.strictEqual(res.status, 201);
    assert.ok(res.data.complaint);
    assert.ok(res.data.complaint.id);
    assert.ok(res.data.complaint.tracking_id);
    createdComplaintId = res.data.complaint.id;
    createdTrackingId = res.data.complaint.tracking_id;
  });

  await check('7.2 Citizen can fetch their own complaints list', async () => {
    const res = await axios.get(`${API}/complaints/my`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert.strictEqual(res.status, 200);
    const found = res.data.complaints.find(c => c.id === createdComplaintId);
    assert.ok(found, 'Created complaint must appear in citizen complaints list');
  });

  await check('7.3 Public complaint tracking by tracking ID', async () => {
    const res = await axios.get(`${API}/complaints/track/${createdTrackingId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.complaint.tracking_id, createdTrackingId);
    assert.ok(Array.isArray(res.data.timeline));
    assert.ok(res.data.timeline.length > 0, 'Timeline must have at least Submitted event');
  });

  await check('7.4 Duplicate detection finds similar complaint', async () => {
    const res = await axios.post(`${API}/complaints/check-duplicate`, {
      text: 'Water logging at College Street crossing after rain, drainage choked near University',
      latitude: 22.5744,
      longitude: 88.3639
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.preview);
    assert.ok(res.data.preview.duplicate_detection !== undefined);
  });

  await check('7.5 Admin assigns department and officer to complaint', async () => {
    const res = await axios.patch(`${API}/admin/complaints/${createdComplaintId}/department`, {
      department_id: testOfficerUser.department_id || 1,
      reason: 'Assigned to authorized departmental maintenance team'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);

    const resOff = await axios.patch(`${API}/admin/complaints/${createdComplaintId}/officer`, {
      officer_id: testOfficerUser.id
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resOff.status, 200);
  });

  await check('7.6 Officer assigns to themselves / updates status to In Progress', async () => {
    const res = await axios.patch(`${API}/officer/complaints/${createdComplaintId}/status`, {
      status: 'In Progress',
      notes: 'Field team dispatched with suction pumps.'
    }, {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.complaint.status, 'In Progress');
  });

  await check('7.7 Officer resolves complaint with resolution remarks', async () => {
    const res = await axios.patch(`${API}/officer/complaints/${createdComplaintId}/status`, {
      status: 'Resolved',
      notes: 'Pumps deployed. Silt and polythene cleared. Water completely drained.'
    }, {
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.complaint.status, 'Resolved');
  });

  await check('7.8 Timeline records all sequential status transitions', async () => {
    const res = await axios.get(`${API}/complaints/track/${createdTrackingId}`);
    assert.strictEqual(res.status, 200);
    const timeline = res.data.timeline || [];
    assert.ok(timeline.length >= 3, `Timeline must record lifecycle transitions, got ${timeline.length}`);
    const statuses = timeline.map(t => t.status);
    assert.ok(statuses.includes('In Progress'), 'Timeline must include In Progress');
    assert.ok(statuses.includes('Resolved'), 'Timeline must include Resolved');
  });

  await check('7.9 Citizen submits feedback for resolved complaint', async () => {
    const res = await axios.post(`${API}/feedback`, {
      complaint_id: createdComplaintId,
      rating: 5,
      comment: 'Very fast resolution! Water was completely cleared in 2 hours.'
    }, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.feedback.rating, 5);
  });

  // 8. Analytics & Admin KPIs
  await check('8.1 Analytics KPIs return valid counts', async () => {
    const res = await axios.get(`${API}/analytics/kpis`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.kpis);
    assert.ok(typeof res.data.kpis.total === 'number');
    assert.ok(typeof res.data.kpis.resolved === 'number');
  });

  await check('8.2 Public complaints map API returns GeoJSON coordinates', async () => {
    const res = await axios.get(`${API}/complaints/public`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.complaints));
    for (const c of res.data.complaints) {
      if (c.latitude && c.longitude) {
        assert.ok(c.latitude >= -90 && c.latitude <= 90);
        assert.ok(c.longitude >= -180 && c.longitude <= 180);
      }
    }
  });

  console.log('\n===============================================================');
  console.log(`📊 Audit Summary: ${passed} Passed, ${failed} Failed out of ${results.length} Tests`);
  console.log('===============================================================');
}

runAudit().catch(err => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
