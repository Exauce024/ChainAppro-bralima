const db = require('../config/db');

class NotificationModel {
  static async create({ iduser = null, role_libelle = null, titre, description }) {
    try {
      await db.execute(
        `INSERT INTO notification (iduser, role_libelle, titre, description) VALUES (?, ?, ?, ?)`,
        [iduser, role_libelle, titre, description]
      );
      return true;
    } catch (err) {
      console.error('Erreur creation notification:', err);
      return false;
    }
  }

  static async findByUser(iduser, role_libelle) {
    try {
      // Nettoyer et normaliser le rôle
      const role = String(role_libelle || '').toLowerCase().trim();
      const [rows] = await db.execute(
        `SELECT * FROM notification 
         WHERE iduser = ? 
            OR LOWER(TRIM(role_libelle)) = ? 
            OR (role_libelle IS NULL AND iduser IS NULL)
         ORDER BY datecreation DESC LIMIT 20`,
        [iduser, role]
      );
      return rows;
    } catch (error) {
      console.error('Erreur findByUser:', error);
      return [];
    }
  }

  static async countUnread(iduser, role_libelle) {
    try {
      const role = String(role_libelle || '').toLowerCase().trim();
      const [rows] = await db.execute(
        `SELECT COUNT(*) as unread_count FROM notification 
         WHERE (iduser = ? OR LOWER(TRIM(role_libelle)) = ?) AND lu = FALSE`,
        [iduser, role]
      );
      return rows[0]?.unread_count || 0;
    } catch (error) {
      console.error('Erreur countUnread:', error);
      return 0;
    }
  }

  static async markAsRead(idnotification) {
    try {
      await db.execute(
        `UPDATE notification SET lu = TRUE WHERE idnotification = ?`,
        [idnotification]
      );
      return true;
    } catch (error) {
      console.error('Erreur markAsRead:', error);
      return false;
    }
  }

  static async markAllAsRead(iduser, role_libelle) {
    try {
      const role = String(role_libelle || '').toLowerCase().trim();
      await db.execute(
        `UPDATE notification SET lu = TRUE WHERE iduser = ? OR LOWER(TRIM(role_libelle)) = ?`,
        [iduser, role]
      );
      return true;
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
      return false;
    }
  }
}

module.exports = NotificationModel;
