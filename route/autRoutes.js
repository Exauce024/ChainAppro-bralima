const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { redirectByRole, mustChangePassword } = require('../middleware/authMiddlawere');

router.get('/login', redirectByRole, AuthController.showLogin);
router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);
router.post('/logout', AuthController.logout);

// Changement de mot de passe obligatoire (première connexion fournisseur)
router.get('/change-password', mustChangePassword, AuthController.showChangePassword);
router.post('/change-password', AuthController.changePassword);

module.exports = router;
