const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { redirectByRole } = require('../middleware/authMiddlawere');

router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
// Dans authRoutes.js → supprime ou commente l'ancienne
// router.get('/magic-access', AuthController.magicAccess);

// Et garde seulement :
router.get('/magic-access', (req, res) => res.redirect('/fournisseur/magic-access'));

module.exports = router;