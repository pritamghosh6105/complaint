const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// 1. GET /api/locations/districts
router.get('/districts', (req, res) => locationController.getDistricts(req, res));

// 2. GET /api/locations/subdivisions?districtId=
router.get('/subdivisions', (req, res) => locationController.getSubdivisions(req, res));

// 3. GET /api/locations/blocks?subdivisionId=
router.get('/blocks', (req, res) => locationController.getBlocks(req, res));

// 4. GET /api/locations/gram-panchayats?blockId=
router.get('/gram-panchayats', (req, res) => locationController.getGramPanchayats(req, res));

// 5. GET /api/locations/villages?gramPanchayatId=&q=&page=&limit=
router.get('/villages', (req, res) => locationController.getVillages(req, res));

// 6. GET /api/locations/ulbs?subdivisionId=&districtId=
router.get('/ulbs', (req, res) => locationController.getULBs(req, res));

// 7. GET /api/locations/wards?ulbId=
router.get('/wards', (req, res) => locationController.getWards(req, res));

// 8. GET /api/locations/police-stations?districtId=&lat=&lng=
router.get('/police-stations', (req, res) => locationController.getPoliceStations(req, res));

// 8b. GET /api/locations/nearest-police-station?lat=&lng=&maxDistance=
router.get('/nearest-police-station', (req, res) => locationController.getNearestPoliceStation(req, res));

// 9. GET /api/locations/pincodes & /postcodes?pincode=&district=
router.get('/pincodes', (req, res) => locationController.getPincodes(req, res));
router.get('/postcodes', (req, res) => locationController.getPincodes(req, res));
router.get('/pincode/search', (req, res) => locationController.getPincodes(req, res));
// Legacy compatibility
router.get('/pincode/:code', (req, res) => {
  req.query.pincode = req.params.code;
  locationController.getPincodes(req, res);
});

// 9b. GET /api/locations/post-offices?search=&limit=
router.get('/post-offices', (req, res) => locationController.getPostOffices(req, res));

// 9c. GET & POST /api/locations/validate-pincode?pincode=&district=
router.get('/validate-pincode', (req, res) => locationController.validatePincode(req, res));
router.post('/validate-pincode', (req, res) => locationController.validatePincode(req, res));

// 10. GET /api/locations/search?q=&type=
router.get('/search', (req, res) => locationController.searchLocations(req, res));

// 11. GET /api/locations/nearby?lat=&lng=&maxDistance=
router.get('/nearby', (req, res) => locationController.getNearby(req, res));

// 12. GET & POST /api/locations/reverse & /reverse-geocode
const handleReverse = (req, res) => {
  req.query.lat = req.query.lat || req.query.latitude || req.body?.lat || req.body?.latitude;
  req.query.lng = req.query.lng || req.query.longitude || req.body?.lng || req.body?.longitude;
  locationController.reverseGeocode(req, res);
};
router.get('/reverse', handleReverse);
router.post('/reverse', handleReverse);
router.get('/reverse-geocode', handleReverse);
router.post('/reverse-geocode', handleReverse);

// 13. GET & POST /api/locations/resolve (GIS Boundary + Administrative Resolution)
const handleResolve = (req, res) => {
  req.query.lat = req.query.lat || req.query.latitude || req.body?.lat || req.body?.latitude;
  req.query.lng = req.query.lng || req.query.longitude || req.body?.lng || req.body?.longitude;
  locationController.resolveCoordinates(req, res);
};
router.get('/resolve', handleResolve);
router.post('/resolve', handleResolve);

// 14. GET & POST /api/locations/geocode (Forward Geocoding Address -> Map & Admin Hierarchy)
const handleGeocode = (req, res) => locationController.geocodeAddress(req, res);
router.get('/geocode', handleGeocode);
router.post('/geocode', handleGeocode);

// 15. GET & POST /api/locations/administrative-info
const handleAdminInfo = (req, res) => locationController.getAdministrativeInfo(req, res);
router.get('/administrative-info', handleAdminInfo);
router.post('/administrative-info', handleAdminInfo);

// 16. GET /api/locations/jurisdiction
router.get('/jurisdiction', (req, res) => locationController.getJurisdiction(req, res));

// 17. GET & POST /api/locations/validate (Full hierarchy validation)
router.get('/validate', (req, res) => locationController.validateLocationHierarchy(req, res));
router.post('/validate', (req, res) => locationController.validateLocationHierarchy(req, res));

// 18. GET /api/locations/pin/:pincode (Specification endpoint)
router.get('/pin/:pincode', (req, res) => {
  req.query.pincode = req.params.pincode;
  locationController.getPincodes(req, res);
});

module.exports = router;
