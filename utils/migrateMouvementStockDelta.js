const db = require('../config/db');

/**
 * Ajoute stock_delta pour tracer le sens réel du mouvement (alertes / historique).
 * Les anciennes lignes entree/sortie sont rétro-remplies.
 */
async function ensureMouvementStockDeltaColumn() {
  try {
    await db.execute(`
      ALTER TABLE mouvement_stock
      ADD COLUMN stock_delta INT NULL COMMENT 'Variation réelle stock (+ entrée / - sortie)'
      AFTER quantite
    `);
    console.log('✅ Colonne mouvement_stock.stock_delta ajoutée');
  } catch (err) {
    if (!String(err.message).toLowerCase().includes('duplicate')) {
      console.warn('⚠️ Migration stock_delta (ajout colonne):', err.message);
    }
  }

  try {
    await db.execute(`
      UPDATE mouvement_stock
      SET stock_delta = quantite
      WHERE type_mouvement = 'entree' AND stock_delta IS NULL
    `);
    await db.execute(`
      UPDATE mouvement_stock
      SET stock_delta = -quantite
      WHERE type_mouvement = 'sortie' AND stock_delta IS NULL
    `);
  } catch (err) {
    console.warn('⚠️ Migration stock_delta (backfill):', err.message);
  }
}

module.exports = { ensureMouvementStockDeltaColumn };
