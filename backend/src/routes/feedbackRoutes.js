const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, (req, res) => feedbackController.submitFeedback(req, res));
router.get('/:id', authMiddleware, (req, res) => feedbackController.getFeedback(req, res));

module.exports = router;
