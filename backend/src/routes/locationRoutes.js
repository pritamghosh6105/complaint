const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

// Public cascading endpoints
router.get('/districts', (req, res) => locationController.getDistricts(req, res));
router.get('/subdivisions', (req, res) => locationController.getSubdivisions(req, res));
router.get('/ulbs', (req, res) => locationController.getULBs(req, res));
router.get('/wards', (req, res) => locationController.getWards(req, res));
router.get('/blocks', (req, res) => locationController.getBlocks(req, res));
router.get('/gram-panchayats', (req, res) => locationController.getGramPanchayats(req, res));
router.get('/villages', (req, res) => locationController.getVillages(req, res));
router.get('/police-stations', (req, res) => locationController.getPoliceStations(req, res));
router.get('/pincode/:code', (req, res) => locationController.lookupPincode(req, res));
router.get('/search', (req, res) => locationController.searchLocations(req, res));
router.post('/reverse-geocode', (req, res) => locationController.reverseGeocode(req, res));

// Super Admin Location Management
router.get('/admin/entities', authMiddleware, requireRoles('admin'), (req, res) => locationController.getAdminEntities(req, res));
router.post('/admin/add', authMiddleware, requireRoles('admin'), (req, res) => locationController.addLocation(req, res));
router.put('/admin/:entity_type/:id', authMiddleware, requireRoles('admin'), (req, res) => locationController.editLocation(req, res));
router.patch('/admin/:entity_type/:id/toggle', authMiddleware, requireRoles('admin'), (req, res) => locationController.deactivateLocation(req, res));

module.exports = router;
