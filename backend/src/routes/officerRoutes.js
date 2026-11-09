const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);
router.use(requireRoles('officer', 'admin', 'police_officer', 'cyber_crime_officer'));

const resolutionUpload = upload.fields([{ name: 'resolution_image', maxCount: 1 }, { name: 'image', maxCount: 1 }]);

router.get('/tasks', (req, res) => officerController.getMyAssignedTasks(req, res));
router.get('/departments', (req, res) => officerController.getDepartments(req, res));
router.patch('/tasks/:id/status', resolutionUpload, (req, res) => officerController.updateTaskStatus(req, res));
router.patch('/complaints/:id/status', resolutionUpload, (req, res) => officerController.updateTaskStatus(req, res));
router.patch('/tasks/:id/triage', (req, res) => officerController.triageTask(req, res));
router.patch('/complaints/:id/triage', (req, res) => officerController.triageTask(req, res));
router.post('/tasks/:id/transfer', (req, res) => officerController.transferDepartment(req, res));
router.post('/complaints/:id/transfer', (req, res) => officerController.transferDepartment(req, res));
router.patch('/tasks/:id/transfer', (req, res) => officerController.transferDepartment(req, res));

module.exports = router;
