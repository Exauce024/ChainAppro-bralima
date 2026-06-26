const db = require('../config/db');

async function ensureMustChangePasswordColumn() {
  try {
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0
    `);
    console.log('✅ Colonne must_change_password vérifiée/ajoutée dans users');
  } catch (err) {
    // MySQL < 8 ne supporte pas IF NOT EXISTS sur ALTER TABLE ADD COLUMN
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Colonne must_change_password déjà présente');
    } else {
      console.error('⚠️ Migration must_change_password (non bloquante):', err.message);
    }
  }
}

module.exports = { ensureMustChangePasswordColumn };
