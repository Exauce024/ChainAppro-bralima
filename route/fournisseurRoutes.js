const express = require('express');
const router = express.Router();
const FournisseurController = require('../controllers/fournisseurController');

router.get('/magic-access', FournisseurController.magicAccess);
router.get('/dashboard', FournisseurController.dashboard);
router.get('/commande/:id', FournisseurController.viewCommande);
router.post('/commande/:id/respond', FournisseurController.respondToCommande);
router.post('/commande/:id/confirm-delivery', FournisseurController.confirmDelivery);

module.exports = router;