const axios = require('axios');
const db = require('../models/db');

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

// ---------------------------------------------------------------------------
// Authoritative West Bengal Instant Local Resolution Registry (< 2ms lookup)
// ---------------------------------------------------------------------------
const KNOWN_WB_LOCATIONS = [
  // Murshidabad (Berhampore / Baharampur)
  {
    keys: ['behrampur', 'berhampore', 'baharampur', 'berhampur', 'baharampore', 'murshidabad'],
    lat: 24.0988,
    lng: 88.2514,
    district: 'Murshidabad',
    pincode: '742101',
    locality: 'Berhampore',
    formattedAddress: 'Berhampore, Murshidabad, West Bengal - 742101'
  },
  // North 24 Parganas - Adhata / Habra / Amdanga / Barasat / Ashoknagar / Bira
  {
    keys: ['bira', 'bira station', 'bira railway station', 'bira station road'],
    lat: 22.7906,
    lng: 88.5714,
    district: 'North 24 Parganas',
    pincode: '743221',
    locality: 'Bira',
    formattedAddress: 'Bira Station Road, Bira, North 24 Parganas, West Bengal - 743221'
  },
  {
    keys: ['guma', 'guma station', 'guma railway station'],
    lat: 22.8100,
    lng: 88.5900,
    district: 'North 24 Parganas',
    pincode: '743223',
    locality: 'Guma',
    formattedAddress: 'Guma, North 24 Parganas, West Bengal - 743223'
  },
  {
    keys: ['adhata', 'adhata gram panchayat', 'adhata gp'],
    lat: 22.8250,
    lng: 88.5150,
    district: 'North 24 Parganas',
    pincode: '743221',
    locality: 'Adhata',
    formattedAddress: 'Adhata (Habra/Amdanga), North 24 Parganas, West Bengal - 743221'
  },
  {
    keys: ['barasat', 'barasat hq'],
    lat: 22.7230,
    lng: 88.4800,
    district: 'North 24 Parganas',
    pincode: '700124',
    locality: 'Barasat',
    formattedAddress: 'Barasat, North 24 Parganas, West Bengal - 700124'
  },
  {
    keys: ['habra'],
    lat: 22.8350,
    lng: 88.6300,
    district: 'North 24 Parganas',
    pincode: '743263',
    locality: 'Habra',
    formattedAddress: 'Habra, North 24 Parganas, West Bengal - 743263'
  },
  {
    keys: ['ashoknagar', 'ashokenagar', 'kalyangarh'],
    lat: 22.8300,
    lng: 88.6200,
    district: 'North 24 Parganas',
    pincode: '743222',
    locality: 'Ashoknagar Kalyangarh',
    formattedAddress: 'Ashoknagar, North 24 Parganas, West Bengal - 743222'
  },
  {
    keys: ['amdanga'],
    lat: 22.8000,
    lng: 88.5200,
    district: 'North 24 Parganas',
    pincode: '743221',
    locality: 'Amdanga',
    formattedAddress: 'Amdanga, North 24 Parganas, West Bengal - 743221'
  },
  {
    keys: ['dattapukur'],
    lat: 22.7750,
    lng: 88.5200,
    district: 'North 24 Parganas',
    pincode: '743145',
    locality: 'Dattapukur',
    formattedAddress: 'Dattapukur, North 24 Parganas, West Bengal - 743145'
  },
  {
    keys: ['madhyamgram'],
    lat: 22.7010,
    lng: 88.4550,
    district: 'North 24 Parganas',
    pincode: '700129',
    locality: 'Madhyamgram',
    formattedAddress: 'Madhyamgram, North 24 Parganas, West Bengal - 700129'
  },
  {
    keys: ['barrackpore', 'barrackpur'],
    lat: 22.7620,
    lng: 88.3720,
    district: 'North 24 Parganas',
    pincode: '700120',
    locality: 'Barrackpore',
    formattedAddress: 'Barrackpore, North 24 Parganas, West Bengal - 700120'
  },
  {
    keys: ['bongaon', 'bangao'],
    lat: 23.0420,
    lng: 88.8310,
    district: 'North 24 Parganas',
    pincode: '743235',
    locality: 'Bongaon',
    formattedAddress: 'Bongaon, North 24 Parganas, West Bengal - 743235'
  },
  {
    keys: ['basirhat'],
    lat: 22.6610,
    lng: 88.8910,
    district: 'North 24 Parganas',
    pincode: '743412',
    locality: 'Basirhat',
    formattedAddress: 'Basirhat, North 24 Parganas, West Bengal - 743412'
  },
  {
    keys: ['salt lake', 'saltlake', 'bidhannagar', 'sector v'],
    lat: 22.5800,
    lng: 88.4200,
    district: 'North 24 Parganas',
    pincode: '700091',
    locality: 'Salt Lake',
    formattedAddress: 'Salt Lake (Bidhannagar), North 24 Parganas, West Bengal - 700091'
  },
  {
    keys: ['new town', 'newtown', 'rajarhat'],
    lat: 22.5890,
    lng: 88.4600,
    district: 'North 24 Parganas',
    pincode: '700156',
    locality: 'New Town',
    formattedAddress: 'New Town (Rajarhat), North 24 Parganas, West Bengal - 700156'
  },
  {
    keys: ['panihati'],
    lat: 22.6900,
    lng: 88.3800,
    district: 'North 24 Parganas',
    pincode: '700114',
    locality: 'Panihati',
    formattedAddress: 'Panihati, North 24 Parganas, West Bengal - 700114'
  },
  {
    keys: ['kamarhati'],
    lat: 22.6700,
    lng: 88.3700,
    district: 'North 24 Parganas',
    pincode: '700058',
    locality: 'Kamarhati',
    formattedAddress: 'Kamarhati, North 24 Parganas, West Bengal - 700058'
  },
  {
    keys: ['bhatpara'],
    lat: 22.8700,
    lng: 88.4100,
    district: 'North 24 Parganas',
    pincode: '743123',
    locality: 'Bhatpara',
    formattedAddress: 'Bhatpara, North 24 Parganas, West Bengal - 743123'
  },
  {
    keys: ['naihati', 'naihati town', 'naihati bazar', 'naihati market', 'naihati so'],
    lat: 22.8900,
    lng: 88.4230,
    district: 'North 24 Parganas',
    pincode: '743165',
    locality: 'Naihati',
    formattedAddress: 'Naihati, North 24 Parganas, West Bengal - 743165'
  },
  {
    keys: ['naihati station', 'naihati junction', 'naihati railway station'],
    lat: 22.8870,
    lng: 88.4177,
    district: 'North 24 Parganas',
    pincode: '743165',
    locality: 'Naihati',
    formattedAddress: 'Naihati Junction, Naihati, North 24 Parganas, West Bengal - 743165'
  },
  {
    keys: ['naihati municipality', 'naihati rbc road', 'rbc road naihati'],
    lat: 22.8885,
    lng: 88.4205,
    district: 'North 24 Parganas',
    pincode: '743165',
    locality: 'Naihati',
    formattedAddress: 'Naihati Municipality, RBC Road, Naihati, North 24 Parganas, West Bengal - 743165'
  },
  // Kolkata
  {
    keys: ['kolkata', 'calcutta', 'park street', 'esplanade', 'bbd bagh', 'shyambazar', 'alipore', 'jadavpur', 'ballygunge'],
    lat: 22.5726,
    lng: 88.3639,
    district: 'Kolkata',
    pincode: '700001',
    locality: 'Kolkata',
    formattedAddress: 'Kolkata, West Bengal - 700001'
  },
  // Howrah
  {
    keys: ['howrah', 'haora', 'howrah station', 'shibpur', 'santragachi'],
    lat: 22.5958,
    lng: 88.2636,
    district: 'Howrah',
    pincode: '711101',
    locality: 'Howrah',
    formattedAddress: 'Howrah, West Bengal - 711101'
  },
  {
    keys: ['uluberia'],
    lat: 22.4700,
    lng: 88.1100,
    district: 'Howrah',
    pincode: '711315',
    locality: 'Uluberia',
    formattedAddress: 'Uluberia, Howrah, West Bengal - 711315'
  },
  // South 24 Parganas
  {
    keys: ['baruipur'],
    lat: 22.3600,
    lng: 88.4300,
    district: 'South 24 Parganas',
    pincode: '700144',
    locality: 'Baruipur',
    formattedAddress: 'Baruipur, South 24 Parganas, West Bengal - 700144'
  },
  {
    keys: ['diamond harbour', 'diamondharbour'],
    lat: 22.1900,
    lng: 88.1900,
    district: 'South 24 Parganas',
    pincode: '743331',
    locality: 'Diamond Harbour',
    formattedAddress: 'Diamond Harbour, South 24 Parganas, West Bengal - 743331'
  },
  {
    keys: ['sonarpur', 'rajpur sonarpur'],
    lat: 22.4400,
    lng: 88.4300,
    district: 'South 24 Parganas',
    pincode: '700150',
    locality: 'Sonarpur',
    formattedAddress: 'Rajpur Sonarpur, South 24 Parganas, West Bengal - 700150'
  },
  // Hooghly
  {
    keys: ['chinsurah', 'chinsura', 'hooghly', 'hugli', 'bandel'],
    lat: 22.9080,
    lng: 88.3968,
    district: 'Hooghly',
    pincode: '712101',
    locality: 'Chinsurah',
    formattedAddress: 'Hooghly-Chinsurah, West Bengal - 712101'
  },
  {
    keys: ['serampore', 'shreerampur'],
    lat: 22.7510,
    lng: 88.3410,
    district: 'Hooghly',
    pincode: '712201',
    locality: 'Serampore',
    formattedAddress: 'Serampore, Hooghly, West Bengal - 712201'
  },
  {
    keys: ['chandannagar', 'chandannagore', 'chandan nagar'],
    lat: 22.8710,
    lng: 88.3810,
    district: 'Hooghly',
    pincode: '712136',
    locality: 'Chandannagar',
    formattedAddress: 'Chandannagar, Hooghly, West Bengal - 712136'
  },
  // Nadia
  {
    keys: ['b-12', 'b-12 kalyani', 'block b-12'],
    lat: 22.9704,
    lng: 88.4393,
    district: 'Nadia',
    pincode: '741235',
    locality: 'Kalyani',
    formattedAddress: 'B-12, Kalyani, Nadia, West Bengal - 741235'
  },
  {
    keys: ['b-10', 'b-10 kalyani', 'block b-10'],
    lat: 22.9740,
    lng: 88.4390,
    district: 'Nadia',
    pincode: '741235',
    locality: 'Kalyani',
    formattedAddress: 'B-10, Kalyani, Nadia, West Bengal - 741235'
  },
  {
    keys: ['krishnanagar', 'krishnagar'],
    lat: 23.4013,
    lng: 88.5015,
    district: 'Nadia',
    pincode: '741101',
    locality: 'Krishnanagar',
    formattedAddress: 'Krishnanagar, Nadia, West Bengal - 741101'
  },
  {
    keys: ['kalyani'],
    lat: 22.9750,
    lng: 88.4340,
    district: 'Nadia',
    pincode: '741235',
    locality: 'Kalyani',
    formattedAddress: 'Kalyani, Nadia, West Bengal - 741235'
  },
  {
    keys: ['ranaghat'],
    lat: 23.1810,
    lng: 88.5810,
    district: 'Nadia',
    pincode: '741201',
    locality: 'Ranaghat',
    formattedAddress: 'Ranaghat, Nadia, West Bengal - 741201'
  },
  {
    keys: ['santipur', 'shantipur'],
    lat: 23.2500,
    lng: 88.4300,
    district: 'Nadia',
    pincode: '741404',
    locality: 'Shantipur',
    formattedAddress: 'Shantipur, Nadia, West Bengal - 741404'
  },
  {
    keys: ['nabadwip', 'navadwip'],
    lat: 23.4100,
    lng: 88.3700,
    district: 'Nadia',
    pincode: '741302',
    locality: 'Nabadwip',
    formattedAddress: 'Nabadwip, Nadia, West Bengal - 741302'
  },
  // Paschim Bardhaman
  {
    keys: ['asansol', 'asansol junction'],
    lat: 23.6889,
    lng: 86.9661,
    district: 'Paschim Bardhaman',
    pincode: '713301',
    locality: 'Asansol',
    formattedAddress: 'Asansol, Paschim Bardhaman, West Bengal - 713301'
  },
  {
    keys: ['durgapur', 'city centre durgapur'],
    lat: 23.5204,
    lng: 87.3119,
    district: 'Paschim Bardhaman',
    pincode: '713216',
    locality: 'Durgapur',
    formattedAddress: 'Durgapur, Paschim Bardhaman, West Bengal - 713216'
  },
  // Purba Bardhaman
  {
    keys: ['bardhaman', 'burdwan'],
    lat: 23.2324,
    lng: 87.8615,
    district: 'Purba Bardhaman',
    pincode: '713101',
    locality: 'Bardhaman',
    formattedAddress: 'Bardhaman, Purba Bardhaman, West Bengal - 713101'
  },
  {
    keys: ['katwa'],
    lat: 23.6400,
    lng: 88.1300,
    district: 'Purba Bardhaman',
    pincode: '713130',
    locality: 'Katwa',
    formattedAddress: 'Katwa, Purba Bardhaman, West Bengal - 713130'
  },
  {
    keys: ['kalna'],
    lat: 23.2200,
    lng: 88.3700,
    district: 'Purba Bardhaman',
    pincode: '713409',
    locality: 'Kalna',
    formattedAddress: 'Kalna, Purba Bardhaman, West Bengal - 713409'
  },
  // Birbhum
  {
    keys: ['suri', 'siuri'],
    lat: 23.9054,
    lng: 87.5246,
    district: 'Birbhum',
    pincode: '731101',
    locality: 'Suri',
    formattedAddress: 'Suri, Birbhum, West Bengal - 731101'
  },
  {
    keys: ['bolpur', 'santiniketan', 'shantiniketan'],
    lat: 23.6750,
    lng: 87.6950,
    district: 'Birbhum',
    pincode: '731204',
    locality: 'Bolpur',
    formattedAddress: 'Bolpur (Santiniketan), Birbhum, West Bengal - 731204'
  },
  {
    keys: ['rampurhat'],
    lat: 24.1700,
    lng: 87.7800,
    district: 'Birbhum',
    pincode: '731224',
    locality: 'Rampurhat',
    formattedAddress: 'Rampurhat, Birbhum, West Bengal - 731224'
  },
  // Bankura
  {
    keys: ['bankura'],
    lat: 23.2325,
    lng: 87.0715,
    district: 'Bankura',
    pincode: '722101',
    locality: 'Bankura',
    formattedAddress: 'Bankura, West Bengal - 722101'
  },
  {
    keys: ['bishnupur'],
    lat: 23.0700,
    lng: 87.3200,
    district: 'Bankura',
    pincode: '722122',
    locality: 'Bishnupur',
    formattedAddress: 'Bishnupur, Bankura, West Bengal - 722122'
  },
  // Purulia
  {
    keys: ['purulia'],
    lat: 23.3322,
    lng: 86.3652,
    district: 'Purulia',
    pincode: '723101',
    locality: 'Purulia',
    formattedAddress: 'Purulia, West Bengal - 723101'
  },
  // Purba Medinipur
  {
    keys: ['tamluk'],
    lat: 22.2982,
    lng: 87.9234,
    district: 'Purba Medinipur',
    pincode: '721601',
    locality: 'Tamluk',
    formattedAddress: 'Tamluk, Purba Medinipur, West Bengal - 721601'
  },
  {
    keys: ['haldia'],
    lat: 22.0600,
    lng: 88.0600,
    district: 'Purba Medinipur',
    pincode: '721607',
    locality: 'Haldia',
    formattedAddress: 'Haldia, Purba Medinipur, West Bengal - 721607'
  },
  {
    keys: ['digha'],
    lat: 21.6266,
    lng: 87.5074,
    district: 'Purba Medinipur',
    pincode: '721428',
    locality: 'Digha',
    formattedAddress: 'Digha, Purba Medinipur, West Bengal - 721428'
  },
  {
    keys: ['contai', 'kanthi'],
    lat: 21.7800,
    lng: 87.7500,
    district: 'Purba Medinipur',
    pincode: '721401',
    locality: 'Contai',
    formattedAddress: 'Contai, Purba Medinipur, West Bengal - 721401'
  },
  // Paschim Medinipur
  {
    keys: ['medinipur', 'midnapore'],
    lat: 22.4257,
    lng: 87.3199,
    district: 'Paschim Medinipur',
    pincode: '721101',
    locality: 'Medinipur',
    formattedAddress: 'Medinipur, Paschim Medinipur, West Bengal - 721101'
  },
  {
    keys: ['kharagpur', 'iit kharagpur'],
    lat: 22.3400,
    lng: 87.3200,
    district: 'Paschim Medinipur',
    pincode: '721301',
    locality: 'Kharagpur',
    formattedAddress: 'Kharagpur, Paschim Medinipur, West Bengal - 721301'
  },
  // Jhargram
  {
    keys: ['jhargram'],
    lat: 22.4500,
    lng: 86.9800,
    district: 'Jhargram',
    pincode: '721507',
    locality: 'Jhargram',
    formattedAddress: 'Jhargram, West Bengal - 721507'
  },
  // Malda
  {
    keys: ['malda', 'english bazar', 'englishbazar'],
    lat: 25.0108,
    lng: 88.1411,
    district: 'Malda',
    pincode: '732101',
    locality: 'English Bazar',
    formattedAddress: 'Malda (English Bazar), West Bengal - 732101'
  },
  // Uttar Dinajpur
  {
    keys: ['raiganj', 'uttar dinajpur'],
    lat: 25.6200,
    lng: 88.1200,
    district: 'Uttar Dinajpur',
    pincode: '733134',
    locality: 'Raiganj',
    formattedAddress: 'Raiganj, Uttar Dinajpur, West Bengal - 733134'
  },
  // Dakshin Dinajpur
  {
    keys: ['balurghat', 'dakshin dinajpur'],
    lat: 25.2200,
    lng: 88.7700,
    district: 'Dakshin Dinajpur',
    pincode: '733101',
    locality: 'Balurghat',
    formattedAddress: 'Balurghat, Dakshin Dinajpur, West Bengal - 733101'
  },
  // Darjeeling
  {
    keys: ['darjeeling', 'darjeeling town'],
    lat: 27.0410,
    lng: 88.2663,
    district: 'Darjeeling',
    pincode: '734101',
    locality: 'Darjeeling',
    formattedAddress: 'Darjeeling, West Bengal - 734101'
  },
  {
    keys: ['siliguri', 'siliguri junction'],
    lat: 26.7271,
    lng: 88.4239,
    district: 'Darjeeling',
    pincode: '734001',
    locality: 'Siliguri',
    formattedAddress: 'Siliguri, West Bengal - 734001'
  },
  // Kalimpong
  {
    keys: ['kalimpong'],
    lat: 27.0667,
    lng: 88.4667,
    district: 'Kalimpong',
    pincode: '734301',
    locality: 'Kalimpong',
    formattedAddress: 'Kalimpong, West Bengal - 734301'
  },
  // Jalpaiguri
  {
    keys: ['jalpaiguri'],
    lat: 26.5400,
    lng: 88.7200,
    district: 'Jalpaiguri',
    pincode: '735101',
    locality: 'Jalpaiguri',
    formattedAddress: 'Jalpaiguri, West Bengal - 735101'
  },
  // Alipurduar
  {
    keys: ['alipurduar', 'dooars'],
    lat: 26.4900,
    lng: 89.5300,
    district: 'Alipurduar',
    pincode: '736121',
    locality: 'Alipurduar',
    formattedAddress: 'Alipurduar, West Bengal - 736121'
  },
  // Cooch Behar
  {
    keys: ['cooch behar', 'coochbehar'],
    lat: 26.3200,
    lng: 89.4500,
    district: 'Cooch Behar',
    pincode: '736101',
    locality: 'Cooch Behar',
    formattedAddress: 'Cooch Behar, West Bengal - 736101'
  }
];

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
   * Fast in-memory local resolution (< 2ms) using authoritative West Bengal database
   */
  fastLocalForwardLookup(address) {
    if (!address || typeof address !== 'string') return null;

    const raw = address.trim();
    const clean = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return null;

    // 1. Check PIN code pattern (6 digits) in address
    const pinMatch = raw.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch) {
      const pin = pinMatch[1];
      // Check in KNOWN_WB_LOCATIONS
      const matchByPin = KNOWN_WB_LOCATIONS.find(loc => loc.pincode === pin);
      if (matchByPin) {
        return this._formatFastResult(matchByPin, raw);
      }
      // Check in db.data.postcodes
      if (db.data && Array.isArray(db.data.postcodes)) {
        const pc = db.data.postcodes.find(p => String(p.pincode) === pin);
        if (pc && pc.lat && pc.lng) {
          const dist = (db.data.districts || []).find(d => d.id === pc.district_id);
          return {
            latitude: pc.lat,
            longitude: pc.lng,
            coordinates: [pc.lng, pc.lat],
            formattedAddress: `${pc.post_office || pc.locality}, ${dist?.name || 'West Bengal'} - ${pc.pincode}`,
            userEnteredAddress: raw,
            street: '',
            locality: pc.locality || pc.post_office || '',
            landmark: '',
            pincode: pc.pincode,
            district: dist?.name || '',
            state: 'West Bengal',
            isWestBengal: true,
            confidence: 0.95,
            provider: 'West Bengal Postal Registry'
          };
        }
      }
    }

    // 2. Direct match or keyword match in KNOWN_WB_LOCATIONS
    // Pass 1: Exact key match
    for (const loc of KNOWN_WB_LOCATIONS) {
      for (const k of loc.keys) {
        if (clean === k) {
          return this._formatFastResult(loc, raw);
        }
      }
    }

    // Pass 2: Prefix / phrase match (prioritize longer/more specific keys first)
    const sortedLocations = [...KNOWN_WB_LOCATIONS].sort((a, b) => {
      const maxLenA = Math.max(...a.keys.map(k => k.length));
      const maxLenB = Math.max(...b.keys.map(k => k.length));
      return maxLenB - maxLenA;
    });

    for (const loc of sortedLocations) {
      for (const k of loc.keys) {
        if (clean.startsWith(k + ' ') || clean.endsWith(' ' + k) || clean.includes(' ' + k + ' ') || (clean.length >= 4 && k.includes(clean))) {
          return this._formatFastResult(loc, raw);
        }
      }
    }

    // 3. Search in db.data.ulbs (Municipalities / Corporations)
    if (db.data && Array.isArray(db.data.ulbs)) {
      const matchedUlb = db.data.ulbs.find(u => {
        if (!u.name || !u.lat || !u.lng) return false;
        const uClean = u.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        return uClean === clean || uClean.includes(clean) || clean.includes(uClean.replace('municipality', '').trim());
      });
      if (matchedUlb) {
        const dist = (db.data.districts || []).find(d => d.id === matchedUlb.district_id);
        return {
          latitude: matchedUlb.lat,
          longitude: matchedUlb.lng,
          coordinates: [matchedUlb.lng, matchedUlb.lat],
          formattedAddress: `${matchedUlb.name}, ${dist?.name || 'West Bengal'}`,
          userEnteredAddress: raw,
          street: '',
          locality: matchedUlb.name,
          landmark: '',
          pincode: '',
          district: dist?.name || '',
          state: 'West Bengal',
          isWestBengal: true,
          confidence: 0.9,
          provider: 'West Bengal ULB Registry'
        };
      }
    }

    // 4. Search in db.data.districts
    if (db.data && Array.isArray(db.data.districts)) {
      const matchedDist = db.data.districts.find(d => {
        const dClean = d.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        const hClean = (d.headquarters || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        return clean === dClean || clean.includes(dClean) || (hClean && clean.includes(hClean));
      });
      if (matchedDist && matchedDist.center_lat && matchedDist.center_lng) {
        return {
          latitude: matchedDist.center_lat,
          longitude: matchedDist.center_lng,
          coordinates: [matchedDist.center_lng, matchedDist.center_lat],
          formattedAddress: `${matchedDist.name} District, West Bengal`,
          userEnteredAddress: raw,
          street: '',
          locality: matchedDist.headquarters || matchedDist.name,
          landmark: '',
          pincode: '',
          district: matchedDist.name,
          state: 'West Bengal',
          isWestBengal: true,
          confidence: 0.88,
          provider: 'West Bengal District Registry'
        };
      }
    }

    // 5. Search in db.data.postcodes by locality or post_office name
    if (db.data && Array.isArray(db.data.postcodes)) {
      const matchedPc = db.data.postcodes.find(p => {
        const poClean = (p.post_office || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        const locClean = (p.locality || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        return poClean.includes(clean) || locClean.includes(clean) || clean.includes(locClean);
      });
      if (matchedPc && matchedPc.lat && matchedPc.lng) {
        const dist = (db.data.districts || []).find(d => d.id === matchedPc.district_id);
        return {
          latitude: matchedPc.lat,
          longitude: matchedPc.lng,
          coordinates: [matchedPc.lng, matchedPc.lat],
          formattedAddress: `${matchedPc.post_office || matchedPc.locality}, ${dist?.name || 'West Bengal'} - ${matchedPc.pincode}`,
          userEnteredAddress: raw,
          street: '',
          locality: matchedPc.locality || matchedPc.post_office || '',
          landmark: '',
          pincode: matchedPc.pincode,
          district: dist?.name || '',
          state: 'West Bengal',
          isWestBengal: true,
          confidence: 0.9,
          provider: 'West Bengal Postal Directory'
        };
      }
    }

    return null;
  }

  _formatFastResult(match, userEnteredAddress) {
    const result = {
      latitude: match.lat,
      longitude: match.lng,
      coordinates: [match.lng, match.lat],
      formattedAddress: match.formattedAddress,
      userEnteredAddress,
      street: '',
      locality: match.locality,
      landmark: '',
      pincode: match.pincode || '',
      district: match.district,
      state: 'West Bengal',
      isWestBengal: true,
      confidence: 0.95,
      provider: 'Fast Local Administrative Registry'
    };

    // Pre-populate reverse cache so subsequent reverse geocode is also 0ms instant
    const revKey = this.getReverseCacheKey(match.lat, match.lng);
    if (!reverseCache.has(revKey)) {
      reverseCache.set(revKey, {
        street: '',
        locality: match.locality,
        landmark: '',
        pincode: match.pincode || '',
        district: match.district,
        state: 'West Bengal',
        rawAddress: match.formattedAddress,
        provider: 'Fast Local Administrative Registry'
      });
    }

    return result;
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

    // 1. FAST IN-MEMORY LOCAL LOOKUP (< 2ms response time)
    const fastLocal = this.fastLocalForwardLookup(cleanAddress);
    if (fastLocal) {
      forwardCache.set(cacheKey, fastLocal);
      return fastLocal;
    }

    try {
      if (this.provider === 'nominatim') {
        const result = await this.forwardGeocodeNominatim(cleanAddress, options);
        if (result && result.latitude && result.longitude) {
          forwardCache.set(cacheKey, result);
          const revKey = this.getReverseCacheKey(result.latitude, result.longitude);
          if (!reverseCache.has(revKey)) {
            reverseCache.set(revKey, {
              street: result.street,
              locality: result.locality,
              landmark: result.landmark,
              pincode: result.pincode,
              district: result.district,
              state: result.state,
              rawAddress: result.formattedAddress,
              provider: result.provider
            });
          }
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
    // Only throttle if not an urgent interactive user search
    if (!options.skipThrottle) {
      await this.throttle();
    }

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
      timeout: 2500
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
    // 1. Try local memory registry first
    const fastLocal = this.fastLocalForwardLookup(address);
    if (fastLocal) return fastLocal;

    try {
      // Guard against Mongoose query timeout (10s) when MongoDB is disconnected
      let isMongoReady = false;
      try {
        const mongoose = require('mongoose');
        isMongoReady = mongoose.connection && mongoose.connection.readyState === 1;
      } catch {
        isMongoReady = false;
      }

      if (isMongoReady) {
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
        zoom: 18,
        layer: 'address,poi'
      },
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Language': 'en'
      },
      timeout: 5000
    });

    const data = response.data || {};
    const addr = data.address || {};

    const isBlockPattern = (val) =>
      /^[A-Z]-\d+$/i.test(String(val).trim()) ||
      /^Sector\s*[0-9A-Z]+/i.test(String(val).trim()) ||
      /^Block\s*[0-9A-Z]+/i.test(String(val).trim()) ||
      /^Action\s*Area\s*[0-9A-Z]+/i.test(String(val).trim());

    // Priority 1 (Specific POI / Road): amenity / building / shop / railway / road
    let street = addr.amenity || addr.building || addr.shop || addr.railway || addr.road || addr.highway || addr.pedestrian || addr.footway || '';
    if (['yes', 'no', 'residential', 'unclassified', 'service', 'tertiary', 'secondary', 'primary', 'trunk'].includes(String(street).toLowerCase())) {
      street = '';
    }

    // If exact point lacks a street name at zoom=18, probe zoom=17
    if (!street) {
      try {
        const z17Resp = await axios.get(url, {
          params: { format: 'json', lat, lon: lng, addressdetails: 1, zoom: 17, layer: 'address,poi' },
          headers: { 'User-Agent': this.userAgent, 'Accept-Language': 'en' },
          timeout: 2500
        });
        const z17Addr = z17Resp.data?.address || {};
        const z17Street = z17Addr.road || z17Addr.railway || z17Addr.amenity || z17Addr.building || z17Addr.shop || '';
        if (z17Street && !['yes', 'no', 'residential', 'unclassified', 'service'].includes(String(z17Street).toLowerCase())) {
          street = z17Street;
        }
      } catch (zErr) {
        // Continue if zoom 17 fails
      }
    }

    // Priority 2: Sub-locality (Block / Sector / Quarter / Neighbourhood / Hamlet)
    let subLocality = '';
    if (isBlockPattern(addr.suburb) && isBlockPattern(addr.neighbourhood)) {
      // In planned townships (e.g. Kalyani), suburb is the enclosing administrative boundary relation (admin_level 10, e.g. "B-12")
      subLocality = addr.suburb;
    } else if (isBlockPattern(addr.quarter)) {
      subLocality = addr.quarter;
    } else if (isBlockPattern(addr.suburb)) {
      subLocality = addr.suburb;
    } else if (isBlockPattern(addr.neighbourhood)) {
      subLocality = addr.neighbourhood;
    } else {
      const dTokens = String(data.display_name || '').split(',').map(s => s.trim());
      const blockToken = dTokens.find(t => isBlockPattern(t));
      if (blockToken) {
        subLocality = blockToken;
      } else {
        subLocality = addr.quarter || addr.neighbourhood || '';
        const hasCity = Boolean(addr.city || addr.town || addr.municipality);
        if (!subLocality && hasCity && addr.suburb) {
          subLocality = addr.suburb;
        }
      }
    }

    // Priority 3: City / Town / Village (Never overwritten by subLocality)
    let cityCandidate = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    let cleanCity = cityCandidate.replace(/\s*city\s*/gi, '').trim();
    if (cleanCity.toLowerCase() === 'greater kolkata') {
      cleanCity = (addr.county && addr.county.toLowerCase() !== 'greater kolkata') ? addr.county : (addr.town || 'Kalyani');
    }
    if (!cleanCity && addr.suburb && !isBlockPattern(addr.suburb)) {
      cleanCity = addr.suburb;
    }
    const cityOrTown = cleanCity;

    // District: prefer state_district to avoid CD blocks like 'Habra - II'
    let district = (addr.state_district || addr.county || '').replace(/\s*district\s*/gi, '').trim();
    if (district.includes('-') && addr.state_district) {
      district = addr.state_district.replace(/\s*district\s*/gi, '').trim();
    }
    const state = addr.state || 'West Bengal';
    const pincode = addr.postcode || '';

    // Format clean address in order: [Road/POI], [subLocality], [cityOrTown], [district], [state] - [postcode]
    const parts = [];
    const added = new Set();
    const addPart = (val) => {
      if (!val) return;
      const v = String(val).trim();
      const lower = v.toLowerCase();
      if (v && !added.has(lower)) {
        parts.push(v);
        added.add(lower);
      }
    };

    addPart(street);
    addPart(subLocality);
    addPart(cityOrTown);
    addPart(district);
    addPart(state);

    let formatted = parts.join(', ');
    if (pincode) {
      formatted += ` - ${pincode}`;
    }

    const locality = subLocality ? (cityOrTown ? `${subLocality}, ${cityOrTown}` : subLocality) : cityOrTown;

    const result = {
      street: String(street).trim(),
      subLocality: String(subLocality).trim(),
      cityOrTown: String(cityOrTown).trim(),
      locality: String(locality).trim(),
      landmark: String(addr.landmark || addr.amenity || addr.shop || addr.building || '').trim(),
      pincode: String(pincode).trim(),
      district: String(district).trim(),
      state: String(state).trim(),
      rawAddress: formatted || data.display_name || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      provider: 'OpenStreetMap Nominatim',
      attribution: 'Data © OpenStreetMap contributors, ODbL 1.0.'
    };

    return result;
  }

  fallbackGeocode(lat, lng) {
    let bestLoc = null;
    let minKm = Infinity;

    const haversineKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // 1. Check against authoritative KNOWN_WB_LOCATIONS in West Bengal registry
    for (const loc of KNOWN_WB_LOCATIONS) {
      if (loc.lat && loc.lng) {
        const d = haversineKm(lat, lng, loc.lat, loc.lng);
        if (d < minKm) {
          minKm = d;
          bestLoc = {
            locality: loc.locality,
            district: loc.district,
            pincode: loc.pincode || '',
            landmark: loc.locality,
            formattedAddress: loc.formattedAddress
          };
        }
      }
    }

    // 2. Check against all 54 Municipalities / ULBs in West Bengal database
    const ulbs = (db.data && db.data.ulbs) || [];
    for (const u of ulbs) {
      if (u.lat && u.lng) {
        const d = haversineKm(lat, lng, u.lat, u.lng);
        if (d < minKm) {
          minKm = d;
          const distObj = (db.data.districts || []).find(dist => dist.id === u.district_id);
          const cleanName = u.name.replace(/(Municipality|Municipal Corporation|Corporation)/i, '').trim();
          bestLoc = {
            locality: cleanName,
            district: distObj ? distObj.name : 'North 24 Parganas',
            pincode: '',
            landmark: u.name,
            formattedAddress: `${cleanName}, ${distObj?.name || 'North 24 Parganas'}, West Bengal`
          };
        }
      }
    }

    // 3. Check against all 23 West Bengal district headquarters
    const allDistricts = (db.data && db.data.districts) || [];
    for (const d of allDistricts) {
      if (d.center_lat && d.center_lng) {
        const distKm = haversineKm(lat, lng, d.center_lat, d.center_lng);
        if (distKm < minKm) {
          minKm = distKm;
          bestLoc = {
            locality: d.headquarters || d.name,
            district: d.name,
            pincode: '',
            landmark: d.name,
            formattedAddress: `${d.headquarters || d.name}, ${d.name}, West Bengal`
          };
        }
      }
    }

    // Strict Granularity: If direct match within 1km and has formattedAddress, use it directly
    if (bestLoc && minKm <= 1.0 && bestLoc.formattedAddress) {
      return {
        street: '',
        locality: bestLoc.locality,
        landmark: bestLoc.landmark || bestLoc.locality,
        pincode: bestLoc.pincode || '',
        district: bestLoc.district,
        state: 'West Bengal',
        rawAddress: bestLoc.formattedAddress,
        provider: 'Local West Bengal Spatial Registry'
      };
    }

    // If within 2.5km, format locality cleanly - NEVER prepend "Near <Block>" when settlement is matched
    if (bestLoc && minKm <= 2.5) {
      const pinStr = bestLoc.pincode ? ` - ${bestLoc.pincode}` : '';
      const resolvedAddr = `${bestLoc.locality}, ${bestLoc.district}, West Bengal${pinStr}`;
      return {
        street: '',
        locality: bestLoc.locality,
        landmark: bestLoc.landmark || bestLoc.locality,
        pincode: bestLoc.pincode || '',
        district: bestLoc.district,
        state: 'West Bengal',
        rawAddress: resolvedAddr,
        provider: 'Local West Bengal Spatial Registry'
      };
    }

    // If beyond 2.5km, do NOT fabricate "Near <CD Block>". Return District + GPS coordinates cleanly
    if (bestLoc && minKm <= 60) {
      const pinStr = bestLoc.pincode ? ` - ${bestLoc.pincode}` : '';
      const resolvedAddr = `${bestLoc.district}, West Bengal (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)})${pinStr}`;
      return {
        street: '',
        locality: bestLoc.district,
        landmark: '',
        pincode: bestLoc.pincode || '',
        district: bestLoc.district,
        state: 'West Bengal',
        rawAddress: resolvedAddr,
        provider: 'Local West Bengal Spatial Registry'
      };
    }

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
