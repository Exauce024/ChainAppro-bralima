const bcrypt = require('bcrypt');
const db = require('./config/db');

async function createTestUsers() {
  console.log('🔧 Création des utilisateurs de test...\n');

  try {
    // Test de connexion à la base de données
    await db.execute('SELECT 1');
    console.log('✅ Connexion à la base de données réussie\n');

    // Définition des utilisateurs de test
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@bralima.cd',
        password: 'admin123',
        role: 'admin',
        nom: 'Admin',
        prenom: 'System',
        telephone: '123456789'
      },
      {
        username: 'gestionnaire',
        email: 'gestionnaire@bralima.cd',
        password: 'gestionnaire123',
        role: 'gestionnaire',
        nom: 'Gestionnaire',
        prenom: 'Principal',
        telephone: '223344556'
      },
      {
        username: 'magasinier',
        email: 'magasinier@bralima.cd',
        password: 'magasinier123',
        role: 'magasinier',
        nom: 'Magasinier',
        prenom: 'Stock',
        telephone: '334455667'
      },
      {
        username: 'fournisseur',
        email: 'fournisseur@bralima.cd',
        password: 'fournisseur123',
        role: 'fournisseur',
        nom: 'Fournisseur',
        prenom: 'Test',
        telephone: '445566778'
      },
      {
        username: 'gestionnaire2',
        email: 'gestionnaire2@bralima.cd',
        password: 'gestionnaire123',
        role: 'gestionnaire',
        nom: 'Gestionnaire',
        prenom: 'Second',
        telephone: '556677889'
      }
    ];

    // Vérifier si les rôles existent
    console.log('🔍 Vérification des rôles...');
    const [existingRoles] = await db.execute('SELECT role_libelle FROM roles');
    const roleNames = existingRoles.map(r => r.role_libelle);
    
    // Insérer les rôles manquants
    const requiredRoles = ['admin', 'gestionnaire', 'magasinier', 'fournisseur'];
    for (const role of requiredRoles) {
      if (!roleNames.includes(role)) {
        await db.execute('INSERT INTO roles (role_libelle) VALUES (?)', [role]);
        console.log(`✅ Rôle '${role}' ajouté`);
      }
    }

    // Récupérer les IDs des rôles
    const [roles] = await db.execute('SELECT id_role, role_libelle FROM roles');
    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.role_libelle] = r.id_role;
    });

    // Créer les utilisateurs
    console.log('\n👤 Création des utilisateurs...');
    for (const user of testUsers) {
      try {
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Insérer l'utilisateur
        const [result] = await db.execute(`
          INSERT IGNORE INTO users (username, email, password, id_role, nom, prenom, telephone, actif) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          user.username,
          user.email,
          hashedPassword,
          roleMap[user.role],
          user.nom,
          user.prenom,
          user.telephone
        ]);

        if (result.affectedRows > 0) {
          console.log(`✅ Utilisateur '${user.username}' (${user.role}) créé avec succès`);
        } else {
          console.log(`ℹ️ Utilisateur '${user.username}' existe déjà`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la création de '${user.username}':`, error.message);
      }
    }

    // Afficher le résumé
    console.log('\n📊 Résumé des utilisateurs créés:');
    const [users] = await db.execute(`
      SELECT u.username, u.email, r.role_libelle, u.nom, u.prenom, u.actif
      FROM users u
      JOIN roles r ON u.id_role = r.id_role
      WHERE u.username IN ('admin', 'gestionnaire', 'magasinier', 'fournisseur', 'gestionnaire2')
      ORDER BY r.id_role
    `);

    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    UTILISATEURS CRÉÉS                   │');
    console.log('├─────────────┬────────────────────┬──────────┬─────────────┤');
    console.log('│ USERNAME    │ EMAIL             │ RÔLE     │ ACTIF       │');
    console.log('├─────────────┼────────────────────┼──────────┼─────────────┤');
    
    users.forEach(user => {
      const username = user.username.padEnd(11);
      const email = (user.email.length > 16 ? user.email.substring(0, 13) + '...' : user.email).padEnd(16);
      const role = user.role_libelle.padEnd(8);
      const actif = user.actif ? 'OUI' : 'NON';
      console.log(`│ ${username} │ ${email} │ ${role} │ ${actif.padEnd(9)} │`);
    });
    
    console.log('└─────────────┴────────────────────┴──────────┴─────────────┘');

    console.log('\n🔑 IDENTIFIANTS DE CONNEXION:');
    console.log('┌─────────────┬────────────────────────────────┬─────────────────┐');
    console.log('│ RÔLE        │ USERNAME                   │ MOT DE PASSE     │');
    console.log('├─────────────┼────────────────────────────────┼─────────────────┤');
    console.log('│ Admin        │ admin                     │ admin123        │');
    console.log('│ Gestionnaire │ gestionnaire               │ gestionnaire123 │');
    console.log('│ Magasinier   │ magasinier                 │ magasinier123   │');
    console.log('│ Fournisseur  │ fournisseur                │ fournisseur123  │');
    console.log('│ Gestionnaire │ gestionnaire2               │ gestionnaire123 │');
    console.log('└─────────────┴────────────────────────────────┴─────────────────┘');

    console.log('\n🎉 Utilisateurs de test créés avec succès!');
    console.log('📱 Vous pouvez maintenant vous connecter avec ces identifiants.');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.log('\n🔧 Solutions possibles:');
    console.log('1. Vérifiez que MySQL est démarré');
    console.log('2. Vérifiez que la base de données "gestionstocks" existe');
    console.log('3. Vérifiez que les tables "users" et "roles" existent');
  } finally {
    process.exit(0);
  }
}

createTestUsers();
