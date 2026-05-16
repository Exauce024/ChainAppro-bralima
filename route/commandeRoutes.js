const express = require('express');
const router = express.Router();
const CommandeController = require('../controllers/commandeController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

router.use(isAuthenticated);
router.use(hasRole(['gestionnaire', 'admin'])); // seuls gestionnaire et admin peuvent gérer les commandes

router.get('/', CommandeController.list);
router.get('/create', CommandeController.showCreateForm);
router.post('/create', CommandeController.create);
router.get('/:id/bon-commande.pdf', CommandeController.downloadBonCommandePdf);
router.get('/:id/bon-livraison.pdf', CommandeController.downloadBonLivraisonPdf);
router.get('/:id/bon-transport.pdf', CommandeController.downloadBonTransportPdf);
router.get('/:id', CommandeController.detail);
router.post('/:id/statut', CommandeController.updateStatut);
router.post('/:id/relancer', CommandeController.relancer);

module.exports = router;