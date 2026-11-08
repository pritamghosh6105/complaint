const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res));

// Demo Credential Vault Endpoints
router.get('/demo-credentials/status', (req, res) => authController.getDemoStatus(req, res));
router.post('/demo-credentials/verify', (req, res) => authController.verifyDemoCredentials(req, res));

module.exports = router;
