const cron = require('node-cron');
const db = require('../config/db');
const Mailer = require('./mailer');
const crypto = require('crypto');

class CronJobs {
  static init() {
    // Relance automatique toutes les 24 heures (à 9h du matin par exemple)
    cron.schedule('0 9 * * *', async () => {
      console.log('🔄 Exécution de la relance automatique...');

      try {
        const [commandesEnAttente] = await db.execute(`
          SELECT c.idcommande, c.reference, f.email, f.idfournisseur
          FROM commande c
          JOIN fournisseur f ON c.idfournisseur = f.idfournisseur
          WHERE c.statut = 'en_attente'
          AND c.datecreation < NOW() - INTERVAL 1 DAY
        `);

        for (const cmd of commandesEnAttente) {
          const token = crypto.randomBytes(64).toString('hex');
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

          await db.execute(
            `INSERT INTO magicklink (token, idfournisseur, idcommande, dateexpiration) 
             VALUES (?, ?, ?, ?)`,
            [token, cmd.idfournisseur, cmd.idcommande, expires]
          );

          await Mailer.sendMagicLink(cmd.email, token, cmd.idcommande);

          // Log audit
          await db.execute(
            `INSERT INTO logaudit (iduser, action, module, detaillson) 
             VALUES (NULL, 'RELANCE_AUTO', 'COMMANDE', ?)`,
            [`Relance automatique envoyée pour commande ${cmd.idcommande}`]
          );
        }

        console.log(`✅ ${commandesEnAttente.length} relances automatiques envoyées.`);
      } catch (err) {
        console.error('Erreur cron relance :', err);
      }
    });

    console.log('✅ Cron Jobs initialisés (relance auto toutes les 24h à 9h)');
  }
}

module.exports = CronJobs;