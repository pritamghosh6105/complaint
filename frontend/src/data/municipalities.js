/**
 * Complete Official Directory of Municipalities and Municipal Corporations
 * for Kolkata, Barasat Sadar Subdivision, and Barrackpore Subdivision
 * (North 24 Parganas & Kolkata, West Bengal)
 */

export const MUNICIPALITIES_BY_SUBDIVISION = [
  {
    subdivision: 'Barrackpore Subdivision',
    municipalities: [
      { id: 'Kanchrapara', name: 'Kanchrapara Municipality', wards: 24, subdivision: 'Barrackpore' },
      { id: 'Halisahar', name: 'Halisahar Municipality', wards: 23, subdivision: 'Barrackpore' },
      { id: 'Naihati', name: 'Naihati Municipality', wards: 31, subdivision: 'Barrackpore' },
      { id: 'Bhatpara', name: 'Bhatpara Municipality', wards: 35, subdivision: 'Barrackpore' },
      { id: 'Garulia', name: 'Garulia Municipality', wards: 21, subdivision: 'Barrackpore' },
      { id: 'NorthBarrackpore', name: 'North Barrackpore Municipality', wards: 23, subdivision: 'Barrackpore' },
      { id: 'Barrackpore', name: 'Barrackpore Municipality', wards: 24, subdivision: 'Barrackpore' },
      { id: 'Titagarh', name: 'Titagarh Municipality', wards: 23, subdivision: 'Barrackpore' },
      { id: 'Khardah', name: 'Khardah Municipality', wards: 22, subdivision: 'Barrackpore' },
      { id: 'Panihati', name: 'Panihati Municipality', wards: 35, subdivision: 'Barrackpore' },
      { id: 'NewBarrackpore', name: 'New Barrackpore Municipality', wards: 20, subdivision: 'Barrackpore' },
      { id: 'Kamarhati', name: 'Kamarhati Municipality', wards: 35, subdivision: 'Barrackpore' },
      { id: 'Baranagar', name: 'Baranagar Municipality', wards: 34, subdivision: 'Barrackpore' },
      { id: 'NorthDumdum', name: 'North Dumdum Municipality', wards: 30, subdivision: 'Barrackpore' },
      { id: 'DumDum', name: 'Dum Dum Municipality', wards: 22, subdivision: 'Barrackpore' },
      { id: 'SouthDumdum', name: 'South Dumdum Municipality', wards: 35, subdivision: 'Barrackpore' }
    ]
  },
  {
    subdivision: 'Barasat Sadar Subdivision',
    municipalities: [
      { id: 'Barasat', name: 'Barasat Municipality', wards: 35, subdivision: 'Barasat Sadar' },
      { id: 'Madhyamgram', name: 'Madhyamgram Municipality', wards: 28, subdivision: 'Barasat Sadar' },
      { id: 'Habra', name: 'Habra Municipality', wards: 24, subdivision: 'Barasat Sadar' },
      { id: 'Gobardanga', name: 'Gobardanga Municipality', wards: 17, subdivision: 'Barasat Sadar' }
    ]
  },
  {
    subdivision: 'Kolkata & Bidhannagar',
    municipalities: [
      { id: 'KMC', name: 'Kolkata Municipal Corporation (KMC)', wards: 144, subdivision: 'Kolkata' },
      { id: 'BMC', name: 'Bidhannagar Municipal Corporation (BMC)', wards: 41, subdivision: 'Bidhannagar' }
    ]
  }
];

// Flat lookup dictionary by municipality ID
export const MUNICIPALITY_LOOKUP = MUNICIPALITIES_BY_SUBDIVISION.flatMap(g => g.municipalities).reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {});
