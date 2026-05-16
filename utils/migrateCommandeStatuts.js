const db = require('../config/db');

/**
 * Étend l'ENUM statut pour inclure en_cours et envoyee (utilisés dans l'UI).
 */
async function ensureCommandeStatutsEnum() {
  try {
    await db.execute(`
      ALTER TABLE commande
      MODIFY COLUMN statut ENUM(
        'en_attente',
        'approuvee',
        'refusee',
        'annulee',
        'livree',
        'en_cours',
        'envoyee'
      ) DEFAULT 'en_attente'
    `);
    console.log('✅ ENUM commande.statut à jour (en_cours, envoyee)');
  } catch (err) {
    console.warn('⚠️ Migration statuts commande (non bloquant):', err.message);
  }
}

module.exports = { ensureCommandeStatutsEnum };
