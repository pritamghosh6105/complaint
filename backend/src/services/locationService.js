const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const db = require('../models/db');
const { Location } = require('../models/mongo/Location');
const PostalLocation = require('../models/mongo/PostalLocation');
const PoliceStation = require('../models/mongo/PoliceStation');
const locationResolutionService = require('./locationResolutionService');

function calcHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fast in-memory cache with 10-minute TTL and automatic eviction
const memoryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2500;

function getCached(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { time: Date.now(), data });
}

const HIERARCHY_PROJECTION = '_id name type state lgdCode parentId districtId subdivisionId blockId ulbId gramPanchayatId wardId latitude longitude';

function formatDoc(doc) {
  if (!doc) return null;
  return {
    ...doc,
    id: doc._id ? doc._id.toString() : doc.id
  };
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

class LocationService {
  toObjectId(id) {
    if (!id || id === 'undefined' || id === 'null') return null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
    return null;
  }

  // 1. All 23 West Bengal Districts (Cached & Projected)
  async getDistricts() {
    const cacheKey = 'districts_wb';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isMongoConnected()) {
      try {
        const districts = await Location.find({ 
          type: 'DISTRICT',
          isActive: true 
        })
        .select(HIERARCHY_PROJECTION)
        .sort({ name: 1 })
        .lean();

        if (districts && districts.length > 0) {
          const formatted = districts.map(formatDoc);
          setCached(cacheKey, formatted);
          return formatted;
        }
      } catch (e) {
        // Fall back to local db
      }
    }

    const fallback = (db.data.districts || []).map(d => ({
      id: d.id,
      _id: d._id || d.id,
      name: d.name,
      code: d.code,
      division: d.division,
      headquarters: d.headquarters,
      type: 'DISTRICT',
      latitude: d.center_lat,
      longitude: d.center_lng,
      state: 'West Bengal'
    })).sort((a, b) => a.name.localeCompare(b.name));

    setCached(cacheKey, fallback);
    return fallback;
  }

  // 2. Subdivisions under a district (Cached & Projected)
  async getSubdivisions(districtId) {
    if (!districtId || districtId === 'undefined' || districtId === 'null') return [];
    const cacheKey = `subdiv_${districtId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isMongoConnected()) {
      try {
        const query = { 
          type: 'SUBDIVISION', 
          isActive: true 
        };

        const objId = this.toObjectId(districtId);
        if (objId) {
          query.$or = [{ parentId: objId }, { districtId: objId }];
        } else {
          const parent = await Location.findOne({ 
            $or: [{ lgdCode: districtId }, { name: new RegExp(`^${districtId}$`, 'i') }] 
          }).select('_id').lean();

          if (parent) {
            query.$or = [{ parentId: parent._id }, { districtId: parent._id }];
          }
        }

        if (query.$or) {
          const subdivisions = await Location.find(query)
            .select(HIERARCHY_PROJECTION)
            .sort({ name: 1 })
            .lean();

          if (subdivisions && subdivisions.length > 0) {
            const formatted = subdivisions.map(formatDoc);
            setCached(cacheKey, formatted);
            return formatted;
          }
        }
      } catch (e) {
        // Fall back to local db
      }
    }

    let targetDistId = Number(districtId);
    if (isNaN(targetDistId)) {
      const d = (db.data.districts || []).find(d => d.name.toLowerCase() === String(districtId).toLowerCase());
      if (d) targetDistId = d.id;
    }

    const fallback = (db.data.subdivisions || [])
      .filter(s => !targetDistId || s.district_id === targetDistId)
      .map(s => ({
        id: s.id,
        _id: s._id || s.id,
        name: s.name,
        code: s.code,
        districtId: s.district_id,
        type: 'SUBDIVISION',
        headquarters: s.headquarters,
        latitude: s.center_lat,
        longitude: s.center_lng,
        state: 'West Bengal'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCached(cacheKey, fallback);
    return fallback;
  }

  // 3. Blocks under a subdivision (Cached & Projected)
  async getBlocks(subdivisionId) {
    if (!subdivisionId || subdivisionId === 'undefined' || subdivisionId === 'null') return [];
    const cacheKey = `blocks_${subdivisionId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isMongoConnected()) {
      try {
        const query = { 
          type: 'BLOCK', 
          isActive: true 
        };

        const objId = this.toObjectId(subdivisionId);
        if (objId) {
          query.$or = [{ parentId: objId }, { subdivisionId: objId }, { districtId: objId }];
        } else {
          const parent = await Location.findOne({ 
            $or: [{ lgdCode: subdivisionId }, { name: new RegExp(`^${subdivisionId}$`, 'i') }] 
          }).select('_id').lean();

          if (parent) {
            query.$or = [{ parentId: parent._id }, { subdivisionId: parent._id }, { districtId: parent._id }];
          }
        }

        if (query.$or) {
          const blocks = await Location.find(query)
            .select(HIERARCHY_PROJECTION)
            .sort({ name: 1 })
            .lean();

          if (blocks && blocks.length > 0) {
            const formatted = blocks.map(formatDoc);
            setCached(cacheKey, formatted);
            return formatted;
          }
        }
      } catch (e) {
        // Fall back to local db
      }
    }

    let subId = Number(subdivisionId);
    let distId = null;
    if (isNaN(subId)) {
      const s = (db.data.subdivisions || []).find(s => s.name.toLowerCase() === String(subdivisionId).toLowerCase());
      if (s) {
        subId = s.id;
        distId = s.district_id;
      } else {
        const d = (db.data.districts || []).find(d => d.name.toLowerCase() === String(subdivisionId).toLowerCase());
        if (d) distId = d.id;
      }
    } else {
      const d = (db.data.districts || []).find(d => d.id === subId);
      if (d) {
        distId = d.id;
        subId = null;
      }
    }

    const fallback = (db.data.blocks || [])
      .filter(b => (!subId || b.subdivision_id === subId) || (distId && b.district_id === distId))
      .map(b => ({
        id: b.id,
        _id: b._id || b.id,
        name: b.name,
        code: b.code,
        districtId: b.district_id,
        subdivisionId: b.subdivision_id,
        type: 'BLOCK',
        headquarters: b.headquarters,
        latitude: b.lat,
        longitude: b.lng,
        state: 'West Bengal'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCached(cacheKey, fallback);
    return fallback;
  }

  // 4. Gram Panchayats under a block (Cached & Projected)
  async getGramPanchayats(blockId) {
    if (!blockId || blockId === 'undefined' || blockId === 'null') return [];
    const cacheKey = `gps_${blockId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isMongoConnected()) {
      try {
        const query = { 
          type: 'GRAM_PANCHAYAT', 
          isActive: true 
        };

        const objId = this.toObjectId(blockId);
        if (objId) {
          query.$or = [{ parentId: objId }, { blockId: objId }];
        } else {
          const parent = await Location.findOne({ 
            $or: [{ lgdCode: blockId }, { name: new RegExp(`^${blockId}$`, 'i') }] 
          }).select('_id').lean();

          if (parent) {
            query.$or = [{ parentId: parent._id }, { blockId: parent._id }];
          } else {
            return [];
          }
        }

        const gps = await Location.find(query)
          .select(HIERARCHY_PROJECTION)
          .sort({ name: 1 })
          .lean();

        if (gps && gps.length > 0) {
          const formatted = gps.map(formatDoc);
          setCached(cacheKey, formatted);
          return formatted;
        }
      } catch (e) {
        // Fall back to local db
      }
    }

    let bId = Number(blockId);
    if (isNaN(bId)) {
      const b = (db.data.blocks || []).find(b => b.name.toLowerCase() === String(blockId).toLowerCase());
      if (b) bId = b.id;
    }

    const fallback = (db.data.gram_panchayats || [])
      .filter(g => !bId || g.block_id === bId)
      .map(g => ({
        id: g.id,
        _id: g._id || g.id,
        name: g.name,
        code: g.code,
        blockId: g.block_id,
        type: 'GRAM_PANCHAYAT',
        headquarters: g.headquarters,
        latitude: g.lat,
        longitude: g.lng,
        state: 'West Bengal'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCached(cacheKey, fallback);
    return fallback;
  }

  // 5. Villages under a Gram Panchayat (paginated & searchable with caching)
  async getVillages(gramPanchayatId, q = '', page = 1, limit = 50) {
    const cleanQ = (q || '').trim();
    const cacheKey = `villages_${gramPanchayatId || 'all'}_${cleanQ}_${page}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let gpId = Number(gramPanchayatId);
    if (isNaN(gpId) && gramPanchayatId) {
      const g = (db.data.gram_panchayats || []).find(g => g.name.toLowerCase() === String(gramPanchayatId).toLowerCase());
      if (g) gpId = g.id;
    }

    let list = db.data.villages_mouzas || [];
    if (gpId) {
      list = list.filter(v => v.gram_panchayat_id === gpId);
    }
    if (cleanQ) {
      const qLower = cleanQ.toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(qLower) || (v.mouza && v.mouza.toLowerCase().includes(qLower)));
    }

    const p = Math.max(1, parseInt(page) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (p - 1) * lim;
    const paginated = list.slice(skip, skip + lim);

    const result = {
      villages: paginated.map(v => ({
        id: v.id,
        _id: v._id || v.id,
        name: v.name,
        mouza: v.mouza,
        jlNo: v.jl_no,
        gramPanchayatId: v.gram_panchayat_id,
        type: 'VILLAGE',
        latitude: v.lat,
        longitude: v.lng,
        state: 'West Bengal'
      })),
      pagination: {
        total: list.length,
        page: p,
        limit: lim,
        totalPages: Math.ceil(list.length / lim)
      }
    };

    setCached(cacheKey, result);
    return result;
  }

  // 6. ULBs (Municipalities, Municipal Corporations, Notified Areas) under subdivision or district
  async getULBs(subdivisionId, districtId) {
    const cacheKey = `ulbs_${subdivisionId || 'all'}_${districtId || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let subId = Number(subdivisionId);
    let distId = Number(districtId);
    if (isNaN(distId) && districtId) {
      const d = (db.data.districts || []).find(d => d.name.toLowerCase() === String(districtId).toLowerCase());
      if (d) distId = d.id;
    }

    const fallback = (db.data.ulbs || [])
      .filter(u => (!distId || u.district_id === distId) && (!subId || u.subdivision_id === subId))
      .map(u => ({
        id: u.id,
        _id: u._id || u.id,
        name: u.name,
        code: u.code,
        type: u.type ? u.type.toUpperCase().replace(/\s+/g, '_') : 'MUNICIPALITY',
        districtId: u.district_id,
        subdivisionId: u.subdivision_id,
        totalWards: u.total_wards || 0,
        latitude: u.lat,
        longitude: u.lng,
        state: 'West Bengal'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCached(cacheKey, fallback);
    return fallback;
  }

  // 7. Wards under a ULB
  async getWards(ulbId) {
    if (!ulbId || ulbId === 'undefined' || ulbId === 'null') return [];
    const cacheKey = `wards_${ulbId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let uId = Number(ulbId);
    if (isNaN(uId)) {
      const u = (db.data.ulbs || []).find(u => u.name.toLowerCase() === String(ulbId).toLowerCase());
      if (u) uId = u.id;
    }

    const fallback = (db.data.wards || [])
      .filter(w => !uId || w.ulb_id === uId)
      .map(w => ({
        id: w.id,
        _id: w._id || w.id,
        name: w.name,
        wardNumber: w.ward_number,
        ulbId: w.ulb_id,
        parentId: w.parentId || w.ulb_id || w.ulbId,
        type: 'WARD',
        latitude: w.lat,
        longitude: w.lng,
        state: 'West Bengal'
      }))
      .sort((a, b) => (a.wardNumber || 0) - (b.wardNumber || 0));

    setCached(cacheKey, fallback);
    return fallback;
  }

  // 8. Police Stations under a district or coordinates with distance calculation
  async getPoliceStations(targetDistrict, lat, lng) {
    const parsedLat = lat ? parseFloat(lat) : null;
    const parsedLng = lng ? parseFloat(lng) : null;

    let targetDistId = null;
    let distName = targetDistrict;
    if (targetDistrict) {
      const d = (db.data.districts || []).find(d => d.name.toLowerCase() === String(targetDistrict).toLowerCase() || d.id === Number(targetDistrict));
      if (d) {
        targetDistId = d.id;
        distName = d.name;
      }
    }

    let stations = db.data.police_stations || [];
    if (distName) {
      const dClean = distName.toLowerCase().replace(/district|\(n\)|\(s\)/gi, '').trim();
      stations = stations.filter(s => {
        if (targetDistId && s.district_id === targetDistId) return true;
        const sDist = (s.districtName || s.district_name || s.address || '').toLowerCase();
        return sDist.includes(dClean) || (s.commissionerate && s.commissionerate.toLowerCase().includes(dClean));
      });
    }

    return stations.map(s => {
      const coords = locationResolutionService.getPoliceStationCoordinates(s);
      let distanceKm = null;
      let distanceMeters = null;
      if (parsedLat !== null && parsedLng !== null && coords && coords.lat && coords.lng) {
        distanceMeters = Math.round(this.haversine(parsedLat, parsedLng, coords.lat, coords.lng));
        distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));
      }
      return {
        id: s.id || s._id,
        _id: s._id || s.id,
        name: s.name,
        phone: s.phone || s.contact?.phone || '+91 33 2214 3000',
        email: s.email || s.contact?.email || 'police@wb.gov.in',
        contact: {
          phone: s.phone || s.contact?.phone || '+91 33 2214 3000',
          email: s.email || s.contact?.email || 'police@wb.gov.in'
        },
        address: s.address || `${s.name}, West Bengal`,
        policeDistrict: s.policeDistrict || s.commissionerate || 'West Bengal Police',
        commissionerate: s.commissionerate || null,
        district: distName || s.districtName || 'West Bengal',
        districtName: distName || s.districtName || 'West Bengal',
        distanceKm,
        distanceMeters,
        location: coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : null
      };
    }).sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return a.name.localeCompare(b.name);
    });
  }

  // 9. Pincodes search & validation
  async getPincodes(pincode, district) {
    if (pincode) {
      const pinRes = locationResolutionService.lookupPincode(pincode);
      if (pinRes.valid) {
        return pinRes.postOffices.map(po => ({
          pincode: pinRes.pincode,
          postOffice: po,
          district: pinRes.district,
          state: pinRes.state
        }));
      }
      return [];
    }
    return [];
  }

  // 10. Search locations
  async searchLocations(q, type, limit = 20) {
    if (!q || !q.trim()) return [];
    const term = q.trim().toLowerCase();
    const lim = Math.min(50, parseInt(limit) || 20);

    const results = [];
    const districts = db.data.districts || [];
    const subdivisions = db.data.subdivisions || [];
    const ulbs = db.data.ulbs || [];
    const blocks = db.data.blocks || [];
    const policeStations = db.data.police_stations || [];

    for (const d of districts) {
      if (d.name.toLowerCase().includes(term)) {
        results.push({ id: d.id, name: d.name, type: 'DISTRICT', state: 'West Bengal' });
      }
    }
    for (const u of ulbs) {
      if (u.name.toLowerCase().includes(term)) {
        results.push({ id: u.id, name: u.name, type: 'ULB', state: 'West Bengal' });
      }
    }
    for (const b of blocks) {
      if (b.name.toLowerCase().includes(term)) {
        results.push({ id: b.id, name: b.name, type: 'BLOCK', state: 'West Bengal' });
      }
    }
    for (const ps of policeStations) {
      if (ps.name.toLowerCase().includes(term)) {
        results.push({ id: ps.id, name: ps.name, type: 'POLICE_STATION', state: 'West Bengal' });
      }
    }

    return results.slice(0, lim);
  }

  // 11. Nearby locations
  async getNearby(lat, lng, maxMeters = 10000) {
    const stations = await this.getPoliceStations(null, lat, lng);
    return {
      policeStations: stations.slice(0, 5)
    };
  }

  // 12. Search Post Offices
  async getPostOffices(search = '', limit = 50) {
    const term = String(search || '').trim();
    if (!term) return [];

    if (/^[1-9][0-9]{5}$/.test(term)) {
      const pinRes = locationResolutionService.lookupPincode(term);
      if (pinRes.valid) {
        return pinRes.postOffices.map(po => ({
          pincode: pinRes.pincode,
          postOffice: po,
          district: pinRes.district,
          state: pinRes.state
        }));
      }
    }

    const results = [];
    const lim = Math.min(100, parseInt(limit) || 50);
    const termLower = term.toLowerCase();

    for (const [pincode, list] of locationResolutionService.postOfficeMap.entries()) {
      for (const item of list) {
        if (pincode.startsWith(term) || item.postOffice.toLowerCase().includes(termLower)) {
          results.push(item);
          if (results.length >= lim) return results;
        }
      }
    }
    return results;
  }

  // 13. Nearest Police Station with distance calculation
  async getNearestPoliceStation(lat, lng, maxMeters = 50000) {
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);
    if (isNaN(nLat) || isNaN(nLng)) {
      throw new Error('Valid latitude and longitude are required.');
    }

    const resolution = await locationResolutionService.resolveLocation({ latitude: nLat, longitude: nLng });
    const nearest = resolution.police?.nearestStation;
    if (!nearest) return null;

    return {
      ...nearest,
      formattedDistance: `${nearest.distanceKm} km away`
    };
  }

  // 14. Validate PIN code and compare with selected district (Fast O(1) Lookup + Cached)
  async validatePincode(pincode, selectedDistrict = null) {
    const pinStr = String(pincode || '').replace(/[^0-9]/g, '').trim();
    if (!/^[1-9][0-9]{5}$/.test(pinStr)) {
      return {
        valid: false,
        pincode: pinStr,
        matchesDistrict: false,
        warning: 'Invalid PIN code format. Must be a 6-digit number.'
      };
    }

    const pinRes = locationResolutionService.lookupPincode(pinStr);
    if (!pinRes.valid) {
      return {
        valid: false,
        pincode: pinStr,
        matchesDistrict: false,
        warning: 'PIN code not found in West Bengal directory.'
      };
    }

    let matchesDistrict = true;
    let warning = null;

    if (selectedDistrict && selectedDistrict.trim()) {
      const sDist = selectedDistrict.toLowerCase().replace(/[^a-z0-9]/g, '');
      const pDist = pinRes.district.toLowerCase().replace(/[^a-z0-9]/g, '');
      matchesDistrict = sDist.includes(pDist) || pDist.includes(sDist);

      if (!matchesDistrict) {
        warning = `PIN code is registered under ${pinRes.district} district, but you selected ${selectedDistrict}.`;
      }
    }

    return {
      valid: true,
      pincode: pinStr,
      matchesDistrict,
      district: pinRes.district,
      state: pinRes.state || 'West Bengal',
      postOffices: pinRes.postOffices,
      warning
    };
  }

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = new LocationService();
