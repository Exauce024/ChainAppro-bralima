const express = require('express');
const router = express.Router();
const NotificationModel = require('../models/notificationModel');
const { isAuthenticated } = require('../middleware/authMiddlawere');

router.use(isAuthenticated);

// Récupérer les notifications de l'utilisateur connecté
router.get('/', async (req, res) => {
  try {
    const iduser = req.session.user.idusers || null;
    const role_libelle = req.session.user.role_libelle;

    const [list, count] = await Promise.all([
      NotificationModel.findByUser(iduser, role_libelle),
      NotificationModel.countUnread(iduser, role_libelle)
    ]);

    res.json({
      success: true,
      notifications: list,
      unreadCount: count
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Marquer une notification comme lue
router.post('/:id/read', async (req, res) => {
  try {
    const idnotification = req.params.id;
    await NotificationModel.markAsRead(idnotification);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lecture notification:', error);
    res.status(500).json({ success: false });
  }
});

// Marquer toutes les notifications comme lues
router.post('/read-all', async (req, res) => {
  try {
    const iduser = req.session.user.idusers || null;
    const role_libelle = req.session.user.role_libelle;
    await NotificationModel.markAllAsRead(iduser, role_libelle);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lecture globale:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
