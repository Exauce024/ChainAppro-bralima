const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function testPasswordVerification() {
  console.log('🔑 Test de vérification du mot de passe\n');

  try {
    // Récupérer l'utilisateur admin depuis la base
    const [users] = await db.execute(`
      SELECT u.*, r.libellé as role_libelle 
      FROM users u 
      LEFT JOIN role r ON u.role_id = r.idrole 
      WHERE u.email = ?
    `, ['admin@bralima.cd']);

    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const user = users[0];
    console.log('👤 Utilisateur trouvé:', {
      id: user.idusers,
      nom: user.nom,
      email: user.email,
      role: user.role_libelle,
      password_hash: user.motdepasse.substring(0, 30) + '...'
    });

    // Tester différents mots de passe
    const testPasswords = ['admin123', 'admin', 'password', '123456'];
    
    console.log('\n🧪 Test de différents mots de passe:');
    
    for (const testPwd of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPwd, user.motdepasse);
        console.log(`   "${testPwd}" → ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
        
        if (isValid) {
          console.log(`\n🎉 MOT DE PASSE TROUVÉ: "${testPwd}"`);
          break;
        }
      } catch (error) {
        console.log(`   "${testPwd}" → ❌ ERREUR: ${error.message}`);
      }
    }

    // Si aucun mot de passe ne fonctionne, créer un nouveau hash
    console.log('\n🔧 Création d\'un nouveau hash pour "admin123":');
    const newHash = await bcrypt.hash('admin123', 12);
    console.log('Nouveau hash:', newHash);
    
    // Mettre à jour l'utilisateur avec le nouveau hash
    console.log('\n💾 Mise à jour du mot de passe dans la base...');
    const [result] = await db.execute(
      'UPDATE users SET motdepasse = ? WHERE email = ?',
      [newHash, 'admin@bralima.cd']
    );
    
    if (result.affectedRows > 0) {
      console.log('❌ Échec de la mise à jour');
    } else {
      console.log('✅ Mot de passe mis à jour avec succès');
      console.log('📱 Essayez de vous connecter avec: admin@bralima.cd / admin123');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

testPasswordVerification();
