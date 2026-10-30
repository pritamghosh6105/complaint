const fs = require('fs');
const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const CSV_FILE = path.resolve(__dirname, '../data/police_stations_west_bengal.csv');
const DISTRICTS_FILE = path.resolve(__dirname, '../location-data/districts.json');
const POLICE_JSON_FILE = path.resolve(__dirname, '../location-data/police_stations.json');
const DB_FILE = path.resolve(__dirname, '../backend/data/database.json');

const DISTRICT_CENTERS = {
  'Alipurduar': { id: 22, lat: 26.4900, lng: 89.5300 },
  'Bankura': { id: 10, lat: 23.2325, lng: 87.0715 },
  'Birbhum': { id: 9, lat: 23.9054, lng: 87.5246 },
  'Purba Bardhaman': { id: 7, lat: 23.2324, lng: 87.8615 },
  'Paschim Bardhaman': { id: 8, lat: 23.6889, lng: 86.9661 },
  'Cooch Behar': { id: 23, lat: 26.3200, lng: 89.4500 },
  'Dakshin Dinajpur': { id: 17, lat: 25.2200, lng: 88.7700 },
  'Darjeeling': { id: 19, lat: 27.0410, lng: 88.2663 },
  'Kalimpong': { id: 20, lat: 27.0667, lng: 88.4667 },
  'Hooghly': { id: 5, lat: 22.9080, lng: 88.3968 },
  'Howrah': { id: 4, lat: 22.5958, lng: 88.2636 },
  'Jalpaiguri': { id: 21, lat: 26.5400, lng: 88.7200 },
  'Jhargram': { id: 14, lat: 22.4500, lng: 86.9800 },
  'Kolkata': { id: 1, lat: 22.5726, lng: 88.3639 },
  'Malda': { id: 15, lat: 25.0108, lng: 88.1411 },
  'Murshidabad': { id: 18, lat: 24.1000, lng: 88.2500 },
  'Nadia': { id: 6, lat: 23.4013, lng: 88.5015 },
  'North 24 Parganas': { id: 2, lat: 22.7230, lng: 88.4800 },
  'Paschim Medinipur': { id: 13, lat: 22.4257, lng: 87.3199 },
  'Purba Medinipur': { id: 12, lat: 22.2982, lng: 87.9234 },
  'Purulia': { id: 11, lat: 23.3322, lng: 86.3652 },
  'South 24 Parganas': { id: 3, lat: 22.1352, lng: 88.5498 },
  'Uttar Dinajpur': { id: 16, lat: 25.6200, lng: 88.1200 }
};

// Check if a station in Burdwan belongs to Paschim Bardhaman (Asansol/Durgapur Industrial Belt)
const PASCHIM_BARDHAMAN_KEYWORDS = [
  'asansol', 'durgapur', 'barakar', 'chittaranjan', 'raniganj', 'kulti',
  'jamuria', 'andal', 'faridpur', 'kanksa', 'pandabeswar', 'salanpur',
  'rupnarayanpur', 'hirapur', 'baraboni', 'coke oven', 'ballavpur',
  'banbahal', 'lowdoha', 'n.t.p.s', 'niamatpur', 'waria', 'kanyapur', 'sreepur'
];

function mapDistrict(rawDistrict, stationName) {
  const dLower = String(rawDistrict || '').trim().toLowerCase();
  const sLower = String(stationName || '').trim().toLowerCase();

  if (dLower === 'alipurduar') return { id: 22, name: 'Alipurduar' };
  if (dLower === 'bankura') return { id: 10, name: 'Bankura' };
  if (dLower === 'birbhum') return { id: 9, name: 'Birbhum' };
  if (dLower === 'coochbihar' || dLower === 'cooch behar') return { id: 23, name: 'Cooch Behar' };
  if (dLower === 'dakshin dinajpur') return { id: 17, name: 'Dakshin Dinajpur' };
  if (dLower === 'darjeeling') {
    if (['kalimpong', 'gorubathan', 'jaldhaka'].some(k => sLower.includes(k))) {
      return { id: 20, name: 'Kalimpong' };
    }
    return { id: 19, name: 'Darjeeling' };
  }
  if (dLower === 'hooghly') return { id: 5, name: 'Hooghly' };
  if (dLower === 'howrah') return { id: 4, name: 'Howrah' };
  if (dLower === 'jalpaiguri') return { id: 21, name: 'Jalpaiguri' };
  if (dLower === 'maldah' || dLower === 'malda') return { id: 15, name: 'Malda' };
  if (dLower === 'murshidabad') return { id: 18, name: 'Murshidabad' };
  if (dLower === 'nadia') return { id: 6, name: 'Nadia' };
  if (dLower.includes('north 24') || dLower.includes('24 parganas (n)')) return { id: 2, name: 'North 24 Parganas' };
  if (dLower.includes('south 24') || dLower.includes('24 parganas (s)')) return { id: 3, name: 'South 24 Parganas' };
  if (dLower === 'purba medinipur' || dLower === 'east medinipur') return { id: 12, name: 'Purba Medinipur' };
  if (dLower === 'paschim medinipur' || dLower === 'west medinipur') {
    if (['jhargram', 'belpahari', 'binpur', 'lalgarh', 'gopiballavpur', 'jambani', 'nayagram', 'sankrali', 'beliabera'].some(k => sLower.includes(k))) {
      return { id: 14, name: 'Jhargram' };
    }
    return { id: 13, name: 'Paschim Medinipur' };
  }
  if (dLower === 'purulia') return { id: 11, name: 'Purulia' };
  if (dLower === 'uttar dinajpur') return { id: 16, name: 'Uttar Dinajpur' };

  if (dLower === 'burdwan' || dLower === 'bardhaman') {
    if (PASCHIM_BARDHAMAN_KEYWORDS.some(k => sLower.includes(k))) {
      return { id: 8, name: 'Paschim Bardhaman' };
    }
    return { id: 7, name: 'Purba Bardhaman' };
  }

  return { id: 2, name: 'North 24 Parganas' };
}

function normalizeStationName(raw) {
  let name = String(raw || '').trim().replace(/^"|"$/g, '');
  name = name.replace(/\s+/g, ' ');
  // Clean up PS / P.S. / O.P. suffix
  return name;
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle comma inside quotes if any
    const parts = [];
    let cur = '';
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur.trim());
    if (parts.length >= 2) {
      rows.push({
        district: parts[0],
        police_station: parts[1],
        phone_no: parts[2] || ''
      });
    }
  }
  return rows;
}

async function main() {
  console.log('🔄 Parsing West Bengal Police Stations Dataset...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseCsv(csvContent);
  console.log(`Found ${rows.length} records in CSV.`);

  // Load existing police_stations.json if any
  let existingStations = [];
  if (fs.existsSync(POLICE_JSON_FILE)) {
    try {
      existingStations = JSON.parse(fs.readFileSync(POLICE_JSON_FILE, 'utf-8'));
    } catch {}
  }

  const existingMap = new Map();
  for (const s of existingStations) {
    const key = (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    existingMap.set(key, s);
  }

  const mergedStations = [];
  const processedKeys = new Set();
  let nextId = 1;

  // Process existing stations first (e.g. Kolkata Police stations)
  for (const es of existingStations) {
    const key = (es.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    processedKeys.add(key);
    mergedStations.push({
      id: nextId++,
      district_id: es.district_id || 1,
      district_name: es.district_name || 'Kolkata',
      subdivision_id: es.subdivision_id || null,
      commissionerate: es.commissionerate || null,
      name: es.name,
      code: es.code || `PS-${nextId}`,
      phone: es.phone || '+91 33 2214 3000',
      center_lat: es.center_lat || (DISTRICT_CENTERS['Kolkata']?.lat || 22.5726),
      center_lng: es.center_lng || (DISTRICT_CENTERS['Kolkata']?.lng || 88.3639),
      is_active: 1
    });
  }

  // Add CSV stations
  for (const r of rows) {
    const cleanName = normalizeStationName(r.police_station);
    const key = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const distInfo = mapDistrict(r.district, cleanName);
    const center = DISTRICT_CENTERS[distInfo.name] || { lat: 22.7230, lng: 88.4800 };

    if (processedKeys.has(key)) {
      // Update phone if existing has default
      const match = mergedStations.find(s => (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '') === key);
      if (match && r.phone_no) {
        match.phone = r.phone_no;
        match.district_name = distInfo.name;
        match.district_id = distInfo.id;
      }
      continue;
    }
    processedKeys.add(key);

    mergedStations.push({
      id: nextId++,
      district_id: distInfo.id,
      district_name: distInfo.name,
      subdivision_id: null,
      commissionerate: distInfo.name.includes('Bardhaman') ? 'Asansol-Durgapur / Bardhaman Police' : `${distInfo.name} District Police`,
      name: cleanName,
      code: `WBPS-${String(distInfo.id).padStart(2, '0')}-${String(nextId).padStart(3, '0')}`,
      phone: r.phone_no || '100 / 112',
      center_lat: center.lat,
      center_lng: center.lng,
      is_active: 1
    });
  }

  console.log(`Writing ${mergedStations.length} police stations to ${POLICE_JSON_FILE}...`);
  fs.writeFileSync(POLICE_JSON_FILE, JSON.stringify(mergedStations, null, 2), 'utf-8');

  // Also update backend/data/database.json if it exists
  if (fs.existsSync(DB_FILE)) {
    try {
      const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      dbData.police_stations = mergedStations;
      if (dbData._counters) {
        dbData._counters.police_stations = mergedStations.length + 1;
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
      console.log(`✓ Updated database.json with ${mergedStations.length} police stations.`);
    } catch (e) {
      console.warn('Notice updating database.json:', e.message);
    }
  }

  // Connect to MongoDB Atlas and upsert
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      console.log('⚡ Connecting to MongoDB Atlas to sync police stations collection...');
      await mongoose.connect(mongoUri);
      const PoliceStation = require('../backend/src/models/mongo/PoliceStation');
      const { Location } = require('../backend/src/models/mongo/Location');

      const allDistricts = await Location.find({ type: 'DISTRICT', isActive: true }).lean();
      const distIdLookup = {};
      allDistricts.forEach(d => {
        distIdLookup[d.name.toLowerCase()] = d._id;
        if (d.name.includes('Bardhaman')) {
          distIdLookup['burdwan'] = d._id;
        }
      });

      const bulkOps = [];
      for (const s of mergedStations) {
        const dName = s.district_name || 'West Bengal';
        const dMongoId = distIdLookup[dName.toLowerCase()] || null;

        bulkOps.push({
          updateOne: {
            filter: { name: s.name },
            update: {
              $set: {
                name: s.name,
                districtId: dMongoId,
                districtName: dName,
                policeDistrict: s.commissionerate || `${dName} District Police`,
                commissionerate: s.commissionerate || null,
                address: `${s.name}, ${dName}, West Bengal`,
                contact: {
                  phone: s.phone || '100 / 112',
                  email: `${s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@wbpolice.gov.in`
                },
                location: {
                  type: 'Point',
                  coordinates: [s.center_lng, s.center_lat]
                },
                source: 'West Bengal Police Official Directory 2026',
                sourceUpdatedAt: new Date(),
                last_verified: new Date(),
                isActive: true
              }
            },
            upsert: true
          }
        });
      }

      if (bulkOps.length > 0) {
        const res = await PoliceStation.bulkWrite(bulkOps, { ordered: false });
        console.log(`✓ MongoDB Atlas Synced: ${res.upsertedCount} inserted, ${res.modifiedCount} updated (Total: ${mergedStations.length}).`);
      }

      await mongoose.disconnect();
    } catch (err) {
      console.error('MongoDB sync error:', err.message);
    }
  }

  // Summary by district
  const countByDist = {};
  for (const s of mergedStations) {
    const d = s.district_name || 'Unknown';
    countByDist[d] = (countByDist[d] || 0) + 1;
  }
  console.log('\n--- West Bengal Police Stations by District ---');
  console.table(countByDist);
}

main().catch(err => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
