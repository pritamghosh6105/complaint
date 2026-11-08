const locationService = require('../services/locationService');
const jurisdictionService = require('../services/jurisdictionService');
const geocodingService = require('../services/geocodingService');
const locationResolutionService = require('../services/locationResolutionService');

class LocationController {
  // 1. GET /api/locations/districts
  async getDistricts(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
      const districts = await locationService.getDistricts();
      res.json({ success: true, count: districts.length, districts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. GET /api/locations/subdivisions?districtId=&district=
  async getSubdivisions(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      const { districtId, district_id, district } = req.query;
      const targetId = districtId || district_id || district;
      const subdivisions = await locationService.getSubdivisions(targetId);
      res.json({ success: true, count: subdivisions.length, subdivisions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. GET /api/locations/blocks?subdivisionId=&districtId=&district=
  async getBlocks(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      const { subdivisionId, subdivision_id, districtId, district_id, district } = req.query;
      const targetId = subdivisionId || subdivision_id || districtId || district_id || district;
      const blocks = await locationService.getBlocks(targetId);
      res.json({ success: true, count: blocks.length, blocks });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 4. GET /api/locations/gram-panchayats?blockId=
  async getGramPanchayats(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      const { blockId, block_id } = req.query;
      const targetId = blockId || block_id;
      const gramPanchayats = await locationService.getGramPanchayats(targetId);
      res.json({ success: true, count: gramPanchayats.length, gramPanchayats });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 5. GET /api/locations/villages?gramPanchayatId=&q=&page=&limit=
  async getVillages(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      const { gramPanchayatId, gram_panchayat_id, q, page, limit } = req.query;
      const targetId = gramPanchayatId || gram_panchayat_id;
      const result = await locationService.getVillages(targetId, q, page, limit);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 6. GET /api/locations/ulbs?subdivisionId=&districtId=&district=
  async getULBs(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      const { subdivisionId, subdivision_id, districtId, district_id, district } = req.query;
      const subId = subdivisionId || subdivision_id;
      const distId = districtId || district_id || district;
      const ulbs = await locationService.getULBs(subId, distId);
      res.json({ success: true, count: ulbs.length, ulbs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 7. GET /api/locations/wards?ulbId=
  async getWards(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      const { ulbId, ulb_id } = req.query;
      const targetId = ulbId || ulb_id;
      const wards = await locationService.getWards(targetId);
      res.json({ success: true, count: wards.length, wards });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 8. GET /api/locations/police-stations?district=&districtId=&lat=&lng=
  async getPoliceStations(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      const { districtId, district_id, district, districtName, lat, lng } = req.query;
      const targetDistrict = district || districtName || districtId || district_id;
      const policeStations = await locationService.getPoliceStations(targetDistrict, lat, lng);
      res.json({ success: true, count: policeStations.length, policeStations });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 9. GET /api/locations/pincodes?pincode=&q=&district=
  async getPincodes(req, res) {
    try {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      const pincode = req.query.pincode || req.query.q || req.params?.code;
      const district = req.query.district;
      const postalLocations = await locationService.getPincodes(pincode, district);
      res.json({ success: true, count: postalLocations.length, postalLocations, results: postalLocations });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 10. GET /api/locations/search?q=&type=
  async searchLocations(req, res) {
    try {
      const { q, type, limit } = req.query;
      const locations = await locationService.searchLocations(q, type, limit);
      res.json({ success: true, count: locations.length, locations });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 11. GET /api/locations/nearby?lat=&lng=&maxDistance=
  async getNearby(req, res) {
    try {
      const { lat, lng, maxDistance } = req.query;
      const nearby = await locationService.getNearby(lat, lng, maxDistance);
      res.json({ success: true, nearby });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 12. GET /api/locations/reverse?lat=&lng=
  async reverseGeocode(req, res) {
    try {
      const { lat, lng } = req.query;
      const geocoded = await geocodingService.reverseGeocode(lat, lng);
      res.json({ success: true, geocoded });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 13. GET & POST /api/locations/resolve?lat=&lng=
  async resolveCoordinates(req, res) {
    try {
      const lat = req.query.lat || req.query.latitude || req.body?.lat || req.body?.latitude;
      const lng = req.query.lng || req.query.longitude || req.body?.lng || req.body?.longitude;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, error: 'Both lat and lng parameters are required.' });
      }
      const resolution = await locationResolutionService.resolveLocation({ latitude: lat, longitude: lng });
      res.json({
        success: true,
        resolution,
        ...resolution,
        district: resolution.administrative.district ? { name: resolution.administrative.district } : null,
        urbanOrRural: resolution.administrative.urbanRural,
        policeStation: resolution.police.nearestStation?.name || null
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 14. GET /api/locations/post-offices?pincode=&search=&limit=
  async getPostOffices(req, res) {
    try {
      const { search, q, limit, pincode } = req.query;
      const term = pincode || search || q || '';
      const postOffices = await locationService.getPostOffices(term, limit);
      res.json({ success: true, count: postOffices.length, postOffices });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 15. GET /api/locations/nearest-police-station?lat=&lng=&maxDistance=
  async getNearestPoliceStation(req, res) {
    try {
      const lat = req.query.lat || req.query.latitude || req.body?.lat || req.body?.latitude;
      const lng = req.query.lng || req.query.longitude || req.body?.lng || req.body?.longitude;
      if (!lat || !lng) {
        return res.status(400).json({ success: false, error: 'Both lat and lng parameters are required.' });
      }
      const resolution = await locationResolutionService.resolveLocation({ latitude: lat, longitude: lng });
      res.json({
        success: true,
        station: resolution.police.nearestStation,
        nearestStation: resolution.police.nearestStation,
        nearestStationDistance: resolution.police.nearestStationDistance,
        jurisdictionStation: null,
        jurisdictionVerified: false
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 16. GET & POST /api/locations/validate-pincode
  async validatePincode(req, res) {
    try {
      const pincode = req.query.pincode || req.body?.pincode;
      const district = req.query.district || req.body?.district;
      if (!pincode) {
        return res.status(400).json({ success: false, error: 'Pincode is required.' });
      }
      const result = await locationService.validatePincode(pincode, district);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 17. POST & GET /api/locations/geocode (Forward Geocoding with Administrative Resolution)
  async geocodeAddress(req, res) {
    try {
      const address = req.body?.address || req.query.address || req.query.q;
      if (!address || !address.trim()) {
        return res.status(400).json({ success: false, error: 'Address is required for geocoding.' });
      }
      const geocoded = await geocodingService.forwardGeocode(address, { skipThrottle: true });
      const resolution = await locationResolutionService.resolveLocation({ latitude: geocoded.latitude, longitude: geocoded.longitude });
      res.json({
        success: true,
        ...geocoded,
        resolution,
        ...resolution
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 18. GET /api/locations/administrative-info
  async getAdministrativeInfo(req, res) {
    try {
      const params = { ...req.query, ...req.body };
      const targetLat = params.lat || params.latitude;
      const targetLng = params.lng || params.longitude;

      if (targetLat && targetLng) {
        const resolution = await locationResolutionService.resolveLocation({ latitude: targetLat, longitude: targetLng });
        return res.json({ success: true, resolution, ...resolution });
      }

      const jurisdiction = await jurisdictionService.determineJurisdiction(params);
      return res.json({ success: true, jurisdiction });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // 19. GET /api/locations/jurisdiction
  async getJurisdiction(req, res) {
    try {
      const lat = req.query.lat || req.query.latitude;
      const lng = req.query.lng || req.query.longitude;
      if (lat && lng) {
        const resolution = await locationResolutionService.resolveLocation({ latitude: lat, longitude: lng });
        return res.json({
          success: true,
          nearestPoliceStation: resolution.police.nearestStation,
          nearestStationDistance: resolution.police.nearestStationDistance,
          jurisdictionalPoliceStation: resolution.police.jurisdictionStation,
          jurisdictionVerified: resolution.police.jurisdictionVerified,
          jurisdictionNote: 'Administrative police boundary data is unavailable for this location.'
        });
      }
      res.json({
        success: true,
        nearestPoliceStation: null,
        jurisdictionalPoliceStation: null,
        jurisdictionVerified: false,
        jurisdictionNote: 'Administrative police boundary data is unavailable for this location.'
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 20. GET & POST /api/locations/validate (Full administrative hierarchy validation)
  async validateLocationHierarchy(req, res) {
    try {
      const params = { ...req.query, ...req.body };
      const validation = locationResolutionService.validateHierarchy(params);
      res.json({
        success: validation.valid,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new LocationController();
