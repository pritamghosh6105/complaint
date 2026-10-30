const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const { Location } = require('../backend/src/models/mongo/Location');
const PostalLocation = require('../backend/src/models/mongo/PostalLocation');
const PoliceStation = require('../backend/src/models/mongo/PoliceStation');
const LocationBoundary = require('../backend/src/models/mongo/LocationBoundary');

const uri = process.env.MONGODB_URI;

async function validateLocations() {
  console.log('=======================================================');
  console.log('🔍 CivicPulse AI — Comprehensive Location Data Validator');
  console.log('=======================================================');

  try {
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB Atlas.\n');

    const issues = {
      duplicateLgdCodes: [],
      duplicateNamesUnderParent: [],
      orphanLocations: [],
      invalidParentTypes: [],
      missingHierarchy: [],
      invalidPinFormats: [],
      invalidCoordinates: [],
      invalidGeoJson: [],
      missingSource: []
    };

    // 1. Check duplicate LGD codes
    console.log('1. Checking LGD Code uniqueness...');
    const lgdDups = await Location.aggregate([
      { $match: { lgdCode: { $exists: true, $ne: null, $gt: '' } } },
      { $group: { _id: '$lgdCode', count: { $sum: 1 }, docs: { $push: { name: '$name', type: '$type', id: '$_id' } } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    issues.duplicateLgdCodes = lgdDups;

    // 2. Check duplicate names under same parent
    console.log('2. Checking name uniqueness under parentId...');
    const nameDups = await Location.aggregate([
      { $group: { _id: { name: '$name', parentId: '$parentId', type: '$type' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    issues.duplicateNamesUnderParent = nameDups;

    // 3. Check orphan locations (non-districts with missing or dangling parentId)
    console.log('3. Checking orphan locations...');
    const allLocationIds = new Set((await Location.find({}, { _id: 1 }).lean()).map(l => String(l._id)));
    const nonDistricts = await Location.find({ type: { $ne: 'DISTRICT' } }, { name: 1, type: 1, parentId: 1 }).lean();
    for (const loc of nonDistricts) {
      if (!loc.parentId) {
        issues.orphanLocations.push({ id: loc._id, name: loc.name, type: loc.type, reason: 'Missing parentId' });
      } else if (!allLocationIds.has(String(loc.parentId))) {
        issues.orphanLocations.push({ id: loc._id, name: loc.name, type: loc.type, parentId: loc.parentId, reason: 'Dangling parentId' });
      }
    }

    // 4. Check invalid parent types
    console.log('4. Checking parent-child hierarchy integrity...');
    const validParentRules = {
      SUBDIVISION: ['DISTRICT'],
      BLOCK: ['SUBDIVISION', 'DISTRICT'],
      GRAM_PANCHAYAT: ['BLOCK'],
      VILLAGE: ['GRAM_PANCHAYAT'],
      MUNICIPALITY: ['SUBDIVISION', 'DISTRICT'],
      MUNICIPAL_CORPORATION: ['SUBDIVISION', 'DISTRICT'],
      NOTIFIED_AREA: ['SUBDIVISION', 'DISTRICT'],
      ULB: ['SUBDIVISION', 'DISTRICT'],
      WARD: ['MUNICIPALITY', 'MUNICIPAL_CORPORATION', 'NOTIFIED_AREA', 'ULB']
    };

    const allWithParents = await Location.find({ parentId: { $ne: null } }).populate('parentId', 'name type').lean();
    for (const loc of allWithParents) {
      if (!loc.parentId) continue;
      const expectedParents = validParentRules[loc.type];
      if (expectedParents && !expectedParents.includes(loc.parentId.type)) {
        issues.invalidParentTypes.push({
          id: loc._id,
          name: loc.name,
          type: loc.type,
          parentName: loc.parentId.name,
          parentType: loc.parentId.type,
          expectedParentTypes: expectedParents
        });
      }
    }

    // 5. Check PIN codes format in postal_locations
    console.log('5. Checking PIN code string formats...');
    const postalDocs = await PostalLocation.find().lean();
    for (const p of postalDocs) {
      if (typeof p.pincode !== 'string' || !/^[1-9][0-9]{5}$/.test(p.pincode)) {
        issues.invalidPinFormats.push({ id: p._id, pincode: p.pincode, postOffice: p.postOffice });
      }
    }

    // 6. Check coordinates in police_stations and locations
    console.log('6. Checking coordinate sanity (lng: -180..180, lat: -90..90)...');
    const stations = await PoliceStation.find().lean();
    for (const ps of stations) {
      const coords = ps.location?.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) {
        issues.invalidCoordinates.push({ id: ps._id, name: ps.name, coords });
      } else {
        const [lng, lat] = coords;
        if (lng < 85 || lng > 90 || lat < 21 || lat > 28) {
          // Outside West Bengal bounding box (approx 85-90E, 21-28N)
          issues.invalidCoordinates.push({ id: ps._id, name: ps.name, coords, warning: 'Coordinates outside West Bengal envelope' });
        }
      }
    }

    // 7. Check location boundaries GeoJSON
    console.log('7. Checking GeoJSON boundaries...');
    const boundaries = await LocationBoundary.find().lean();
    for (const b of boundaries) {
      if (!['Polygon', 'MultiPolygon'].includes(b.geometry?.type)) {
        issues.invalidGeoJson.push({ id: b._id, type: b.geometry?.type });
      }
    }

    // Report summary
    console.log('\n=======================================================');
    console.log('📋 Data Validation Audit Report');
    console.log('=======================================================');
    const summaryTable = [
      { Metric: 'Duplicate LGD Codes', Count: issues.duplicateLgdCodes.length, Status: issues.duplicateLgdCodes.length === 0 ? 'PASS' : 'WARN' },
      { Metric: 'Duplicate Names under Parent', Count: issues.duplicateNamesUnderParent.length, Status: issues.duplicateNamesUnderParent.length === 0 ? 'PASS' : 'WARN' },
      { Metric: 'Orphan Locations', Count: issues.orphanLocations.length, Status: issues.orphanLocations.length === 0 ? 'PASS' : 'FAIL' },
      { Metric: 'Invalid Parent Types', Count: issues.invalidParentTypes.length, Status: issues.invalidParentTypes.length === 0 ? 'PASS' : 'FAIL' },
      { Metric: 'Invalid PIN Code Formats', Count: issues.invalidPinFormats.length, Status: issues.invalidPinFormats.length === 0 ? 'PASS' : 'FAIL' },
      { Metric: 'Invalid / Out-of-Bounds Coords', Count: issues.invalidCoordinates.length, Status: issues.invalidCoordinates.length === 0 ? 'PASS' : 'WARN' },
      { Metric: 'Malformed GeoJSON Boundaries', Count: issues.invalidGeoJson.length, Status: issues.invalidGeoJson.length === 0 ? 'PASS' : 'FAIL' }
    ];
    console.table(summaryTable);

    const reportFile = path.resolve(__dirname, '../data/import-reports/validation_audit_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(issues, null, 2));
    console.log(`\nDetailed report written to: ${reportFile}`);
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`✗ Validation failed: ${err.message}`);
    process.exit(1);
  }
}

validateLocations();
