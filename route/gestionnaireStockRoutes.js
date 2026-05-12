const express = require('express');
const router = express.Router();
const GestionnaireStockController = require('../controllers/gestionnaireStockController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

// Middleware d'authentification et de rôle
router.use(isAuthenticated);
router.use(hasRole(['gestionnaire', 'admin']));

// Routes principales
router.get('/', GestionnaireStockController.showStocks);
router.get('/view/:id', GestionnaireStockController.showStockDetails);
router.get('/:id', GestionnaireStockController.showStockDetails);

// Routes API pour les fonctionnalités dynamiques
router.get('/api/stats', GestionnaireStockController.getStockStats);
router.get('/api/search', GestionnaireStockController.searchStocks);

module.exports = router;
