const axios = require('axios');

// In-memory caches for geocoding
const reverseCache = new Map();
const forwardCache = new Map();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100; // Nominatim policy: max 1 req / second

// West Bengal Geographic Bounding Box: Lat 21.0 to 27.5, Lng 85.5 to 90.0
const WB_BOUNDS = {
  minLat: 21.0,
  maxLat: 27.5,
  minLng: 85.5,
  maxLng: 90.0
};

class GeocodingService {
  constructor(options = {}) {
    this.provider = options.provider || process.env.GEOCODING_PROVIDER || 'nominatim';
    this.apiKey = options.apiKey || process.env.GEOCODING_API_KEY || '';
    this.userAgent = options.userAgent || process.env.GEOCODING_USER_AGENT || 'CivicPulse-AI-Citizen-System/1.0 (contact: admin@civicpulse.gov.in)';
  }

  getReverseCacheKey(lat, lng) {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  getForwardCacheKey(address) {
    return String(address || '').trim().toLowerCase();
  }

  async throttle() {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      const waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
  }

  /**
   * Spatial validation for coordinates
   */
  validateCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return { valid: false, error: 'Latitude and longitude must be valid numbers.' };
    }
    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90 degrees.' };
    }
    if (lng < -180 || lng > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180 degrees.' };
    }

    const isWestBengal = lat >= WB_BOUNDS.minLat && lat <= WB_BOUNDS.maxLat &&
                         lng >= WB_BOUNDS.minLng && lng <= WB_BOUNDS.maxLng;

    return {
      valid: true,
      lat,
      lng,
      isWestBengal,
      warning: !isWestBengal ? 'Coordinates appear to be outside West Bengal geographic boundaries.' : null
    };
  }

  /**
   * Universal Forward Geocoding: Address -> Coordinates + Address details
   * @param {string} address
   * @param {object} options
   * @returns {Promise<{ latitude: number, longitude: number, formattedAddress: string, pincode: string, district: string, state: string, isWestBengal: boolean, results: Array }>}
   */
  async forwardGeocode(address, options = {}) {
    if (!address || typeof address !== 'string' || !address.trim()) {
      throw new Error('Valid address string is required for geocoding.');
    }

    const cleanAddress = address.trim();
    const cacheKey = this.getForwardCacheKey(cleanAddress);
    if (forwardCache.has(cacheKey)) {
      return forwardCache.get(cacheKey);
    }

    try {
      if (this.provider === 'nominatim') {
        const result = await this.forwardGeocodeNominatim(cleanAddress, options);
        if (result && result.latitude && result.longitude) {
          forwardCache.set(cacheKey, result);
          return result;
        }
      }

      // Fallback: try local authoritative datasets (PostalLocation & Location)
      const fallbackResult = await this.fallbackForwardGeocode(cleanAddress);
      if (fallbackResult) {
        forwardCache.set(cacheKey, fallbackResult);
        return fallbackResult;
      }

      throw new Error(`No geographic coordinates found for address: "${cleanAddress}". Try including PIN code or District.`);
    } catch (err) {
      // Try local dataset fallback on API/network failure
      const fallbackResult = await this.fallbackForwardGeocode(cleanAddress);
      if (fallbackResult) {
        return fallbackResult;
      }
      throw err;
    }
  }

  async forwardGeocodeNominatim(address, options = {}) {
    await this.throttle();

    const url = 'https://nominatim.openstreetmap.org/search';
    // Append West Bengal, India if not already present to boost local relevance
    let queryAddress = address;
    const lower = address.toLowerCase();
    if (!lower.includes('west bengal') && !lower.includes('india')) {
      queryAddress = `${address}, West Bengal, India`;
    }

    const response = await axios.get(url, {
      params: {
        q: queryAddress,
        format: 'json',
        addressdetails: 1,
        limit: 5,
        countrycodes: 'in',
        viewbox: '85.5,27.5,90.0,21.0', // West Bengal viewbox
        bounded: 0
      },
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Language': 'en'
      },
      timeout: 7000
    });

    const data = response.data;
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Find best match (prefer West Bengal if multiple)
    const wbMatch = data.find(item => {
      const state = item.address?.state || '';
      return state.toLowerCase().includes('west bengal');
    }) || data[0];

    const lat = parseFloat(wbMatch.lat);
    const lng = parseFloat(wbMatch.lon);
    const addr = wbMatch.address || {};

    const street = addr.road || addr.street || addr.pedestrian || addr.footway || '';
    const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.town || addr.village || addr.hamlet || '';
    const landmark = addr.landmark || addr.amenity || addr.shop || addr.building || '';
    const pincode = addr.postcode || '';
    const district = addr.state_district || addr.county || addr.city || '';
    const state = addr.state || 'West Bengal';

    const validation = this.validateCoordinates(lat, lng);

    const result = {
      latitude: lat,
      longitude: lng,
      coordinates: [lng, lat], // GeoJSON order
      formattedAddress: wbMatch.display_name || address,
      userEnteredAddress: address,
      street: String(street).trim(),
      locality: String(locality).trim(),
      landmark: String(landmark).trim(),
      pincode: String(pincode).trim(),
      district: String(district).trim(),
      state: String(state).trim(),
      isWestBengal: validation.isWestBengal,
      confidence: parseFloat(wbMatch.importance || 0.6),
      provider: 'OpenStreetMap Nominatim',
      raw: wbMatch,
      allResults: data.map(item => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        formattedAddress: item.display_name,
        type: item.type,
        importance: item.importance
      }))
    };

    return result;
  }

  /**
   * Fallback forward geocode using internal MongoDB/local authoritative datasets
   */
  async fallbackForwardGeocode(address) {
    try {
      const pinMatch = address.match(/\b([1-9][0-9]{5})\b/);
      if (pinMatch) {
        const pinCode = pinMatch[1];
        const PostalLocation = require('../models/mongo/PostalLocation');
        const postDoc = await PostalLocation.findOne({ pincode: pinCode }).lean();
        if (postDoc && postDoc.latitude && postDoc.longitude) {
          return {
            latitude: postDoc.latitude,
            longitude: postDoc.longitude,
            coordinates: [postDoc.longitude, postDoc.latitude],
            formattedAddress: `${postDoc.postOffice}, ${postDoc.district}, West Bengal - ${postDoc.pincode}`,
            userEnteredAddress: address,
            street: '',
            locality: postDoc.postOffice || '',
            landmark: '',
            pincode: postDoc.pincode,
            district: postDoc.district,
            state: postDoc.state || 'West Bengal',
            isWestBengal: true,
            confidence: 0.8,
            provider: 'India Post Directory Fallback'
          };
        }
      }

      // Check Location collection for district/municipality/block match
      const { Location } = require('../models/mongo/Location');
      const words = address.split(/[,\s]+/).filter(w => w.length > 2);
      for (const word of words) {
        const loc = await Location.findOne({
          name: new RegExp(`^${word}$`, 'i'),
          latitude: { $ne: null },
          longitude: { $ne: null }
        }).lean();
        if (loc) {
          return {
            latitude: loc.latitude,
            longitude: loc.longitude,
            coordinates: [loc.longitude, loc.latitude],
            formattedAddress: `${loc.name}, West Bengal`,
            userEnteredAddress: address,
            street: '',
            locality: loc.name,
            landmark: '',
            pincode: '',
            district: loc.type === 'DISTRICT' ? loc.name : '',
            state: 'West Bengal',
            isWestBengal: true,
            confidence: 0.7,
            provider: 'Local LGD Administrative Fallback'
          };
        }
      }
    } catch (e) {
      console.warn('[GeocodingService] Fallback forward geocode notice:', e.message);
    }
    return null;
  }

  /**
   * Universal reverse geocode interface: Coordinates -> Address
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<{ street: string, locality: string, landmark: string, pincode: string, district: string, state: string, rawAddress: string, provider: string }>}
   */
  async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const validation = this.validateCoordinates(lat, lng);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const cacheKey = this.getReverseCacheKey(lat, lng);
    if (reverseCache.has(cacheKey)) {
      return reverseCache.get(cacheKey);
    }

    try {
      if (this.provider === 'nominatim') {
        const result = await this.reverseGeocodeNominatim(lat, lng);
        reverseCache.set(cacheKey, result);
        return result;
      } else {
        return this.fallbackGeocode(lat, lng);
      }
    } catch (err) {
      console.warn(`[GeocodingService] Reverse geocode failed: ${err.message}. Falling back.`);
      return this.fallbackGeocode(lat, lng);
    }
  }

  async reverseGeocodeNominatim(lat, lng) {
    await this.throttle();

    const url = 'https://nominatim.openstreetmap.org/reverse';
    const response = await axios.get(url, {
      params: {
        format: 'json',
        lat,
        lon: lng,
        addressdetails: 1,
        zoom: 18
      },
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Language': 'en'
      },
      timeout: 5000
    });

    const data = response.data || {};
    const addr = data.address || {};

    const street = addr.road || addr.street || addr.pedestrian || addr.footway || '';
    const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.town || addr.village || addr.hamlet || '';
    const landmark = addr.landmark || addr.amenity || addr.shop || addr.building || '';
    const pincode = addr.postcode || '';
    const district = addr.state_district || addr.county || addr.city || '';
    const state = addr.state || 'West Bengal';

    const result = {
      street: String(street).trim(),
      locality: String(locality).trim(),
      landmark: String(landmark).trim(),
      pincode: String(pincode).trim(),
      district: String(district).trim(),
      state: String(state).trim(),
      rawAddress: data.display_name || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      provider: 'OpenStreetMap Nominatim',
      attribution: 'Data © OpenStreetMap contributors, ODbL 1.0.'
    };

    return result;
  }

  fallbackGeocode(lat, lng) {
    return {
      street: '',
      locality: 'West Bengal Location',
      landmark: '',
      pincode: '',
      district: 'West Bengal',
      state: 'West Bengal',
      rawAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      provider: 'Local Coordinate Fallback'
    };
  }
}

module.exports = new GeocodingService();
