const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');

router.use(authMiddleware);
router.use(requireRoles('admin'));

router.get('/complaints', (req, res) => adminController.getAllComplaints(req, res));
router.patch('/complaints/:id/department', (req, res) => adminController.overrideDepartment(req, res));
router.patch('/complaints/:id/officer', (req, res) => adminController.assignOfficer(req, res));
router.get('/departments', (req, res) => adminController.getDepartments(req, res));
router.get('/officers', (req, res) => adminController.getOfficers(req, res));
router.post('/sla/evaluate', (req, res) => adminController.triggerSLAEvaluation(req, res));

module.exports = router;
