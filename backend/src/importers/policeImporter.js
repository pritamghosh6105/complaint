const fs = require('fs');
const path = require('path');
const { parseCsv } = require('./csvHelper');
const PoliceStation = require('../models/mongo/PoliceStation');
const { Location } = require('../models/mongo/Location');

// Commissionerate mapping for West Bengal Police Stations
const COMMISSIONERATE_RULES = [
  { comm: 'Kolkata Police', keywords: ['kolkata', 'alipore', 'bhowanipore', 'park street', 'bowbazar', 'shyampukur', 'entally', 'kalighat', 'tollygunge', 'new alipore', 'watgunge', 'ballygunge', 'hussainpur', 'madurdaha'] },
  { comm: 'Bidhannagar Police Commissionerate', keywords: ['bidhannagar', 'salt lake', 'airport', 'newtown', 'new town', 'baguiati', 'lake town', 'ecopark'] },
  { comm: 'Barrackpore Police Commissionerate', keywords: ['barrackpore', 'titagarh', 'belgharia', 'nimta', 'khardah', 'naihati', 'bhatpara', 'dum dum', 'baranagar', 'ghola', 'jagaddal'] },
  { comm: 'Howrah Police Commissionerate', keywords: ['howrah', 'shibpur', 'golabari', 'bally', 'malipanchghora', 'chatterjee hat', 'dasnagar', 'santragachi'] },
  { comm: 'Chandannagar Police Commissionerate', keywords: ['chandannagar', 'chinsurah', 'serampore', 'dankuni', 'bhadreswar', 'rishra', 'uttarpara'] },
  { comm: 'Asansol-Durgapur Police Commissionerate', keywords: ['asansol', 'durgapur', 'raniganj', 'kulti', 'jamuria', 'barakar', 'andal', 'pandabeswar', 'chittaranjan'] },
  { comm: 'Siliguri Police Commissionerate', keywords: ['siliguri', 'matigara', 'pradhannagar', 'bhaktinagar', 'bagdogra'] }
];

class PoliceImporter {
  constructor(options = {}) {
    this.reportDir = options.reportDir || path.resolve(__dirname, '../../../data/import-reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async importFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let records = [];

    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf-8');
      records = parseCsv(content);
    } else if (ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      records = Array.isArray(parsed) ? parsed : (parsed.records || [parsed]);
    } else {
      throw new Error(`Unsupported file extension ${ext}. Please provide a .csv or .json file.`);
    }

    const report = {
      filename: path.basename(filePath),
      timestamp: new Date().toISOString(),
      totalRecords: records.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      missingCoords: 0,
      errors: []
    };

    // Cache all districts in memory for rapid matching
    const allDistricts = await Location.find({ type: 'DISTRICT', isActive: true }).lean();

    const BATCH_SIZE = 100;
    let batchOps = [];
    const seenNames = new Set();

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      try {
        const item = this.normalizeRecord(raw);

        if (!item.name) {
          report.skipped++;
          continue;
        }

        const nameKey = item.name.toLowerCase().trim();
        if (seenNames.has(nameKey)) {
          report.skipped++;
          continue;
        }
        seenNames.add(nameKey);

        // Resolve district: from explicit name or matching against address/area/name
        let matchedDistrict = null;
        const textToSearch = `${item.districtName || ''} ${item.address || ''} ${raw.area || ''} ${item.name}`.toLowerCase();

        if (item.districtName) {
          matchedDistrict = allDistricts.find(d => 
            d.name.toLowerCase() === item.districtName.toLowerCase().trim() ||
            (d.lgdCode && String(d.lgdCode) === String(item.districtName).trim())
          );
        }

        if (!matchedDistrict) {
          // Check common aliases
          for (const dist of allDistricts) {
            const dName = dist.name.toLowerCase();
            if (textToSearch.includes(dName)) {
              matchedDistrict = dist;
              break;
            }
          }
          if (!matchedDistrict) {
            if (textToSearch.includes('calcutta') || textToSearch.includes('kolkata')) {
              matchedDistrict = allDistricts.find(d => d.name.toLowerCase().includes('kolkata'));
            } else if (textToSearch.includes('24 parganas (n)') || textToSearch.includes('north 24') || textToSearch.includes('barasat') || textToSearch.includes('dum dum')) {
              matchedDistrict = allDistricts.find(d => d.name.toLowerCase().includes('north 24'));
            } else if (textToSearch.includes('24 parganas (s)') || textToSearch.includes('south 24') || textToSearch.includes('alipore')) {
              matchedDistrict = allDistricts.find(d => d.name.toLowerCase().includes('south 24'));
            } else if (textToSearch.includes('burdwan') || textToSearch.includes('bardhaman')) {
              matchedDistrict = allDistricts.find(d => d.name.toLowerCase().includes('purba bardhaman')) || allDistricts.find(d => d.name.toLowerCase().includes('bardhaman'));
            } else if (textToSearch.includes('midnapore') || textToSearch.includes('medinipur')) {
              matchedDistrict = allDistricts.find(d => d.name.toLowerCase().includes('paschim medinipur'));
            } else if (textToSearch.includes('hooghly') || textToSearch.includes('hugli')) {
              matchedDistrict = allDistricts.find(d => d.name.toLowerCase().includes('hooghly'));
            } else if (textToSearch.includes('howrah') || textToSearch.includes('haora')) {
              matchedDistrict = allDistricts.find(d => d.name.toLowerCase().includes('howrah'));
            }
          }
        }

        // Determine Commissionerate or District Police
        let commissionerate = item.commissionerate || null;
        let policeDistrict = item.policeDistrict || null;

        if (!commissionerate) {
          for (const rule of COMMISSIONERATE_RULES) {
            if (rule.keywords.some(k => textToSearch.includes(k))) {
              commissionerate = rule.comm;
              policeDistrict = rule.comm;
              break;
            }
          }
        }

        if (!policeDistrict) {
          policeDistrict = matchedDistrict ? `${matchedDistrict.name} District Police` : 'State Police Jurisdiction';
        }

        // Validate or compute coordinates
        let locationGeo = null;
        if (item.longitude !== null && item.latitude !== null && !isNaN(item.longitude) && !isNaN(item.latitude)) {
          if (item.longitude >= -180 && item.longitude <= 180 && item.latitude >= -90 && item.latitude <= 90) {
            locationGeo = {
              type: 'Point',
              coordinates: [item.longitude, item.latitude]
            };
          }
        }

        if (!locationGeo) {
          report.missingCoords++;
          const fallbackLng = matchedDistrict?.longitude || 88.3639;
          const fallbackLat = matchedDistrict?.latitude || 22.5726;
          locationGeo = {
            type: 'Point',
            coordinates: [fallbackLng, fallbackLat]
          };
        }

        // Format contact phone number cleanly
        let phoneStr = item.phone || '+91 33 2214 3000';
        if (phoneStr.length === 10 && !phoneStr.startsWith('+')) {
          phoneStr = `+91 ${phoneStr}`;
        }

        const updateData = {
          name: item.name,
          districtId: matchedDistrict ? matchedDistrict._id : null,
          policeDistrict: policeDistrict,
          commissionerate: commissionerate,
          subdivision: item.subdivision || null,
          address: item.address || `${item.name}, West Bengal`,
          contact: {
            phone: phoneStr,
            email: item.email || `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@wbpolice.gov.in`
          },
          location: locationGeo,
          source: item.source || 'West Bengal Police Official Directory',
          sourceUpdatedAt: new Date(),
          last_verified: new Date(),
          isActive: true
        };

        batchOps.push({
          updateOne: {
            filter: { name: item.name },
            update: { $set: updateData },
            upsert: true
          }
        });

        if (batchOps.length >= BATCH_SIZE) {
          const bulkRes = await PoliceStation.bulkWrite(batchOps, { ordered: false });
          report.inserted += (bulkRes.upsertedCount || 0);
          report.updated += (bulkRes.modifiedCount || 0);
          batchOps = [];
        }
      } catch (err) {
        report.errors.push({ row: i + 1, error: err.message, record: raw });
      }
    }

    // Flush any remaining batch operations
    if (batchOps.length > 0) {
      const bulkRes = await PoliceStation.bulkWrite(batchOps, { ordered: false });
      report.inserted += (bulkRes.upsertedCount || 0);
      report.updated += (bulkRes.modifiedCount || 0);
      batchOps = [];
    }

    const repFile = path.join(this.reportDir, `police_report_${Date.now()}.json`);
    fs.writeFileSync(repFile, JSON.stringify(report, null, 2));
    console.log(`✓ Police Import Complete: Total=${report.totalRecords}, Inserted=${report.inserted}, Updated=${report.updated}, Skipped=${report.skipped}, MissingCoordsFallback=${report.missingCoords}, Errors=${report.errors.length}`);
    return report;
  }

  normalizeRecord(raw) {
    const keys = Object.keys(raw);
    const getVal = (patterns) => {
      for (const p of patterns) {
        for (const k of keys) {
          if (k.toLowerCase().includes(p)) {
            const v = String(raw[k] || '').trim();
            if (v && v.toLowerCase() !== 'null' && v.toLowerCase() !== 'undefined') return v;
          }
        }
      }
      return null;
    };

    let name = getVal(['station_name', 'police_station', 'ps_name', 'name']);
    if (name) {
      name = name.replace(/\s+/g, ' ').trim();
      if (!name.toLowerCase().includes('police station') && !name.toLowerCase().includes('outpost') && !name.toLowerCase().includes('thana')) {
        name = `${name} Police Station`;
      }
    }

    const districtName = getVal(['district_name', 'district', 'dist']);
    const policeDistrict = getVal(['police_district', 'police_dist', 'jurisdiction']);
    const commissionerate = getVal(['commissionerate', 'comm']);
    const subdivision = getVal(['subdivision', 'subdiv', 'sub_division']);
    const address = getVal(['address', 'location_address']) || '';
    const phone = getVal(['phone', 'contact_no', 'telephone', 'mobile']);
    const email = getVal(['email', 'mail']);
    const source = getVal(['source_url', 'source', 'url']) || 'West Bengal Police';

    const latStr = getVal(['latitude', 'lat']);
    const lngStr = getVal(['longitude', 'lng', 'long']);
    const latitude = latStr ? parseFloat(latStr) : null;
    const longitude = lngStr ? parseFloat(lngStr) : null;

    return {
      name,
      districtName,
      policeDistrict,
      commissionerate,
      subdivision,
      address,
      phone,
      email,
      source,
      latitude: !isNaN(latitude) ? latitude : null,
      longitude: !isNaN(longitude) ? longitude : null
    };
  }
}

module.exports = PoliceImporter;
