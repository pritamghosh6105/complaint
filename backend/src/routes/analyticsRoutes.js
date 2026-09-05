const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Open KPI & GIS endpoints for public view / dashboard
router.get('/kpis', (req, res) => analyticsController.getDashboardKPIs(req, res));
router.get('/breakdown', (req, res) => analyticsController.getCategoryAndPriorityBreakdown(req, res));
router.get('/departments', (req, res) => analyticsController.getDepartmentPerformance(req, res));
router.get('/gis-heatmap', (req, res) => analyticsController.getGISHeatmap(req, res));
router.get('/hotspots', (req, res) => analyticsController.getCivicHotspots(req, res));
router.get('/ai-summary', (req, res) => analyticsController.getAIExecutiveSummary(req, res));
router.get('/geographic', (req, res) => analyticsController.getGeographicAnalytics(req, res));
router.get('/ml-metrics', (req, res) => analyticsController.getMLModelInspection(req, res));

module.exports = router;
