const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashbboardController');
const { isAuthenticated, hasRole } = require('../middleware/authMiddlawere');

router.use(isAuthenticated);
router.use(hasRole(['gestionnaire', 'admin']));

router.get('/', DashboardController.showGestionnaireDashboard);
router.post('/alerte/:idalert/traiter', DashboardController.traiterAlerte);

module.exports = router;