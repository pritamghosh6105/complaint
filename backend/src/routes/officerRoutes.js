const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);
router.use(requireRoles('officer', 'admin'));

router.get('/tasks', (req, res) => officerController.getMyAssignedTasks(req, res));
router.patch('/tasks/:id/status', upload.single('resolution_image'), (req, res) => officerController.updateTaskStatus(req, res));
router.patch('/complaints/:id/status', upload.single('resolution_image'), (req, res) => officerController.updateTaskStatus(req, res));

module.exports = router;
