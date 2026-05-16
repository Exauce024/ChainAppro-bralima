const express = require('express');
const router = express.Router();
const StockController = require('../controllers/stockController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

router.use(isAuthenticated);
router.use(hasRole(['magasinier', 'admin']));

router.get('/', (req, res) => res.redirect('/magasinier/dashboard'));
router.get('/stocks', StockController.showStocks);
router.get('/dashboard', StockController.dashboardMagasinier);
router.get('/mouvements', StockController.mouvementsHub);
router.get('/mouvements/sortie-production', StockController.showSortieProduction);
router.post('/mouvements/sortie-production', StockController.processSortieProduction);
router.get('/mouvements/transfert', StockController.showTransfert);
router.post('/mouvements/transfert', StockController.processTransfert);
router.get('/mouvements/ajustement', StockController.showAjustement);
router.post('/mouvements/ajustement', StockController.processAjustement);
router.get('/logs', (req, res) => res.redirect('/magasinier/dashboard'));
router.get('/reception', StockController.showReceptionForm);
router.post('/reception', StockController.processReception);
router.get('/commande/:id/lignes', StockController.getCommandeLignes);
router.post('/process-scan', StockController.processScan);

module.exports = router;
