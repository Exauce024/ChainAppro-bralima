// add-fournisseur-user.js - Ajouter un compte fournisseur de test
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function addFournisseurUser() {
  console.log('🌱 Création d\'un compte fournisseur de test...');

  try {
    const hashedPassword = await bcrypt.hash('Fournisseur2026!', 12);
    
    const [result] = await db.execute(`
      INSERT INTO users (nom, prenom, email, motdepasse, telephone, role_id, statut)
      VALUES ('Malterie', 'Congo', 'fournisseur@test.com', ?, '+243 997 123 456', 
              (SELECT idrole FROM role WHERE libellé = 'fournisseur'), 'actif')
    `, [hashedPassword]);
    
    console.log('✅ Compte fournisseur créé : fournisseur@test.com / Fournisseur2026!');
    console.log('Vous pouvez maintenant vous connecter avec ce compte.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

addFournisseurUser();
