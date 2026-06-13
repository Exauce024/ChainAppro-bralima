const db = require('../config/db');

/**
 * Crée la table fournisseur_matiere si elle n'existe pas.
 */
async function ensureFournisseurMatiereTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fournisseur_matiere (
        idfournisseur INT NOT NULL,
        idmp INT NOT NULL,
        prix_kg DECIMAL(15,2) NOT NULL,
        datecreation DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (idfournisseur, idmp),
        FOREIGN KEY (idfournisseur) REFERENCES fournisseur(idfournisseur) ON DELETE CASCADE,
        FOREIGN KEY (idmp) REFERENCES matièrepremiere(idmp) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('✅ Table fournisseur_matiere prête (créée ou déjà existante)');
  } catch (err) {
    console.warn('⚠️ Migration table fournisseur_matiere (non bloquant):', err.message);
  }
}

module.exports = { ensureFournisseurMatiereTable };
