const db = require('../models/db');

// Haversine distance in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class LocationController {
  // 1. Get all districts
  getDistricts(req, res) {
    try {
      const districts = (db.data.districts || []).filter(d => d.is_active !== 0);
      res.json({ districts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch districts' });
    }
  }

  // 2. Get subdivisions for a district
  getSubdivisions(req, res) {
    try {
      const { district_id } = req.query;
      let subdivisions = (db.data.subdivisions || []).filter(s => s.is_active !== 0);
      if (district_id) {
        subdivisions = subdivisions.filter(s => s.district_id === Number(district_id));
      }
      res.json({ subdivisions });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch subdivisions' });
    }
  }

  // 3. Get ULBs (Municipalities / Corporations)
  getULBs(req, res) {
    try {
      const { district_id, subdivision_id, type } = req.query;
      let ulbs = (db.data.ulbs || []).filter(u => u.is_active !== 0);
      if (district_id) {
        ulbs = ulbs.filter(u => u.district_id === Number(district_id));
      }
      if (subdivision_id) {
        ulbs = ulbs.filter(u => u.subdivision_id === Number(subdivision_id));
      }
      if (type) {
        ulbs = ulbs.filter(u => u.type === type);
      }
      res.json({ ulbs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch Urban Local Bodies' });
    }
  }

  // 4. Get Wards for a ULB
  getWards(req, res) {
    try {
      const { ulb_id } = req.query;
      let wards = (db.data.wards || []).filter(w => w.is_active !== 0);
      if (ulb_id) {
        wards = wards.filter(w => w.ulb_id === Number(ulb_id));
      }
      res.json({ wards });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch wards' });
    }
  }

  // 5. Get CD Blocks for a district/subdivision
  getBlocks(req, res) {
    try {
      const { district_id, subdivision_id } = req.query;
      let blocks = (db.data.blocks || []).filter(b => b.is_active !== 0);
      if (district_id) {
        blocks = blocks.filter(b => b.district_id === Number(district_id));
      }
      if (subdivision_id) {
        blocks = blocks.filter(b => b.subdivision_id === Number(subdivision_id));
      }
      res.json({ blocks });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch blocks' });
    }
  }

  // 6. Get Gram Panchayats for a block
  getGramPanchayats(req, res) {
    try {
      const { block_id } = req.query;
      let gps = (db.data.gram_panchayats || []).filter(g => g.is_active !== 0);
      if (block_id) {
        gps = gps.filter(g => g.block_id === Number(block_id));
      }
      res.json({ gram_panchayats: gps });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch Gram Panchayats' });
    }
  }

  // 7. Get Villages / Mouzas for a Gram Panchayat
  getVillages(req, res) {
    try {
      const { gram_panchayat_id } = req.query;
      let villages = (db.data.villages_mouzas || []).filter(v => v.is_active !== 0);
      if (gram_panchayat_id) {
        villages = villages.filter(v => v.gram_panchayat_id === Number(gram_panchayat_id));
      }
      res.json({ villages });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch villages' });
    }
  }

  // 8. Get Police Stations
  getPoliceStations(req, res) {
    try {
      const { district_id, subdivision_id } = req.query;
      let psList = (db.data.police_stations || []).filter(p => p.is_active !== 0);
      if (district_id) {
        psList = psList.filter(p => p.district_id === Number(district_id));
      }
      if (subdivision_id) {
        psList = psList.filter(p => p.subdivision_id === Number(subdivision_id));
      }
      res.json({ police_stations: psList });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch police stations' });
    }
  }

  // 9. Lookup Pincode
  lookupPincode(req, res) {
    try {
      const code = String(req.params.code || '').trim();
      if (code.length < 6) {
        return res.status(400).json({ error: 'Valid 6-digit PIN code required' });
      }

      const match = (db.data.postcodes || []).find(p => String(p.pincode) === code);
      if (!match) {
        return res.status(404).json({ message: 'PIN code not found in current directory' });
      }

      const district = (db.data.districts || []).find(d => d.id === match.district_id);
      const subdivision = (db.data.subdivisions || []).find(s => s.id === match.subdivision_id);

      res.json({
        pincode: match.pincode,
        district_id: match.district_id,
        district_name: district ? district.name : '',
        subdivision_id: match.subdivision_id,
        subdivision_name: subdivision ? subdivision.name : '',
        post_office: match.post_office,
        locality: match.locality,
        latitude: match.lat,
        longitude: match.lng
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to lookup PIN code' });
    }
  }

  // 10. Unified Global Search across Location Entities
  searchLocations(req, res) {
    try {
      const q = String(req.query.q || '').trim().toLowerCase();
      if (!q || q.length < 2) {
        return res.json({ results: [] });
      }

      const results = [];

      // Districts
      (db.data.districts || []).forEach(d => {
        if (d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)) {
          results.push({
            type: 'District',
            id: d.id,
            name: d.name,
            secondary: `${d.division} Division, WB`,
            district_id: d.id,
            district_name: d.name,
            lat: d.center_lat,
            lng: d.center_lng
          });
        }
      });

      // ULBs
      (db.data.ulbs || []).forEach(u => {
        if (u.name.toLowerCase().includes(q) || (u.code && u.code.toLowerCase().includes(q))) {
          const dist = (db.data.districts || []).find(d => d.id === u.district_id);
          results.push({
            type: u.type,
            id: u.id,
            name: u.name,
            secondary: `${dist ? dist.name : ''} District • ${u.total_wards} Wards`,
            district_id: u.district_id,
            district_name: dist ? dist.name : '',
            subdivision_id: u.subdivision_id,
            ulb_id: u.id,
            ulb_name: u.name,
            administrative_type: 'Urban',
            lat: u.lat,
            lng: u.lng
          });
        }
      });

      // CD Blocks
      (db.data.blocks || []).forEach(b => {
        if (b.name.toLowerCase().includes(q)) {
          const dist = (db.data.districts || []).find(d => d.id === b.district_id);
          results.push({
            type: 'CD Block',
            id: b.id,
            name: b.name,
            secondary: `${dist ? dist.name : ''} District (Rural)`,
            district_id: b.district_id,
            district_name: dist ? dist.name : '',
            subdivision_id: b.subdivision_id,
            block_id: b.id,
            block_name: b.name,
            administrative_type: 'Rural',
            lat: b.lat,
            lng: b.lng
          });
        }
      });

      // Gram Panchayats
      (db.data.gram_panchayats || []).forEach(g => {
        if (g.name.toLowerCase().includes(q)) {
          const blk = (db.data.blocks || []).find(b => b.id === g.block_id);
          const dist = blk ? (db.data.districts || []).find(d => d.id === blk.district_id) : null;
          results.push({
            type: 'Gram Panchayat',
            id: g.id,
            name: g.name,
            secondary: `${blk ? blk.name : ''}, ${dist ? dist.name : ''}`,
            district_id: dist ? dist.id : null,
            district_name: dist ? dist.name : '',
            block_id: g.block_id,
            block_name: blk ? blk.name : '',
            gram_panchayat_id: g.id,
            gram_panchayat_name: g.name,
            administrative_type: 'Rural',
            lat: g.lat,
            lng: g.lng
          });
        }
      });

      // Police Stations
      (db.data.police_stations || []).forEach(p => {
        if (p.name.toLowerCase().includes(q)) {
          const dist = (db.data.districts || []).find(d => d.id === p.district_id);
          results.push({
            type: 'Police Station',
            id: p.id,
            name: p.name,
            secondary: `${p.commissionerate || 'District Police'} • ${dist ? dist.name : ''}`,
            district_id: p.district_id,
            district_name: dist ? dist.name : '',
            subdivision_id: p.subdivision_id,
            police_station_id: p.id,
            police_station_name: p.name
          });
        }
      });

      // Postcodes
      (db.data.postcodes || []).forEach(p => {
        if (p.pincode.includes(q) || (p.locality && p.locality.toLowerCase().includes(q))) {
          const dist = (db.data.districts || []).find(d => d.id === p.district_id);
          results.push({
            type: 'PIN Code',
            id: p.pincode,
            name: `${p.pincode} — ${p.post_office}`,
            secondary: `${p.locality}, ${dist ? dist.name : ''}`,
            district_id: p.district_id,
            district_name: dist ? dist.name : '',
            subdivision_id: p.subdivision_id,
            postal_code: p.pincode,
            lat: p.lat,
            lng: p.lng
          });
        }
      });

      res.json({ results: results.slice(0, 20) });
    } catch (err) {
      res.status(500).json({ error: 'Location search failed' });
    }
  }

  // 11. Reverse Geocode Coordinates to Nearest West Bengal Hierarchy
  reverseGeocode(req, res) {
    try {
      const lat = Number(req.body.latitude || req.query.lat);
      const lng = Number(req.body.longitude || req.query.lng);

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and Longitude required' });
      }

      // 1. Find closest district centroid
      let bestDistrict = null;
      let minDistrictDist = Infinity;
      for (const d of (db.data.districts || [])) {
        if (d.center_lat && d.center_lng) {
          const dist = haversineDistance(lat, lng, d.center_lat, d.center_lng);
          if (dist < minDistrictDist) {
            minDistrictDist = dist;
            bestDistrict = d;
          }
        }
      }

      const districtId = bestDistrict ? bestDistrict.id : 2; // Default to North 24 Parganas

      // 2. Check closest ULB within district (or nearby)
      let closestULB = null;
      let minULBDist = Infinity;
      for (const u of (db.data.ulbs || [])) {
        if (u.lat && u.lng) {
          const dist = haversineDistance(lat, lng, u.lat, u.lng);
          if (dist < minULBDist) {
            minULBDist = dist;
            closestULB = u;
          }
        }
      }

      // 3. Check closest Block
      let closestBlock = null;
      let minBlockDist = Infinity;
      for (const b of (db.data.blocks || [])) {
        if (b.lat && b.lng) {
          const dist = haversineDistance(lat, lng, b.lat, b.lng);
          if (dist < minBlockDist) {
            minBlockDist = dist;
            closestBlock = b;
          }
        }
      }

      // 4. Decide whether Urban or Rural based on distance threshold
      let adminType = 'Urban';
      let subdivisionId = null;
      let ulbId = null;
      let ulbName = '';
      let blockId = null;
      let blockName = '';
      let gpId = null;
      let gpName = '';
      let villageId = null;
      let villageName = '';

      if (minULBDist <= 8000 && closestULB) {
        adminType = 'Urban';
        ulbId = closestULB.id;
        ulbName = closestULB.name;
        subdivisionId = closestULB.subdivision_id;
      } else if (closestBlock) {
        adminType = 'Rural';
        blockId = closestBlock.id;
        blockName = closestBlock.name;
        subdivisionId = closestBlock.subdivision_id;

        // Find nearest GP in block
        const blockGPs = (db.data.gram_panchayats || []).filter(g => g.block_id === blockId);
        if (blockGPs.length > 0) {
          let bestGP = blockGPs[0];
          let minGPDist = Infinity;
          for (const g of blockGPs) {
            if (g.lat && g.lng) {
              const d = haversineDistance(lat, lng, g.lat, g.lng);
              if (d < minGPDist) {
                minGPDist = d;
                bestGP = g;
              }
            }
          }
          gpId = bestGP.id;
          gpName = bestGP.name;

          // Find village in that GP
          const gpVillages = (db.data.villages_mouzas || []).filter(v => v.gram_panchayat_id === gpId);
          if (gpVillages.length > 0) {
            villageId = gpVillages[0].id;
            villageName = gpVillages[0].name;
          }
        }
      }

      // 5. Find closest Police Station
      let closestPS = null;
      const subPS = (db.data.police_stations || []).filter(p => subdivisionId && p.subdivision_id === subdivisionId);
      if (subPS.length > 0) {
        // If blockName contains 'Amdanga', find Amdanga PS
        if (blockName && blockName.includes('Amdanga')) {
          closestPS = subPS.find(p => p.name.includes('Amdanga')) || subPS[0];
        } else if (ulbName && ulbName.includes('Barasat')) {
          closestPS = subPS.find(p => p.name.includes('Barasat')) || subPS[0];
        } else {
          closestPS = subPS[0];
        }
      } else {
        const distPS = (db.data.police_stations || []).filter(p => p.district_id === districtId);
        closestPS = distPS[0] || (db.data.police_stations || [])[0] || null;
      }

      // Subdivision lookup
      const subdivision = (db.data.subdivisions || []).find(s => s.id === subdivisionId);

      res.json({
        state: 'West Bengal',
        latitude: lat,
        longitude: lng,
        district_id: districtId,
        district: bestDistrict ? bestDistrict.name : 'North 24 Parganas',
        subdivision_id: subdivisionId,
        subdivision: subdivision ? subdivision.name : '',
        administrative_type: adminType,
        ulb_id: ulbId,
        municipality: ulbName,
        ward: adminType === 'Urban' ? 'Ward 1' : '',
        block_id: blockId,
        block: blockName,
        gram_panchayat_id: gpId,
        gram_panchayat: gpName,
        village_id: villageId,
        village: villageName,
        police_station_id: closestPS ? closestPS.id : null,
        police_station: closestPS ? closestPS.name : '',
        detected_location_label: `${villageName || ulbName || blockName || (bestDistrict ? bestDistrict.name : '')}, ${bestDistrict ? bestDistrict.name : 'WB'}`
      });
    } catch (err) {
      res.status(500).json({ error: 'Reverse geocode failed' });
    }
  }

  // 12. Super Admin: Add new location entity
  addLocation(req, res) {
    try {
      const { entity_type, data } = req.body;
      if (!entity_type || !data || !data.name) {
        return res.status(400).json({ error: 'Entity type and valid name required' });
      }

      const tableMap = {
        district: 'districts',
        subdivision: 'subdivisions',
        ulb: 'ulbs',
        ward: 'wards',
        block: 'blocks',
        gram_panchayat: 'gram_panchayats',
        village: 'villages_mouzas',
        police_station: 'police_stations'
      };

      const tableName = tableMap[entity_type];
      if (!tableName || !db.data[tableName]) {
        return res.status(400).json({ error: `Invalid entity type: ${entity_type}` });
      }

      const newId = (db.data._counters[tableName] || 100) + 1;
      db.data._counters[tableName] = newId;

      const record = {
        ...data,
        id: newId,
        is_active: 1
      };

      db.data[tableName].push(record);
      db.save();

      res.status(201).json({
        message: `${entity_type} added successfully`,
        entity: record
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add location entity' });
    }
  }

  // 13. Super Admin: Edit location entity
  editLocation(req, res) {
    try {
      const { entity_type, id } = req.params;
      const updates = req.body;

      const tableMap = {
        district: 'districts',
        subdivision: 'subdivisions',
        ulb: 'ulbs',
        ward: 'wards',
        block: 'blocks',
        gram_panchayat: 'gram_panchayats',
        village: 'villages_mouzas',
        police_station: 'police_stations'
      };

      const tableName = tableMap[entity_type];
      if (!tableName || !db.data[tableName]) {
        return res.status(400).json({ error: `Invalid entity type: ${entity_type}` });
      }

      const item = db.data[tableName].find(x => x.id === Number(id));
      if (!item) {
        return res.status(404).json({ error: 'Location entity not found' });
      }

      Object.assign(item, updates);
      db.save();

      res.json({ message: `${entity_type} updated successfully`, entity: item });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update location entity' });
    }
  }

  // 14. Super Admin: Deactivate location entity (Soft delete)
  deactivateLocation(req, res) {
    try {
      const { entity_type, id } = req.params;

      const tableMap = {
        district: 'districts',
        subdivision: 'subdivisions',
        ulb: 'ulbs',
        ward: 'wards',
        block: 'blocks',
        gram_panchayat: 'gram_panchayats',
        village: 'villages_mouzas',
        police_station: 'police_stations'
      };

      const tableName = tableMap[entity_type];
      if (!tableName || !db.data[tableName]) {
        return res.status(400).json({ error: `Invalid entity type: ${entity_type}` });
      }

      const item = db.data[tableName].find(x => x.id === Number(id));
      if (!item) {
        return res.status(404).json({ error: 'Location entity not found' });
      }

      item.is_active = item.is_active === 0 ? 1 : 0;
      db.save();

      res.json({
        message: `${entity_type} ${item.is_active === 1 ? 'activated' : 'deactivated'} successfully`,
        entity: item
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle location entity status' });
    }
  }

  // 15. Super Admin: List entities of a given type with search & pagination
  getAdminEntities(req, res) {
    try {
      const { type = 'district', search = '', page = 1, limit = 50 } = req.query;
      const tableMap = {
        district: 'districts',
        subdivision: 'subdivisions',
        ulb: 'ulbs',
        ward: 'wards',
        block: 'blocks',
        gram_panchayat: 'gram_panchayats',
        village: 'villages_mouzas',
        police_station: 'police_stations',
        postcode: 'postcodes'
      };

      const tableName = tableMap[type] || 'districts';
      let items = db.data[tableName] || [];
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(it => 
          (it.name && it.name.toLowerCase().includes(q)) ||
          (it.pincode && it.pincode.includes(q)) ||
          (it.category && it.category.toLowerCase().includes(q)) ||
          (it.type && it.type.toLowerCase().includes(q)) ||
          (it.headquarters && it.headquarters.toLowerCase().includes(q)) ||
          (it.division && it.division.toLowerCase().includes(q))
        );
      }

      const total = items.length;
      const offset = (Number(page) - 1) * Number(limit);
      const paginated = items.slice(offset, offset + Number(limit));

      res.json({
        type,
        total,
        page: Number(page),
        limit: Number(limit),
        items: paginated
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch location entities' });
    }
  }
}

module.exports = new LocationController();
