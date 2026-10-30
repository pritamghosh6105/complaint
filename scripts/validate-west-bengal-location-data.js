/**
 * CivicPulse AI — West Bengal Location Data Quality & Integrity Validator
 * 
 * Verifies and audits:
 * - Duplicate districts, subdivisions, blocks, GPs, villages, ULBs, wards, PINs
 * - Invalid PIN formats (strict 6-digit regex)
 * - Missing parent references & orphans
 * - Invalid police station records & coordinates
 * - GeoJSON point validity
 * - Non-West-Bengal records
 * - Complete absence of delivery_status field
 */

const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const { Location } = require('../backend/src/models/mongo/Location');
const PostalLocation = require('../backend/src/models/mongo/PostalLocation');
const PoliceStation = require('../backend/src/models/mongo/PoliceStation');
const LocationBoundary = require('../backend/src/models/mongo/LocationBoundary');

const uri = process.env.MONGODB_URI;

async function validateDatabase() {
  console.log('=======================================================');
  console.log('🔍 CivicPulse AI — West Bengal Location Data Integrity Audit');
  console.log('=======================================================\n');

  if (!uri) {
    console.error('✗ Error: MONGODB_URI missing from backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB Atlas.\n');

  const report = {
    totalEntities: 0,
    validRecords: 0,
    invalidRecords: 0,
    duplicates: 0,
    orphans: 0,
    missingParent: 0,
    invalidPin: 0,
    invalidCoordinates: 0,
    nonWestBengal: 0,
    deliveryStatusViolations: 0,
    details: {
      districts: { total: 0, valid: 0, issues: [] },
      subdivisions: { total: 0, valid: 0, issues: [] },
      blocks: { total: 0, valid: 0, issues: [] },
      ulbs: { total: 0, valid: 0, issues: [] },
      gramPanchayats: { total: 0, valid: 0, issues: [] },
      wards: { total: 0, valid: 0, issues: [] },
      villages: { total: 0, valid: 0, issues: [] },
      postalLocations: { total: 0, valid: 0, issues: [] },
      policeStations: { total: 0, valid: 0, issues: [] },
      boundaries: { total: 0, valid: 0, issues: [] }
    }
  };

  // 1. Audit Administrative Locations
  const allLocations = await Location.find({}).lean();
  report.totalEntities += allLocations.length;
  const locationMap = new Map(allLocations.map(l => [String(l._id), l]));
  const seenLgdCodes = new Map();

  for (const loc of allLocations) {
    let isValid = true;

    // Check State
    if (loc.state && loc.state !== 'West Bengal') {
      report.nonWestBengal++;
      isValid = false;
    }

    // Check Duplicate LGD codes
    if (loc.lgdCode) {
      const existing = seenLgdCodes.get(loc.lgdCode);
      if (existing) {
        report.duplicates++;
        isValid = false;
      } else {
        seenLgdCodes.set(loc.lgdCode, loc._id);
      }
    }

    // Check Parent Reference (Districts have no parent, all others must have valid parent)
    if (loc.type !== 'DISTRICT') {
      if (!loc.parentId) {
        report.missingParent++;
        report.orphans++;
        isValid = false;
      } else if (!locationMap.has(String(loc.parentId))) {
        report.orphans++;
        report.missingParent++;
        isValid = false;
      }
    }

    // Check Coordinates if provided
    if (loc.latitude !== null && loc.longitude !== null) {
      if (loc.latitude < 21.0 || loc.latitude > 27.5 || loc.longitude < 85.5 || loc.longitude > 90.0) {
        // Outside West Bengal bounding box
        report.invalidCoordinates++;
      }
    }

    if (isValid) report.validRecords++;
    else report.invalidRecords++;

    // Subcategory counts
    if (loc.type === 'DISTRICT') report.details.districts.total++;
    else if (loc.type === 'SUBDIVISION') report.details.subdivisions.total++;
    else if (loc.type === 'BLOCK') report.details.blocks.total++;
    else if (['MUNICIPALITY', 'MUNICIPAL_CORPORATION', 'NOTIFIED_AREA', 'ULB'].includes(loc.type)) report.details.ulbs.total++;
    else if (loc.type === 'GRAM_PANCHAYAT') report.details.gramPanchayats.total++;
    else if (loc.type === 'WARD') report.details.wards.total++;
    else if (loc.type === 'VILLAGE') report.details.villages.total++;
  }

  // 2. Audit Postal Locations (India Post)
  const postals = await PostalLocation.find({}).lean();
  report.totalEntities += postals.length;
  report.details.postalLocations.total = postals.length;

  const seenPins = new Set();
  for (const p of postals) {
    let isValid = true;

    // Strict 6-digit PIN validation
    if (!p.pincode || typeof p.pincode !== 'string' || !/^[1-9][0-9]{5}$/.test(p.pincode)) {
      report.invalidPin++;
      isValid = false;
    }

    // Check for unwanted delivery_status field
    if (p.deliveryStatus !== undefined || p.delivery_status !== undefined) {
      report.deliveryStatusViolations++;
      isValid = false;
    }

    // Check Duplicates
    const pair = `${p.pincode}_${(p.postOffice || '').toLowerCase()}`;
    if (seenPins.has(pair)) {
      report.duplicates++;
      isValid = false;
    } else {
      seenPins.add(pair);
    }

    if (p.state && p.state !== 'West Bengal') {
      report.nonWestBengal++;
      isValid = false;
    }

    if (isValid) report.validRecords++;
    else report.invalidRecords++;
  }

  // 3. Audit Police Stations
  const policeStations = await PoliceStation.find({}).lean();
  report.totalEntities += policeStations.length;
  report.details.policeStations.total = policeStations.length;

  const seenStations = new Set();
  for (const ps of policeStations) {
    let isValid = true;

    if (!ps.name || !ps.name.trim()) {
      report.invalidRecords++;
      isValid = false;
    }

    const sName = ps.name.toLowerCase().trim();
    if (seenStations.has(sName)) {
      report.duplicates++;
      isValid = false;
    } else {
      seenStations.add(sName);
    }

    // Validate GeoJSON Point
    if (!ps.location || ps.location.type !== 'Point' || !Array.isArray(ps.location.coordinates) || ps.location.coordinates.length !== 2) {
      report.invalidCoordinates++;
      isValid = false;
    } else {
      const [lng, lat] = ps.location.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat) || lat < 20 || lat > 28 || lng < 85 || lng > 91) {
        report.invalidCoordinates++;
        isValid = false;
      }
    }

    // Check districtId link
    if (ps.districtId && !locationMap.has(String(ps.districtId))) {
      report.missingParent++;
    }

    if (isValid) report.validRecords++;
    else report.invalidRecords++;
  }

  // 4. Audit GIS Boundaries
  const boundaries = await LocationBoundary.find({}).lean();
  report.totalEntities += boundaries.length;
  report.details.boundaries.total = boundaries.length;

  for (const b of boundaries) {
    if (!b.geometry || !['Polygon', 'MultiPolygon'].includes(b.geometry.type) || !b.geometry.coordinates) {
      report.invalidCoordinates++;
      report.invalidRecords++;
    } else {
      report.validRecords++;
    }
  }

  // Print Executive Summary Table
  console.log('--- Executive Summary Report ---');
  console.table([
    { Metric: 'TOTAL RECORDS AUDITED', Count: report.totalEntities, Status: 'PASS' },
    { Metric: 'VALID RECORDS', Count: report.validRecords, Status: 'PASS' },
    { Metric: 'INVALID RECORDS', Count: report.invalidRecords, Status: report.invalidRecords === 0 ? 'PASS' : 'WARN' },
    { Metric: 'DUPLICATE RECORDS', Count: report.duplicates, Status: report.duplicates === 0 ? 'PASS' : 'FAIL' },
    { Metric: 'ORPHAN RECORDS', Count: report.orphans, Status: report.orphans === 0 ? 'PASS' : 'FAIL' },
    { Metric: 'MISSING PARENT', Count: report.missingParent, Status: report.missingParent === 0 ? 'PASS' : 'FAIL' },
    { Metric: 'INVALID PIN FORMAT', Count: report.invalidPin, Status: report.invalidPin === 0 ? 'PASS' : 'FAIL' },
    { Metric: 'INVALID COORDINATES', Count: report.invalidCoordinates, Status: report.invalidCoordinates === 0 ? 'PASS' : 'FAIL' },
    { Metric: 'NON-WEST-BENGAL RECORDS', Count: report.nonWestBengal, Status: report.nonWestBengal === 0 ? 'PASS' : 'FAIL' },
    { Metric: 'DELIVERY_STATUS REMOVED', Count: `${report.deliveryStatusViolations} occurrences found`, Status: report.deliveryStatusViolations === 0 ? 'PASS (Fully Cleared)' : 'FAIL' }
  ]);

  console.log('\n--- Breakdown by Collection & Entity Type ---');
  console.table([
    { Entity: 'Districts', Count: report.details.districts.total, Source: 'LGD Official Excel & GeoCentroid' },
    { Entity: 'Subdivisions', Count: report.details.subdivisions.total, Source: 'LGD Directory' },
    { Entity: 'Blocks (Rural CD)', Count: report.details.blocks.total, Source: 'LGD Directory' },
    { Entity: 'ULBs (Municipalities/Corps)', Count: report.details.ulbs.total, Source: 'LGD Urban Directory' },
    { Entity: 'Gram Panchayats (Rural)', Count: report.details.gramPanchayats.total, Source: 'LGD Rural Directory' },
    { Entity: 'Wards (Urban)', Count: report.details.wards.total, Source: 'LGD Urban Directory' },
    { Entity: 'Villages / Mouzas', Count: report.details.villages.total, Source: 'LGD Rural Directory' },
    { Entity: 'Postal Locations (PIN)', Count: report.details.postalLocations.total, Source: 'India Post Directory (No delivery_status)' },
    { Entity: 'Police Stations', Count: report.details.policeStations.total, Source: 'West Bengal Police Directory' },
    { Entity: 'GIS Boundaries', Count: report.details.boundaries.total, Source: 'West Bengal GIS Boundaries' }
  ]);

  const reportOut = path.join(__dirname, '../data/import-reports/validation_audit_report.json');
  fs.writeFileSync(reportOut, JSON.stringify(report, null, 2));
  console.log(`\n✓ Full audit report saved to: ${reportOut}`);

  await mongoose.disconnect();
  const overallSuccess = report.duplicates === 0 && report.orphans === 0 && report.invalidPin === 0 && report.deliveryStatusViolations === 0;
  process.exit(overallSuccess ? 0 : 1);
}

validateDatabase().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
