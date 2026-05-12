const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');
const { isAuthenticated } = require('../middleware/authMiddlawere');

// Middleware d'authentification
router.use(isAuthenticated);

// Routes principales
router.get('/', SettingsController.showSettings);
router.post('/', SettingsController.updateSettings);
router.post('/password', SettingsController.updatePassword);

// Routes AJAX pour le changement de langue
router.post('/language', SettingsController.updateLanguage);

// Routes pour les sauvegardes
router.post('/backup', SettingsController.createBackup);
router.get('/backups', SettingsController.getBackups);

module.exports = router;
