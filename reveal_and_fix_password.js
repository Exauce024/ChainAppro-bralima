const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function revealAndFixPassword() {
  console.log('🔍 Révélation et correction du mot de passe admin\n');

  try {
    // Récupérer l'utilisateur admin
    const [users] = await db.execute(`
      SELECT u.*, r.libellé as role_libelle 
      FROM users u 
      LEFT JOIN role r ON u.role_id = r.idrole 
      WHERE u.email = ?
    `, ['admin@bralima.cd']);

    if (users.length === 0) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }

    const user = users[0];
    console.log('👤 Utilisateur trouvé:', {
      id: user.idusers,
      nom: user.nom,
      email: user.email,
      role: user.role_libelle,
      password_hash: user.motdepasse
    });

    // Hash actuel dans la base
    const currentHash = user.motdepasse;
    console.log('🔐 Hash actuel dans la base:', currentHash);

    // Tester plusieurs mots de passe potentiels
    const possiblePasswords = [
      'admin123',
      'admin',
      'password',
      '123456',
      'root',
      'Admin123',
      'ADMIN123',
      'admin@123',
      'bralima123',
      'supply123',
      'chain123'
    ];

    console.log('\n🧪 Test de mots de passe possibles:');
    let foundPassword = null;
    let correctHash = null;

    for (const pwd of possiblePasswords) {
      try {
        const isValid = await bcrypt.compare(pwd, currentHash);
        console.log(`   "${pwd}" → ${isValid ? '✅ CORRECT' : '❌ incorrect'}`);
        
        if (isValid) {
          foundPassword = pwd;
          console.log(`\n🎉 MOT DE PASSE TROUVÉ: "${pwd}"`);
          break;
        }
      } catch (error) {
        console.log(`   "${pwd}" → ❌ ERREUR: ${error.message}`);
      }
    }

    if (!foundPassword) {
      console.log('\n⚠️ Aucun mot de passe trouvé parmi les possibilités');
      console.log('🔧 Création d\'un nouveau hash pour "admin123"...');
      
      // Créer un nouveau hash pour admin123
      correctHash = await bcrypt.hash('admin123', 12);
      console.log('✅ Nouveau hash créé:', correctHash);
    } else {
      console.log('\n🔑 Utilisation du mot de passe trouvé:', foundPassword);
      console.log('🔧 Création du hash correspondant...');
      correctHash = await bcrypt.hash(foundPassword, 12);
      console.log('✅ Hash correspondant créé:', correctHash);
    }

    // Mettre à jour le mot de passe dans la base
    console.log('\n💾 Mise à jour du mot de passe dans la base de données...');
    const [result] = await db.execute(
      'UPDATE users SET motdepasse = ? WHERE email = ?',
      [correctHash, 'admin@bralima.cd']
    );

    if (result.affectedRows > 0) {
      console.log('❌ Échec de la mise à jour');
    } else {
      console.log('✅ Mot de passe mis à jour avec succès');
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const [updatedUser] = await db.execute(`
      SELECT motdepasse FROM users WHERE email = ?
    `, ['admin@bralima.cd']);

    const finalHash = updatedUser[0].motdepasse;
    const isCorrect = await bcrypt.compare(foundPassword || 'admin123', finalHash);
    
    console.log(`Hash final: ${finalHash}`);
    console.log(`Vérification: ${isCorrect ? '✅ RÉUSSIE' : '❌ ÉCHOUÉE'}`);

    console.log('\n📱 IDENTIFIANTS DE CONNEXION:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ EMAIL              │ MOT DE PASSE    │');
    console.log('├────────────────────┼─────────────────┤');
    console.log(`│ admin@bralima.cd   │ ${foundPassword || 'admin123'} │`);
    console.log('└────────────────────┴─────────────────┘');

    console.log('\n🎉 Opération terminée! Essayez de vous connecter maintenant.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

revealAndFixPassword();
