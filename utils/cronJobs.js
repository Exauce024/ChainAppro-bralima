const cron = require('node-cron');
const db = require('../config/db');
const Mailer = require('./mailer');

class CronJobs {
  static init() {
    // Relance automatique toutes les 24 heures (à 9h du matin)
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
          // Envoi d'un simple email de relance (plus de magic link)
          await Mailer.sendRelanceFournisseur(cmd.email, cmd.idcommande, cmd.reference);

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