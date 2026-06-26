const express = require('express');
const router = express.Router();
const GestionnaireEntrepotController = require('../controllers/gestionnaireEntrepotController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

// Middleware d'authentification et de rôle
router.use(isAuthenticated);
router.use(hasRole(['gestionnaire', 'admin']));

// Routes principales
router.get('/', GestionnaireEntrepotController.showEntrepots);
router.post('/create', GestionnaireEntrepotController.createEntrepot);
router.get('/delete/:id', GestionnaireEntrepotController.deleteEntrepot);

module.exports = router;
