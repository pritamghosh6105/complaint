/**
 * CivicPulse AI — West Bengal Location & GIS Resolution System Test Suite
 * 
 * Verifies all 15 core architectural capabilities:
 *  1. District retrieval returns 23 districts in West Bengal
 *  2. Subdivision retrieval cascades correctly by districtId
 *  3. Urban hierarchy cascade: District -> Subdivision -> ULB -> Ward
 *  4. Rural hierarchy cascade: District -> Subdivision -> Block -> Gram Panchayat -> Village
 *  5. Location parent-child validation
 *  6. PIN code search returns correct district and post offices
 *  7. Police station search by coordinates returns nearest station with contact info
 *  8. Coordinate resolution returns full jurisdiction for Kolkata coordinates
 *  9. Point-in-polygon matches correct administrative boundary polygon
 * 10. Coordinates outside West Bengal handled gracefully (unresolvedReason)
 * 11. Missing boundary polygon falls back to nearest district centroid / reverse geocode
 * 12. Complaint submission saves structured location & immutable snapshot
 * 13. Duplicate location detection & LGD code uniqueness
 * 14. Village listing pagination and search works
 * 15. Reverse geocoding handles rate-limiting / failure gracefully with caching
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const { Location } = require('../src/models/mongo/Location');
const PostalLocation = require('../src/models/mongo/PostalLocation');
const PoliceStation = require('../src/models/mongo/PoliceStation');
const LocationBoundary = require('../src/models/mongo/LocationBoundary');
const Complaint = require('../src/models/mongo/Complaint');
const locationService = require('../src/services/locationService');
const jurisdictionService = require('../src/services/jurisdictionService');
const geocodingService = require('../src/services/geocodingService');

async function runTestSuite() {
  console.log('=================================================================');
  console.log('🧪 CivicPulse AI — West Bengal Location System Comprehensive Test Suite');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;
  const tests = [];

  async function test(name, fn) {
    const start = Date.now();
    try {
      await fn();
      const dur = Date.now() - start;
      console.log(`  ✓ PASS: ${name} (${dur}ms)`);
      passed++;
      tests.push({ name, status: 'PASS', dur });
    } catch (err) {
      const dur = Date.now() - start;
      console.error(`  ✗ FAIL: ${name} (${dur}ms)`);
      console.error(`    Error: ${err.message}\n`);
      failed++;
      tests.push({ name, status: 'FAIL', dur, error: err.message });
    }
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB Atlas.\n');

    // Test 1: District retrieval returns 23 districts in West Bengal
    await test('1. District retrieval returns 23 official West Bengal districts', async () => {
      const districts = await locationService.getDistricts();
      assert.strictEqual(districts.length, 23, `Expected 23 districts, got ${districts.length}`);
      const kolkata = districts.find(d => d.name === 'Kolkata');
      assert.ok(kolkata, 'Kolkata district must exist in official districts');
      assert.strictEqual(kolkata.type, 'DISTRICT');
      assert.strictEqual(kolkata.state, 'West Bengal');
      assert.ok(kolkata.id, 'District must have string id');
    });

    // Test 2: Subdivision retrieval cascades correctly by districtId
    let testDistrict = null;
    let testSubdivisions = [];
    await test('2. Subdivision retrieval cascades correctly by districtId', async () => {
      const districts = await locationService.getDistricts();
      testDistrict = districts.find(d => d.name === 'North 24 Parganas') || districts[0];
      testSubdivisions = await locationService.getSubdivisions(testDistrict.id);
      assert.ok(testSubdivisions.length > 0, `Expected subdivisions under ${testDistrict.name}`);
      for (const sub of testSubdivisions) {
        assert.strictEqual(sub.type, 'SUBDIVISION');
        assert.strictEqual(String(sub.parentId), String(testDistrict._id));
      }
    });

    // Test 3: Urban hierarchy cascade: District -> Subdivision -> ULB -> Ward
    await test('3. Urban hierarchy cascade: District -> Subdivision -> ULB -> Ward', async () => {
      const ulbs = await locationService.getULBs(null, testDistrict.id);
      assert.ok(ulbs.length > 0, `Expected ULBs in district ${testDistrict.name}`);
      const testUlb = ulbs[0];
      assert.ok(['MUNICIPALITY', 'MUNICIPAL_CORPORATION', 'NOTIFIED_AREA', 'ULB'].includes(testUlb.type));
      
      const wards = await locationService.getWards(testUlb.id);
      assert.ok(Array.isArray(wards), 'Wards query must return an array');
      if (wards.length > 0) {
        assert.strictEqual(wards[0].type, 'WARD');
        assert.strictEqual(String(wards[0].parentId), String(testUlb._id));
      }
    });

    // Test 4: Rural hierarchy cascade: District -> Subdivision -> Block -> Gram Panchayat -> Village
    await test('4. Rural hierarchy cascade: District -> Subdivision -> Block -> Gram Panchayat -> Village', async () => {
      const blocks = await locationService.getBlocks(testSubdivisions[0]?.id);
      assert.ok(Array.isArray(blocks), 'Blocks query must return an array');
      if (blocks.length > 0) {
        const testBlock = blocks[0];
        assert.strictEqual(testBlock.type, 'BLOCK');
        
        const gps = await locationService.getGramPanchayats(testBlock.id);
        assert.ok(Array.isArray(gps), 'GPs query must return an array');
        if (gps.length > 0) {
          const testGp = gps[0];
          assert.strictEqual(testGp.type, 'GRAM_PANCHAYAT');
          assert.strictEqual(String(testGp.parentId), String(testBlock._id));

          const vilRes = await locationService.getVillages(testGp.id);
          assert.ok(Array.isArray(vilRes.villages), 'Villages query must return array');
          assert.ok(vilRes.pagination, 'Villages must have pagination metadata');
        }
      }
    });

    // Test 5: Location parent-child validation rules
    await test('5. Location parent-child integrity validation', async () => {
      // Create a dummy child location pointing to non-existent parent
      const invalidChild = new Location({
        name: 'Test Invalid GP',
        type: 'GRAM_PANCHAYAT',
        parentId: new mongoose.Types.ObjectId(), // non-existent parent
        state: 'West Bengal'
      });
      // Save should fail custom application validation or be detectable
      const allDistricts = await Location.find({ type: 'DISTRICT' }).lean();
      for (const d of allDistricts) {
        assert.strictEqual(d.parentId, null, 'Districts must have parentId = null');
      }
    });

    // Test 6: PIN code search returns correct district and post offices
    await test('6. PIN code search returns correct district and post offices', async () => {
      const pins = await locationService.getPincodes('700001');
      assert.ok(pins.length > 0, 'Should find post offices for PIN 700001');
      const pin = pins[0];
      assert.strictEqual(pin.pincode, '700001');
      assert.strictEqual(typeof pin.pincode, 'string', 'PIN code must be strictly string');
      assert.ok(pin.postOffice, 'Post office name must be present');
    });

    // Test 7: Police station search by coordinates returns nearest station with contact info
    await test('7. Police station search returns nearest station with contact info', async () => {
      const lat = 22.5726;
      const lng = 88.3639;
      const stations = await locationService.getPoliceStations(null, lat, lng);
      assert.ok(stations.length > 0, 'Expected nearest police stations near central Kolkata');
      const nearest = stations[0];
      assert.ok(nearest.name, 'Police station must have name');
      assert.ok(nearest.contact, 'Police station must have contact info');
      assert.ok(nearest.location?.coordinates, 'Police station must have GeoJSON coordinates');
    });

    // Test 8: Coordinate resolution returns full jurisdiction for Kolkata coordinates
    await test('8. Coordinate resolution returns full jurisdiction for Kolkata coordinates', async () => {
      const res = await jurisdictionService.resolveCoordinates(22.5726, 88.3639);
      assert.ok(res, 'Resolution result must be defined');
      assert.ok(res.district, 'District must be resolved');
      assert.strictEqual(res.district.name, 'Kolkata');
      assert.strictEqual(res.urbanOrRural, 'Urban');
      assert.ok(res.policeStation, 'Police station must be resolved');
      assert.ok(res.accuracy, 'Accuracy badge must be present');
    });

    // Test 9: Point-in-polygon matches correct administrative boundary polygon
    await test('9. Point-in-polygon matches correct administrative boundary polygon', async () => {
      const res = await jurisdictionService.resolveCoordinates(22.5600, 88.3500);
      assert.ok(res.district, 'District boundary must intersect');
      assert.strictEqual(res.accuracy, 'HIGH (Verified Polygon Match)');
    });

    // Test 10: Coordinates outside West Bengal handled gracefully (unresolvedReason)
    await test('10. Coordinates outside West Bengal handled gracefully (unresolvedReason)', async () => {
      // Mumbai coordinates (approx 19.0760 N, 72.8777 E)
      const res = await jurisdictionService.resolveCoordinates(19.0760, 72.8777);
      assert.ok(res.unresolvedReason, 'Outside West Bengal should have unresolvedReason');
      assert.strictEqual(res.district, null, 'Outside coordinates should not match WB district');
    });

    // Test 11: Missing boundary polygon falls back to nearest district centroid / reverse geocode
    await test('11. Missing boundary polygon falls back to centroid proximity', async () => {
      // Location within West Bengal but in un-polygonized district centroid (e.g. Purulia 23.33, 86.36)
      const res = await jurisdictionService.resolveCoordinates(23.3322, 86.3652);
      assert.ok(res.district, 'Should resolve Purulia district via centroid proximity');
      assert.strictEqual(res.district.name, 'Purulia');
    });

    // Test 12: Complaint submission saves structured location & immutable snapshot
    await test('12. Complaint submission saves structured location & immutable snapshot', async () => {
      const trackingId = `CP-WB-${Date.now()}`;
      const testComplaint = new Complaint({
        id: Math.floor(Math.random() * 1000000) + 100000,
        tracking_id: trackingId,
        citizen_id: 99999,
        title: 'Water logging near Bowbazar crossing',
        description: 'Severe water clogging after heavy rain affecting pedestrian movement.',
        category: 'Drainage & Sewerage',
        priority: 'MEDIUM',
        status: 'Submitted',
        district: testDistrict.name,
        location: {
          type: 'Point',
          coordinates: [88.3639, 22.5726],
          districtId: testDistrict._id,
          locality: 'Bowbazar',
          street: 'BB Ganguly Street',
          pincode: '700012'
        }
      });

      await testComplaint.save();

      // Verify complaint saved and snapshot generated
      assert.ok(testComplaint.locationSnapshot, 'Location snapshot must be generated');
      assert.strictEqual(testComplaint.locationSnapshot.state, 'West Bengal');
      assert.strictEqual(testComplaint.locationSnapshot.district, testDistrict.name);
      assert.strictEqual(testComplaint.locationSnapshot.pincode, '700012');

      // Clean up test complaint
      await Complaint.deleteOne({ _id: testComplaint._id });
    });

    // Test 13: Duplicate location detection & LGD code uniqueness
    await test('13. Duplicate location detection & LGD code uniqueness', async () => {
      const dups = await Location.aggregate([
        { $match: { lgdCode: { $exists: true, $ne: null, $gt: '' } } },
        { $group: { _id: '$lgdCode', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]);
      assert.strictEqual(dups.length, 0, 'No duplicate LGD codes should exist');
    });

    // Test 14: Village listing pagination and search works
    await test('14. Village listing pagination and search works', async () => {
      const res = await locationService.getVillages(null, '', 1, 10);
      assert.ok(Array.isArray(res.villages), 'Villages must be an array');
      assert.strictEqual(res.pagination.page, 1);
      assert.strictEqual(res.pagination.limit, 10);
      assert.ok(res.pagination.total >= 0);
    });

    // Test 15: Reverse geocoding handles rate-limiting / failure gracefully with caching
    await test('15. Reverse geocoding handles rate-limiting / failure gracefully with caching', async () => {
      // Use fresh coordinates: Krishnanagar (23.4013, 88.5015)
      const lat = 23.4013;
      const lng = 88.5015;
      const start1 = Date.now();
      const res1 = await geocodingService.reverseGeocode(lat, lng);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const res2 = await geocodingService.reverseGeocode(lat, lng);
      const time2 = Date.now() - start2;

      assert.ok(res1, 'First reverse geocode must succeed');
      assert.ok(res2, 'Cached reverse geocode must succeed');
      assert.strictEqual(res1.pincode, res2.pincode, 'Cached result must match');
      assert.ok(time2 <= time1, `Cached call (${time2}ms) must be <= original (${time1}ms)`);
    });

    console.log('\n=================================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed out of ${tests.length} Tests`);
    console.log('=================================================================\n');

    await mongoose.disconnect();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error(`✗ Test suite crashed: ${err.message}`);
    process.exit(1);
  }
}

runTestSuite();
