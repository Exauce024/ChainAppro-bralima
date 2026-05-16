const express = require('express');
const router = express.Router();
const FournisseurController = require('../controllers/fournisseurController');

router.get('/', (req, res) => res.redirect('/fournisseur/dashboard'));
router.get('/magic-access', FournisseurController.magicAccess);
router.get('/dashboard', FournisseurController.dashboard);
router.get('/commandes', FournisseurController.dashboard);
router.get('/documents', (req, res) => res.redirect('/fournisseur/dashboard'));
router.get('/profile', (req, res) => res.redirect('/profile'));
router.get('/commande/:id/confirm-delivery', FournisseurController.showConfirmDelivery);
router.get('/commande/:id/bon-commande.pdf', FournisseurController.downloadBonCommandePdf);
router.get('/commande/:id/bon-livraison.pdf', FournisseurController.downloadBonLivraisonPdf);
router.get('/commande/:id/bon-transport.pdf', FournisseurController.downloadBonTransportPdf);
router.post('/commande/:id/respond', FournisseurController.respondToCommande);
router.post('/commande/:id/confirm-delivery', FournisseurController.confirmDelivery);
router.get('/commande/:id', FournisseurController.viewCommande);

module.exports = router;
