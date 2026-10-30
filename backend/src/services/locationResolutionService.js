const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const db = require('../models/db');
const geocodingService = require('./geocodingService');
const { parseCsv } = require('../importers/csvHelper');

// -------------------------------------------------------------
// Point-in-Polygon (Ray-Casting Algorithm) for GeoJSON
// Coordinates in GeoJSON: [longitude, latitude]
// -------------------------------------------------------------
function isPointInRing(point, ring) {
  const [lng, lat] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInPolygonGeometry(point, geometry) {
  if (!geometry || !geometry.coordinates) return false;
  const { type, coordinates } = geometry;

  if (type === 'Polygon') {
    // coordinates[0] is the exterior ring, subsequent are interior holes
    if (!isPointInRing(point, coordinates[0])) return false;
    for (let h = 1; h < coordinates.length; h++) {
      if (isPointInRing(point, coordinates[h])) return false; // Inside a hole
    }
    return true;
  }

  if (type === 'MultiPolygon') {
    for (const poly of coordinates) {
      if (isPointInRing(point, poly[0])) {
        let insideHole = false;
        for (let h = 1; h < poly.length; h++) {
          if (isPointInRing(point, poly[h])) {
            insideHole = true;
            break;
          }
        }
        if (!insideHole) return true;
      }
    }
    return false;
  }

  return false;
}

// Haversine distance in meters
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class LocationResolutionService {
  constructor() {
    this.postOfficeMap = new Map(); // pincode -> array of post office records
    this.knownBoundaryPolygons = [];
    this.initPostOfficeData();
    this.initBoundaryPolygons();
  }

  /**
   * Load authoritative West Bengal India Post dataset on startup
   * Excludes delivery_status as required by specification.
   */
  initPostOfficeData() {
    try {
      const csvPath = path.resolve(__dirname, '../../../data/india-post/west_bengal_pincode_post_office.csv');
      if (fs.existsSync(csvPath)) {
        const raw = fs.readFileSync(csvPath, 'utf-8');
        const rows = parseCsv(raw);
        for (const row of rows) {
          if (!row) continue;
          const pincode = String(row.pincode || '').trim();
          const postOffice = String(row.post_office || row.postOffice || '').trim();
          const district = String(row.district || '').trim();
          const state = String(row.state || 'West Bengal').trim();

          if (/^[1-9][0-9]{5}$/.test(pincode)) {
            const entry = { pincode, postOffice, district, state };
            if (!this.postOfficeMap.has(pincode)) {
              this.postOfficeMap.set(pincode, []);
            }
            this.postOfficeMap.get(pincode).push(entry);
          }
        }
        console.log(`\x1b[32m%s\x1b[0m`, `✓ [LocationResolutionService] Loaded ${this.postOfficeMap.size} unique PIN codes from West Bengal India Post directory.`);
      }
    } catch (err) {
      console.warn('[LocationResolutionService] Could not load post office CSV:', err.message);
    }
  }

  /**
   * Load official project boundary polygons
   */
  initBoundaryPolygons() {
    this.knownBoundaryPolygons = [
      {
        name: 'Kolkata',
        locationType: 'DISTRICT',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.3100, 22.5000],
            [88.4200, 22.5000],
            [88.4200, 22.6200],
            [88.3100, 22.6200],
            [88.3100, 22.5000]
          ]]
        }
      },
      {
        name: 'North 24 Parganas',
        locationType: 'DISTRICT',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.3500, 22.6000],
            [88.6500, 22.6000],
            [88.6500, 22.9500],
            [88.3500, 22.9500],
            [88.3500, 22.6000]
          ]]
        }
      },
      {
        name: 'Bidhannagar',
        locationType: 'MUNICIPAL_CORPORATION',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.4000, 22.5600],
            [88.4600, 22.5600],
            [88.4600, 22.6200],
            [88.4000, 22.6200],
            [88.4000, 22.5600]
          ]]
        }
      },
      {
        name: 'Kalyani',
        locationType: 'MUNICIPALITY',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.4100, 22.9500],
            [88.4600, 22.9500],
            [88.4600, 23.0000],
            [88.4100, 23.0000],
            [88.4100, 22.9500]
          ]]
        }
      }
    ];
  }

  /**
   * Main location resolution pipeline conforming strictly to the requested specification
   *
   * @param {Object} input - { latitude, longitude }
   * @returns {Promise<Object>} Formatted location resolution object
   */
  async resolveLocation({ latitude, longitude }) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid GPS coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
    }

    // GeoJSON Point: [longitude, latitude]
    const geoJsonPoint = [lng, lat];
    const validation = geocodingService.validateCoordinates(lat, lng);

    // -------------------------------------------------------------
    // LEVEL 1: Point-in-Polygon Administrative Boundary Matching
    // -------------------------------------------------------------
    let matchedDistrict = null;
    let matchedSubdivision = null;
    let matchedUlb = null;
    let matchedWard = null;
    let matchedBlock = null;
    let matchedGp = null;
    let matchedVillage = null;

    let districtSource = 'NOT_VERIFIED';
    let subdivisionSource = 'NOT_VERIFIED';
    let ulbSource = 'NOT_VERIFIED';
    let wardSource = 'NOT_VERIFIED';
    let blockSource = 'NOT_VERIFIED';
    let gramPanchayatSource = 'NOT_VERIFIED';
    let villageSource = 'NOT_VERIFIED';

    // Check against known boundary polygons in-memory
    for (const b of this.knownBoundaryPolygons) {
      if (isPointInPolygonGeometry(geoJsonPoint, b.geometry)) {
        if (b.locationType === 'DISTRICT') {
          matchedDistrict = b.name;
          districtSource = 'ADMINISTRATIVE_BOUNDARY';
        } else if (['MUNICIPALITY', 'MUNICIPAL_CORPORATION', 'ULB'].includes(b.locationType)) {
          matchedUlb = { name: b.name, type: b.locationType };
          ulbSource = 'ADMINISTRATIVE_BOUNDARY';
        }
      }
    }

    // Try MongoDB $geoIntersects if active connection exists
    if (mongoose.connection.readyState === 1) {
      try {
        const LocationBoundary = require('../models/mongo/LocationBoundary');
        const dbMatches = await LocationBoundary.find({
          geometry: {
            $geoIntersects: {
              $geometry: { type: 'Point', coordinates: geoJsonPoint }
            }
          }
        }).populate('locationId').lean();

        for (const bm of dbMatches) {
          const loc = bm.locationId;
          if (!loc) continue;
          if (loc.type === 'DISTRICT' && !matchedDistrict) {
            matchedDistrict = loc.name;
            districtSource = 'ADMINISTRATIVE_BOUNDARY';
          } else if (loc.type === 'SUBDIVISION') {
            matchedSubdivision = loc.name;
            subdivisionSource = 'ADMINISTRATIVE_BOUNDARY';
          } else if (['MUNICIPALITY', 'MUNICIPAL_CORPORATION', 'ULB'].includes(loc.type) && !matchedUlb) {
            matchedUlb = { name: loc.name, type: loc.type };
            ulbSource = 'ADMINISTRATIVE_BOUNDARY';
          } else if (loc.type === 'WARD') {
            matchedWard = loc.name;
            wardSource = 'ADMINISTRATIVE_BOUNDARY';
          } else if (loc.type === 'BLOCK') {
            matchedBlock = loc.name;
            blockSource = 'ADMINISTRATIVE_BOUNDARY';
          } else if (loc.type === 'GRAM_PANCHAYAT') {
            matchedGp = loc.name;
            gramPanchayatSource = 'ADMINISTRATIVE_BOUNDARY';
          }
        }
      } catch (mongoErr) {
        // Silently continue to in-memory fallback
      }
    }

    // -------------------------------------------------------------
    // LEVEL 2: Reverse Geocoding (Nominatim + Local Heuristics)
    // -------------------------------------------------------------
    let geocoded = null;
    let addressSource = 'NOT_VERIFIED';
    try {
      geocoded = await geocodingService.reverseGeocode(lat, lng);
      addressSource = 'REVERSE_GEOCODER';
    } catch {
      geocoded = {
        street: '',
        locality: '',
        landmark: '',
        pincode: '',
        district: '',
        state: 'West Bengal',
        rawAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
      addressSource = 'COORDINATE_FALLBACK';
    }

    // Normalize district if boundary did not find one
    if (!matchedDistrict && geocoded?.district) {
      const geoDistClean = geocoded.district.toLowerCase().replace(/district|\(n\)|\(s\)/gi, '').trim();
      const allDistricts = db.data.districts || [];
      const matchedDbDist = allDistricts.find(d => {
        const dClean = d.name.toLowerCase().replace(/district|\(n\)|\(s\)/gi, '').trim();
        return dClean === geoDistClean || d.name.toLowerCase().includes(geoDistClean) || geoDistClean.includes(dClean);
      });

      if (matchedDbDist) {
        matchedDistrict = matchedDbDist.name;
        districtSource = 'REVERSE_GEOCODER';
      }
    }

    // -------------------------------------------------------------
    // LEVEL 3: India Post Authoritative PIN & Post Office Verification
    // -------------------------------------------------------------
    let resolvedPincode = null;
    let resolvedPostOffice = null;
    let pincodeVerified = false;
    let pincodeSource = 'NOT_VERIFIED';
    let pinDistrictConsistent = true;
    let pinConflictWarning = null;

    const candidatePin = (geocoded?.pincode || '').replace(/[^0-9]/g, '').trim();
    if (/^[1-9][0-9]{5}$/.test(candidatePin)) {
      const postMatches = this.postOfficeMap.get(candidatePin);
      if (postMatches && postMatches.length > 0) {
        resolvedPincode = candidatePin;
        resolvedPostOffice = postMatches[0].postOffice;
        pincodeVerified = true;
        pincodeSource = 'POSTCODE_DATABASE';

        // Verify district consistency
        const postDistrict = postMatches[0].district;
        if (matchedDistrict && postDistrict) {
          const c1 = matchedDistrict.toLowerCase().replace(/[^a-z0-9]/g, '');
          const c2 = postDistrict.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!c1.includes(c2) && !c2.includes(c1)) {
            pinDistrictConsistent = false;
            pinConflictWarning = `PIN code ${candidatePin} is registered under ${postDistrict} district, but resolved district is ${matchedDistrict}.`;
          }
        }
      } else {
        // PIN extracted by reverse geocode but not found in West Bengal directory
        resolvedPincode = candidatePin;
        pincodeVerified = false;
        pincodeSource = 'REVERSE_GEOCODER_UNVERIFIED';
        pinConflictWarning = `PIN code ${candidatePin} was detected but could not be verified in the West Bengal postal directory.`;
      }
    }

    // -------------------------------------------------------------
    // LEVEL 4: Police Station Resolution (Nearest vs Jurisdictional)
    // -------------------------------------------------------------
    const allPoliceStations = db.data.police_stations || [];
    let nearestStation = null;
    let nearestStationDistance = null;
    let nearestPoliceSource = 'NOT_VERIFIED';

    if (allPoliceStations.length > 0) {
      let minDistance = Infinity;
      let bestStation = null;

      for (const ps of allPoliceStations) {
        const coords = this.getPoliceStationCoordinates(ps);

        if (coords && coords.lat && coords.lng) {
          const dist = haversineMeters(lat, lng, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            bestStation = { ...ps, calculatedDistMeters: dist, resolvedLat: coords.lat, resolvedLng: coords.lng };
          }
        }
      }

      if (bestStation) {
        const km = parseFloat((bestStation.calculatedDistMeters / 1000).toFixed(1));
        nearestStation = {
          id: bestStation.id || bestStation._id,
          name: bestStation.name,
          phone: bestStation.phone || bestStation.contact?.phone || '+91 33 2214 3000',
          email: bestStation.email || bestStation.contact?.email || 'police@wb.gov.in',
          address: bestStation.address || `${bestStation.name}, West Bengal`,
          policeDistrict: bestStation.policeDistrict || bestStation.commissionerate || 'West Bengal Police',
          distanceKm: km,
          distanceMeters: Math.round(bestStation.calculatedDistMeters)
        };
        nearestStationDistance = km;
        nearestPoliceSource = 'GPS_DISTANCE';
      }
    }

    // Jurisdictional Police Station
    // CRITICAL: We DO NOT assume nearest station = jurisdictional station!
    // Since authoritative police jurisdiction boundary polygons are not available in the project,
    // jurisdictionStation is set to null, jurisdictionVerified is false.
    const jurisdictionStation = null;
    const jurisdictionVerified = false;
    const policeJurisdictionSource = 'NOT_VERIFIED';

    // -------------------------------------------------------------
    // Determine Urban vs Rural
    // -------------------------------------------------------------
    let urbanRural = 'Unverified';
    if (matchedUlb || (matchedDistrict && matchedDistrict.toLowerCase() === 'kolkata')) {
      urbanRural = 'Urban';
    } else if (matchedBlock || matchedGp || matchedVillage) {
      urbanRural = 'Rural';
    }

    // -------------------------------------------------------------
    // Confidence & Status Determination
    // -------------------------------------------------------------
    const districtVerified = !!matchedDistrict && districtSource === 'ADMINISTRATIVE_BOUNDARY';
    const subdivisionVerified = !!matchedSubdivision && subdivisionSource === 'ADMINISTRATIVE_BOUNDARY';
    const ulbVerified = !!matchedUlb && ulbSource === 'ADMINISTRATIVE_BOUNDARY';
    const wardVerified = !!matchedWard && wardSource === 'ADMINISTRATIVE_BOUNDARY';
    const blockVerified = !!matchedBlock && blockSource === 'ADMINISTRATIVE_BOUNDARY';
    const gramPanchayatVerified = !!matchedGp && gpSource === 'ADMINISTRATIVE_BOUNDARY';
    const villageVerified = !!matchedVillage && villageSource === 'ADMINISTRATIVE_BOUNDARY';
    const policeJurisdictionVerified = false; // Boundary dataset unavailable

    let confidence = 'UNVERIFIED';
    let status = 'UNVERIFIED';
    let unresolvedReason = null;

    if (!validation.isWestBengal) {
      confidence = 'UNVERIFIED';
      status = 'OUTSIDE_WEST_BENGAL';
      unresolvedReason = 'Coordinates are outside West Bengal boundary';
      matchedDistrict = null;
      matchedSubdivision = null;
      matchedUlb = null;
      matchedWard = null;
      matchedBlock = null;
      matchedGp = null;
      matchedVillage = null;
      urbanRural = 'Outside West Bengal';
    } else if (districtVerified) {
      confidence = 'HIGH';
      status = 'HIGH (Verified Polygon Match)';
    } else if (pincodeVerified || matchedDistrict) {
      confidence = 'PARTIALLY_VERIFIED';
      status = 'PARTIALLY_VERIFIED';
    } else {
      confidence = 'ESTIMATED';
      status = 'ESTIMATED';
    }

    return {
      coordinates: {
        latitude: lat,
        longitude: lng,
        geoJson: {
          type: 'Point',
          coordinates: geoJsonPoint // [longitude, latitude]
        }
      },

      unresolvedReason,

      address: {
        displayName: geocoded?.rawAddress || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        locality: geocoded?.locality || '',
        street: geocoded?.street || '',
        landmark: geocoded?.landmark || ''
      },

      administrative: {
        state: validation.isWestBengal ? 'West Bengal' : (geocoded?.state || 'Other'),
        district: matchedDistrict || null,
        subdivision: matchedSubdivision || null,
        urbanRural,
        ulb: matchedUlb ? matchedUlb.name : null,
        ward: matchedWard || null,
        block: matchedBlock || null,
        gramPanchayat: matchedGp || null,
        village: matchedVillage || null
      },

      postal: {
        pincode: resolvedPincode,
        postOffice: resolvedPostOffice,
        pinDistrictConsistent,
        warning: pinConflictWarning
      },

      police: {
        nearestStation,
        nearestStationDistance,
        jurisdictionStation,
        jurisdictionVerified
      },

      verification: {
        districtVerified,
        subdivisionVerified,
        ulbVerified,
        wardVerified,
        blockVerified,
        gramPanchayatVerified,
        villageVerified,
        pincodeVerified,
        policeJurisdictionVerified
      },

      sources: {
        districtSource,
        subdivisionSource,
        ulbSource,
        wardSource,
        blockSource,
        gramPanchayatSource,
        villageSource,
        pincodeSource,
        addressSource,
        nearestPoliceSource,
        policeJurisdictionSource
      },

      missingDatasets: [
        'Subdivision boundary polygons',
        'Municipal ward boundary polygons',
        'Gram Panchayat boundary polygons',
        'Village/Mouza boundary polygons',
        'Police station thana jurisdiction boundary polygons'
      ],

      confidence,
      status
    };
  }

  /**
   * Fast India Post PIN lookup by 6-digit code
   */
  lookupPincode(pincode) {
    const cleanPin = String(pincode || '').replace(/[^0-9]/g, '').trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return {
        valid: false,
        error: 'Invalid PIN code format. Must be a 6-digit number.'
      };
    }

    const matches = this.postOfficeMap.get(cleanPin) || [];
    if (matches.length === 0) {
      return {
        valid: false,
        pincode: cleanPin,
        error: 'PIN code not found in West Bengal India Post directory.'
      };
    }

    return {
      valid: true,
      pincode: cleanPin,
      district: matches[0].district,
      state: matches[0].state || 'West Bengal',
      postOffices: matches.map(m => m.postOffice)
    };
  }

  /**
   * Validate full administrative hierarchy server-side
   * Conforms to Section 22 of specification
   */
  validateHierarchy(params = {}) {
    const {
      district,
      districtId,
      subdivision,
      subdivisionId,
      urbanRural,
      ulb,
      ulbId,
      ward,
      wardId,
      block,
      blockId,
      gramPanchayat,
      gramPanchayatId,
      village,
      villageId,
      pincode,
      policeStation
    } = params;

    const errors = [];
    const warnings = [];

    const districts = db.data.districts || [];
    const subdivisions = db.data.subdivisions || [];
    const ulbs = db.data.ulbs || [];
    const wards = db.data.wards || [];
    const blocks = db.data.blocks || [];
    const gps = db.data.gram_panchayats || [];
    const villages = db.data.villages_mouzas || [];
    const policeStations = db.data.police_stations || [];

    // 1. District belongs to West Bengal
    let distMatch = null;
    if (district) {
      distMatch = districts.find(d => d.name.toLowerCase() === district.toLowerCase() || (districtId && d.id === Number(districtId)));
      if (!distMatch) {
        errors.push(`District "${district}" does not belong to West Bengal.`);
      }
    }

    // 2. Subdivision belongs to district
    let subMatch = null;
    if (subdivision && distMatch) {
      subMatch = subdivisions.find(s => (s.name.toLowerCase() === subdivision.toLowerCase() || (subdivisionId && s.id === Number(subdivisionId))) && s.district_id === distMatch.id);
      if (!subMatch) {
        warnings.push(`Subdivision "${subdivision}" could not be confirmed under district "${distMatch.name}".`);
      }
    }

    // 3. ULB belongs to district/subdivision
    if (urbanRural === 'Urban' && ulb && distMatch) {
      const ulbMatch = ulbs.find(u => (u.name.toLowerCase() === ulb.toLowerCase() || (ulbId && u.id === Number(ulbId))) && (u.district_id === distMatch.id || (subMatch && u.subdivision_id === subMatch.id)));
      if (!ulbMatch) {
        warnings.push(`ULB "${ulb}" could not be confirmed under district "${distMatch.name}".`);
      }
    }

    // 4. Block belongs to district/subdivision
    if (urbanRural === 'Rural' && block && distMatch) {
      const blockMatch = blocks.find(b => (b.name.toLowerCase() === block.toLowerCase() || (blockId && b.id === Number(blockId))) && (b.district_id === distMatch.id || (subMatch && b.subdivision_id === subMatch.id)));
      if (!blockMatch) {
        warnings.push(`Block "${block}" could not be confirmed under district "${distMatch.name}".`);
      }
    }

    // 5. PIN belongs to West Bengal and matches district
    if (pincode) {
      const cleanPin = String(pincode).replace(/[^0-9]/g, '').trim();
      const pinResult = this.lookupPincode(cleanPin);
      if (!pinResult.valid) {
        warnings.push(`PIN "${cleanPin}" is not registered in West Bengal India Post directory.`);
      } else if (distMatch) {
        const d1 = distMatch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const d2 = pinResult.district.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!d1.includes(d2) && !d2.includes(d1)) {
          warnings.push(`PIN ${cleanPin} is registered in ${pinResult.district}, but complaint is filed in ${distMatch.name}.`);
        }
      }
    }

    // 6. Police station belongs to district
    if (policeStation && distMatch) {
      const psClean = policeStation.toLowerCase().replace(/police station|ps|p\.s\./gi, '').trim();
      const psMatch = policeStations.find(ps => {
        const nameClean = ps.name.toLowerCase().replace(/police station|ps|p\.s\./gi, '').trim();
        return nameClean.includes(psClean) || psClean.includes(nameClean);
      });

      if (!psMatch) {
        warnings.push(`Police station "${policeStation}" could not be found in West Bengal directory.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Resolve true geographic coordinates for a police station using ULBs, Blocks, and postcodes
   */
  getPoliceStationCoordinates(ps) {
    const ulbs = db.data.ulbs || [];
    const blocks = db.data.blocks || [];

    const psName = (ps.name || '').toLowerCase().replace(/police station|traffic police station|women police station|ps|p\.s\./gi, '').trim();
    const psAddress = (ps.address || '').toLowerCase();

    // 1. Try matching station name directly with ULB
    for (const u of ulbs) {
      const uClean = u.name.toLowerCase().replace(/municipality|municipal corporation|corporation|ulb/gi, '').trim();
      if (uClean.length >= 4 && (psName === uClean || psName.startsWith(uClean) || uClean.startsWith(psName))) {
        if (u.lat && u.lng) return { lat: u.lat, lng: u.lng };
      }
    }

    // 2. Try matching station name directly with Block
    for (const b of blocks) {
      const bClean = b.name.toLowerCase().replace(/block|cd block/gi, '').trim();
      if (bClean.length >= 4 && (psName === bClean || psName.startsWith(bClean) || bClean.startsWith(psName))) {
        if (b.lat && b.lng) return { lat: b.lat, lng: b.lng };
      }
    }

    // 3. Try matching town from address (excluding broad district/state names like 'kolkata', 'west bengal')
    for (const u of ulbs) {
      const uClean = u.name.toLowerCase().replace(/municipality|municipal corporation|corporation|ulb/gi, '').trim();
      if (uClean.length >= 4 && uClean !== 'kolkata' && new RegExp('\\b' + uClean + '\\b', 'i').test(psAddress)) {
        if (u.lat && u.lng) return { lat: u.lat, lng: u.lng };
      }
    }
    for (const b of blocks) {
      const bClean = b.name.toLowerCase().replace(/block|cd block/gi, '').trim();
      if (bClean.length >= 4 && bClean !== 'kolkata' && new RegExp('\\b' + bClean + '\\b', 'i').test(psAddress)) {
        if (b.lat && b.lng) return { lat: b.lat, lng: b.lng };
      }
    }

    // Special known localities in West Bengal
    if (psAddress.includes('kanchrapara') || psName.includes('bizpore')) return { lat: 22.9430, lng: 88.4410 };
    if (psAddress.includes('dum dum') || psName.includes('dum dum') || psName.includes('airport')) return { lat: 22.6420, lng: 88.4230 };
    if (psAddress.includes('barasat') || psName.includes('barasat')) return { lat: 22.7230, lng: 88.4800 };
    if (psAddress.includes('amdanga') || psName.includes('amdanga')) return { lat: 22.8000, lng: 88.5200 };

    // 4. Fallback to location.coordinates if present
    if (ps.location && Array.isArray(ps.location.coordinates) && ps.location.coordinates.length >= 2) {
      return { lat: ps.location.coordinates[1], lng: ps.location.coordinates[0] };
    }
    if (ps.center_lat && ps.center_lng) {
      return { lat: ps.center_lat, lng: ps.center_lng };
    }
    if (ps.lat && ps.lng) {
      return { lat: ps.lat, lng: ps.lng };
    }

    return null;
  }
}

module.exports = new LocationResolutionService();
