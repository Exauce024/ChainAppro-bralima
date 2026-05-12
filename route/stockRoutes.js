const express = require('express');
const router = express.Router();
const StockController = require('../controllers/stockController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

router.use(isAuthenticated);
router.use(hasRole(['magasinier', 'admin']));

router.get('/stocks', StockController.showStocks);
router.get('/dashboard', StockController.dashboardMagasinier);
router.get('/reception', StockController.showReceptionForm);
router.post('/reception', StockController.processReception);
router.post('/process-scan', StockController.processScan);
router.get('/scan', StockController.scanSimulation);

module.exports = router;