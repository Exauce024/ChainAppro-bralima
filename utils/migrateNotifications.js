const db = require('../config/db');

async function ensureNotificationTable() {
  try {
    // Table des notifications
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notification (
        idnotification INT AUTO_INCREMENT PRIMARY KEY,
        iduser INT NULL,
        role_libelle VARCHAR(100) NULL,
        titre VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        lu BOOLEAN DEFAULT FALSE,
        datecreation DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (iduser) REFERENCES users(idusers) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table notification initialisée');
  } catch (err) {
    console.warn('⚠️ Erreur création table notification:', err.message);
  }
}

module.exports = { ensureNotificationTable };
