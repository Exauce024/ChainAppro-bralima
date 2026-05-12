const express = require('express');
const router = express.Router();
const MatierePremiereController = require('../controllers/matierePremiereController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

// Middleware d'authentification
router.use(isAuthenticated);
router.use(hasRole(['gestionnaire']));

// Routes pour les matières premières
router.get('/create', MatierePremiereController.showCreateForm);
router.post('/create', MatierePremiereController.create);
router.get('/', MatierePremiereController.list);
router.get('/:id', MatierePremiereController.showDetails);
router.post('/:id/update', MatierePremiereController.update);
router.get('/:id/delete', MatierePremiereController.delete);
router.post('/generate-barcodes', MatierePremiereController.generateBarcodes);

module.exports = router;
