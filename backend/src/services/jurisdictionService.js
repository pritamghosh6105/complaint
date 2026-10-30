const mongoose = require('mongoose');
const { Location } = require('../models/mongo/Location');
const LocationBoundary = require('../models/mongo/LocationBoundary');
const PoliceStation = require('../models/mongo/PoliceStation');
const PostalLocation = require('../models/mongo/PostalLocation');
const geocodingService = require('./geocodingService');

const locationResolutionService = require('./locationResolutionService');

class JurisdictionService {
  /**
   * Complete GPS resolution using locationResolutionService pipeline
   */
  async resolveCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid GPS coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
    }

    const res = await locationResolutionService.resolveLocation({ latitude: lat, longitude: lng });

    return {
      ...res,
      district: res.administrative.district ? { id: null, name: res.administrative.district } : null,
      subdivision: res.administrative.subdivision ? { id: null, name: res.administrative.subdivision } : null,
      municipality: res.administrative.ulb ? { id: null, name: res.administrative.ulb } : null,
      corporation: null,
      ward: res.administrative.ward ? { id: null, name: res.administrative.ward } : null,
      block: res.administrative.block ? { id: null, name: res.administrative.block } : null,
      gramPanchayat: res.administrative.gramPanchayat ? { id: null, name: res.administrative.gramPanchayat } : null,
      village: res.administrative.village ? { id: null, name: res.administrative.village } : null,
      urbanOrRural: res.administrative.urbanRural,
      policeStation: res.police.nearestStation?.name || null,
      policeStationDetails: res.police.nearestStation,
      nearestPoliceStation: res.police.nearestStation,
      jurisdictionPoliceStation: res.police.jurisdictionStation,
      jurisdictionVerified: res.police.jurisdictionVerified,
      pincode: res.postal.pincode,
      postOffice: res.postal.postOffice,
      locality: res.address.locality,
      street: res.address.street,
      landmark: res.address.landmark,
      formattedAddress: res.address.displayName,
      accuracy: res.status,
      confidence: res.confidence,
      sources: res.sources,
      missingDatasets: res.missingDatasets
    };
  }

  /**
   * Complete Address Resolution: Address -> Forward Geocode -> Jurisdiction & Boundary Match
   */
  async resolveAddress(address) {
    if (!address || !address.trim()) {
      throw new Error('Address string is required.');
    }

    const geocoded = await geocodingService.forwardGeocode(address);
    const resolved = await this.resolveCoordinates(geocoded.latitude, geocoded.longitude);

    return {
      ...resolved,
      userEnteredAddress: address,
      geocodedAddress: geocoded.formattedAddress,
      geocodingConfidence: geocoded.confidence,
      geocodingProvider: geocoded.provider
    };
  }

  /**
   * Determine the most appropriate administrative jurisdiction based on 5-tier priority cascade:
   *  Priority 1: GPS + official boundary data ($geoIntersects)
   *  Priority 2: Selected administrative hierarchy (Urban / Rural)
   *  Priority 3: PIN/post-office mapping
   *  Priority 4: Police station mapping
   *  Priority 5: Manual address
   */
  async determineJurisdiction(params = {}) {
    const {
      latitude,
      longitude,
      district,
      subdivision,
      ulb,
      ward,
      block,
      gramPanchayat,
      village,
      policeStation,
      pincode,
      address
    } = params;

    let resolved = {
      district: null,
      subdivision: null,
      urban_rural: 'Other',
      ulb: null,
      ward: null,
      block: null,
      gram_panchayat: null,
      village: null,
      police_station: null,
      pincode: null,
      confidence: 0.5,
      source: 'Default'
    };

    // Priority 1: GPS + Official Boundary Matching
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= 20 && lat <= 28 && lng >= 85 && lng <= 91) {
      try {
        const geoRes = await this.resolveCoordinates(lat, lng);
        if (geoRes && geoRes.district) {
          resolved = {
            district: geoRes.district?.name || null,
            subdivision: geoRes.subdivision?.name || null,
            urban_rural: geoRes.urbanOrRural || 'Other',
            ulb: geoRes.municipality?.name || geoRes.corporation?.name || null,
            ward: geoRes.ward?.name || null,
            block: geoRes.block?.name || null,
            gram_panchayat: geoRes.gramPanchayat?.name || null,
            village: null,
            police_station: geoRes.policeStation?.name || null,
            pincode: geoRes.pincode || null,
            confidence: geoRes.accuracy?.startsWith('HIGH') ? 0.98 : 0.85,
            source: 'GPS + Official Boundary Data'
          };
          return resolved;
        }
      } catch (err) {
        console.warn('GPS boundary resolution notice:', err.message);
      }
    }

    // Priority 2: Selected Administrative Hierarchy
    if (district) {
      const isUrban = Boolean(ulb || ward);
      const isRural = Boolean(block || gramPanchayat || village);
      resolved = {
        district: String(district).trim(),
        subdivision: subdivision ? String(subdivision).trim() : null,
        urban_rural: isUrban ? 'Urban' : (isRural ? 'Rural' : 'Other'),
        ulb: ulb ? String(ulb).trim() : null,
        ward: ward ? String(ward).trim() : null,
        block: block ? String(block).trim() : null,
        gram_panchayat: gramPanchayat ? String(gramPanchayat).trim() : null,
        village: village ? String(village).trim() : null,
        police_station: policeStation ? String(policeStation).trim() : null,
        pincode: pincode ? String(pincode).trim() : null,
        confidence: 0.90,
        source: 'Selected Administrative Hierarchy'
      };
      return resolved;
    }

    // Priority 3: PIN / Post-Office Mapping
    if (pincode && /^[1-9][0-9]{5}$/.test(String(pincode).trim())) {
      const pinDoc = await PostalLocation.findOne({ pincode: String(pincode).trim() }).lean();
      if (pinDoc) {
        resolved = {
          district: pinDoc.district,
          subdivision: null,
          urban_rural: 'Other',
          ulb: null,
          ward: null,
          block: null,
          gram_panchayat: null,
          village: null,
          police_station: null,
          pincode: pinDoc.pincode,
          confidence: 0.75,
          source: 'India Post PIN Directory'
        };
        return resolved;
      }
    }

    // Priority 4: Police Station Mapping
    if (policeStation) {
      const psDoc = await PoliceStation.findOne({ name: new RegExp(String(policeStation).trim(), 'i') }).populate('districtId').lean();
      if (psDoc) {
        resolved = {
          district: psDoc.districtId?.name || psDoc.policeDistrict || null,
          subdivision: psDoc.subdivision || null,
          urban_rural: psDoc.commissionerate ? 'Urban' : 'Other',
          ulb: null,
          ward: null,
          block: null,
          gram_panchayat: null,
          village: null,
          police_station: psDoc.name,
          pincode: null,
          confidence: 0.70,
          source: 'Police Station Mapping'
        };
        return resolved;
      }
    }

    // Priority 5: Manual Address Fallback
    resolved.district = 'West Bengal';
    resolved.source = 'Manual Address';
    resolved.confidence = 0.50;
    return resolved;
  }

  /**
   * Route complaint category to appropriate municipal department or police unit
   */
  routeDepartment(category, jurisdiction) {
    const catLower = String(category || '').toLowerCase();
    
    // Police complaints always route to Law Enforcement / Police Station
    if (catLower.includes('theft') || catLower.includes('crime') || catLower.includes('assault') || catLower.includes('harassment') || catLower.includes('police')) {
      return {
        departmentCode: 'POLICE',
        departmentName: 'Police & Law Enforcement',
        authorityType: 'Police Station Jurisdiction',
        assignedUnit: jurisdiction.policeStation ? jurisdiction.policeStation.name : 'Local Police Station'
      };
    }

    if (catLower.includes('road') || catLower.includes('pothole') || catLower.includes('divider') || catLower.includes('footpath')) {
      return {
        departmentCode: 'PWD',
        departmentName: 'Public Works Department',
        authorityType: jurisdiction.urbanOrRural === 'Urban' ? 'Municipality Engineering Cell' : 'Zilla Parishad / Block Dev Officer',
        jurisdiction: jurisdiction.municipality?.name || jurisdiction.block?.name || 'District PWD'
      };
    }

    if (catLower.includes('drain') || catLower.includes('waterlogging') || catLower.includes('sewer') || catLower.includes('manhole')) {
      return {
        departmentCode: 'DSB',
        departmentName: 'Drainage & Sewerage Board',
        authorityType: 'Urban Drainage Section',
        jurisdiction: jurisdiction.municipality?.name || 'Municipal Drainage Division'
      };
    }

    if (catLower.includes('garbage') || catLower.includes('waste') || catLower.includes('dump') || catLower.includes('cleaning')) {
      return {
        departmentCode: 'SWM',
        departmentName: 'Solid Waste Management',
        authorityType: 'Conservancy Wing',
        jurisdiction: jurisdiction.ward?.name || jurisdiction.gramPanchayat?.name || 'Sanitation Cell'
      };
    }

    if (catLower.includes('light') || catLower.includes('pole') || catLower.includes('darkness') || catLower.includes('electricity')) {
      return {
        departmentCode: 'ELD',
        departmentName: 'Electrical & Lighting Department',
        authorityType: 'Public Lighting Wing',
        jurisdiction: jurisdiction.municipality?.name || 'Electrical Division'
      };
    }

    if (catLower.includes('water') || catLower.includes('tap') || catLower.includes('pipeline') || catLower.includes('tanker')) {
      return {
        departmentCode: 'WSD',
        departmentName: 'Water Supply Department',
        authorityType: 'Water Works Maintenance',
        jurisdiction: jurisdiction.municipality?.name || 'PHE Division'
      };
    }

    return {
      departmentCode: 'GEN',
      departmentName: 'Municipal General Administration',
      authorityType: 'Grievance Redressal Cell',
      jurisdiction: jurisdiction.district?.name || 'West Bengal'
    };
  }

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
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

module.exports = new JurisdictionService();
