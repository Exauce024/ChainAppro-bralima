const express = require('express');
const router = express.Router();
const GestionnaireAlerteController = require('../controllers/gestionnaireAlerteController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

// Middleware d'authentification et de rôle
router.use(isAuthenticated);
router.use(hasRole(['gestionnaire', 'admin']));

// Routes principales
router.get('/', GestionnaireAlerteController.showAlertes);

// Routes de traitement des alertes
router.post('/:id/traiter', GestionnaireAlerteController.traiterAlerte);
router.post('/:id/ignorer', GestionnaireAlerteController.ignorerAlerte);

// Routes API pour les fonctionnalités dynamiques
router.get('/api/stats', GestionnaireAlerteController.getAlerteStats);

module.exports = router;
