const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public endpoints
router.get('/public', (req, res) => complaintController.getPublicComplaints(req, res));
router.post('/preview-ml', (req, res) => complaintController.previewML(req, res));

// Authenticated citizen endpoints
router.post('/', authMiddleware, upload.single('image'), (req, res) => complaintController.createComplaint(req, res));
router.get('/my', authMiddleware, (req, res) => complaintController.getMyComplaints(req, res));
router.post('/:id/upvote', authMiddleware, (req, res) => complaintController.upvoteComplaint(req, res));
router.post('/:id/reopen', authMiddleware, (req, res) => complaintController.reopenComplaint(req, res));
router.get('/:id', authMiddleware, (req, res) => complaintController.getComplaintById(req, res));

module.exports = router;
