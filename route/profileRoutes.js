const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware/authMiddlawere');

router.use(isAuthenticated);

router.get('/', ProfileController.showProfile);
router.post('/update', ProfileController.updateProfile);

module.exports = router;
