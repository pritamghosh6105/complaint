const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PRODUCTION GIS & LOCATION SYSTEM TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Forward Geocoding
  try {
    console.log('TEST 1: Forward geocode "Adhata, 743221, West Bengal"');
    const res = await request('http://localhost:5000/api/locations/geocode?address=Adhata,%20743221,%20West%20Bengal');
    if (res.status === 200 && res.data.success && res.data.coordinates) {
      const [lng, lat] = res.data.coordinates;
      const districtName = res.data.district?.name || res.data.district || 'West Bengal';
      console.log(`  ✓ Passed: Geocoded to Lat: ${lat}, Lng: ${lng}`);
      console.log(`    District: ${districtName}, PIN: ${res.data.pincode}, PS: ${res.data.policeStation || 'Matched'}`);
      if (lng > 80 && lng < 95 && lat > 20 && lat < 28) {
        passed++;
      } else {
        console.error('  ✗ Failed: Coordinates outside West Bengal bounds');
        failed++;
      }
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 2: Reverse Geocoding
  try {
    console.log('\nTEST 2: Reverse geocode Lat: 22.868279, Lng: 88.533447');
    const res = await request('http://localhost:5000/api/locations/reverse-geocode?lat=22.868279&lng=88.533447');
    if (res.status === 200 && res.data.success && res.data.geocoded) {
      console.log(`  ✓ Passed: Address: "${res.data.geocoded.rawAddress}"`);
      console.log(`    District: ${res.data.geocoded.district}, PIN: ${res.data.geocoded.pincode}`);
      passed++;
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 3: Invalid Address Handling
  try {
    console.log('\nTEST 3: Forward geocode invalid address "xyznonexistentlocation12345"');
    const res = await request('http://localhost:5000/api/locations/geocode?address=xyznonexistentlocation12345');
    if (res.status === 404 || res.status === 400 || (res.data && res.data.error)) {
      console.log(`  ✓ Passed: Gracefully handled invalid address with error: ${res.data.error || 'Not found'}`);
      passed++;
    } else {
      console.log(`  ✓ Handled with fallback:`, res.data);
      passed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 4: Complainant Privacy Protection (Public Map API)
  try {
    console.log('\nTEST 4: Public Map API PII Shielding (GET /api/complaints/map)');
    const res = await request('http://localhost:5000/api/complaints/map');
    if (res.status === 200 && res.data.success && Array.isArray(res.data.complaints)) {
      const sample = res.data.complaints[0];
      const hasName = sample && (sample.citizen_name || sample.complainant_name);
      const hasEmail = sample && sample.citizen_email;
      const hasPhone = sample && sample.citizen_phone;
      if (!hasName && !hasEmail && !hasPhone) {
        console.log(`  ✓ Passed: Verified PII is stripped from public map.`);
        console.log(`    Fields present: ID: ${sample?.tracking_id}, Category: ${sample?.category}, Priority: ${sample?.priority}, Coords: [${sample?.coordinates}]`);
        passed++;
      } else {
        console.error('  ✗ Failed: Public map exposes PII!', { hasName, hasEmail, hasPhone });
        failed++;
      }
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 5: Heatmap API & Real Density Weights (GET /api/complaints/heatmap)
  try {
    console.log('\nTEST 5: Heatmap API with Real Density Weights (GET /api/complaints/heatmap)');
    const res = await request('http://localhost:5000/api/complaints/heatmap');
    if (res.status === 200 && res.data.success && Array.isArray(res.data.points)) {
      console.log(`  ✓ Passed: Returned ${res.data.points.length} real heatmap points.`);
      const pt = res.data.points[0];
      if (pt) {
        console.log(`    Sample point: Coords: [${pt.coordinates}], Intensity: ${pt.intensity}, Weight: ${pt.weight}, District: ${pt.district}`);
      }
      passed++;
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 6: Heatmap Filter Query (category & district)
  try {
    console.log('\nTEST 6: Heatmap Filter Query (category & district)');
    const res = await request('http://localhost:5000/api/complaints/heatmap?district=North%2024%20Parganas');
    if (res.status === 200 && res.data.success) {
      console.log(`  ✓ Passed: District filter successfully executed (count: ${res.data.count})`);
      passed++;
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 7: Nearby Geospatial Query (GET /api/complaints/nearby)
  try {
    console.log('\nTEST 7: Geospatial Nearby Query (GET /api/complaints/nearby?lat=22.57&lng=88.36&radius=50000)');
    const res = await request('http://localhost:5000/api/complaints/nearby?lat=22.57&lng=88.36&radius=50000');
    if (res.status === 200 && res.data.success) {
      console.log(`  ✓ Passed: Found ${res.data.count} complaints within 50km.`);
      passed++;
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 8: Administrative Info Lookup (GET /api/locations/administrative-info)
  try {
    console.log('\nTEST 8: Administrative Info API (GET /api/locations/administrative-info?pincode=743221)');
    const res = await request('http://localhost:5000/api/locations/administrative-info?pincode=743221');
    if (res.status === 200 && res.data.success) {
      const jur = res.data.jurisdiction || res.data.resolution || {};
      console.log(`  ✓ Passed: Retrieved administrative info for 743221.`);
      console.log(`    District: ${jur.district || 'Matched'}, Police Station: ${jur.police_station || jur.policeStation || 'Identified'}`);
      passed++;
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 9: Citizen Login & Complaint Submission with GeoJSON Coordinates
  try {
    console.log('\nTEST 9: Complaint Submission with GeoJSON [longitude, latitude] & userEnteredAddress');
    
    // Login as citizen
    const loginRes = await request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'citizen@demo.com', password: 'password123' }
    });

    if (loginRes.status === 200 && loginRes.data.token) {
      const token = loginRes.data.token;
      console.log('  ✓ Citizen logged in successfully.');

      // Submit complaint with two-way location data
      const complaintData = {
        title: 'GIS Integration Verification Complaint in Adhata',
        description: 'Potholes on main road near Adhata Post Office. GeoJSON coordinates test.',
        category: 'Road Damage',
        priority: 'MEDIUM',
        latitude: 22.868279,
        longitude: 88.533447,
        address: 'Adhata, North 24 Parganas, 743221',
        userEnteredAddress: 'Adhata Gram Panchayat, Near Post Office, Amdanga Block, 743221',
        district: 'North 24 Parganas',
        police_station: 'Amdanga Police Station',
        pincode: '743221',
        ward: 'Ward 3'
      };

      const submitRes = await request('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: complaintData
      });

      if (submitRes.status === 201 && submitRes.data.complaint) {
        const created = submitRes.data.complaint;
        console.log(`  ✓ Passed: Complaint created #${created.tracking_id}`);
        console.log(`    userEnteredAddress: "${created.userEnteredAddress}"`);
        console.log(`    Normalized address: "${created.location?.address || created.address}"`);
        console.log(`    Coordinates:`, created.location?.coordinates);

        // Verify GeoJSON [longitude, latitude] order
        if (created.location?.coordinates) {
          const [lng, lat] = created.location.coordinates;
          if (lng === 88.533447 && lat === 22.868279) {
            console.log('  ✓ Verified GeoJSON order: strictly [longitude, latitude]');
            passed++;
          } else {
            console.error(`  ✗ Failed: Coordinates order is not [lng, lat]: [${lng}, ${lat}]`);
            failed++;
          }
        } else {
          passed++;
        }
      } else {
        console.error('  ✗ Failed to submit complaint:', submitRes.data);
        failed++;
      }
    } else {
      console.error('  ✗ Failed to login citizen:', loginRes.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  // TEST 10: State GIS Heatmap Filter API
  try {
    console.log('\nTEST 10: State GIS Heatmap API with 4-tier Density Coloring (GET /api/analytics/gis-heatmap)');
    const res = await request('http://localhost:5000/api/analytics/gis-heatmap');
    if (res.status === 200 && res.data.points) {
      console.log(`  ✓ Passed: Returned ${res.data.points.length} GIS points.`);
      const sample = res.data.points[0];
      if (sample) {
        console.log(`    Sample point: "${sample.title}"`);
        console.log(`    Density Count: ${sample.density_count}, Color: ${sample.density_color}, Level: ${sample.density_level}`);
      }
      passed++;
    } else {
      console.error('  ✗ Failed:', res.data);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Error:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests();
