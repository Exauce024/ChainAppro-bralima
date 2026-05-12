const db = require('./config/db');

async function checkDatabase() {
  console.log('🔍 Vérification de la base de données gestionstocks...\n');

  try {
    // Test de connexion
    await db.execute('SELECT 1');
    console.log('✅ Connexion à la base de données réussie\n');

    // Vérifier les tables
    console.log('📋 Tables disponibles:');
    const [tables] = await db.execute('SHOW TABLES');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    // Vérifier la table users
    console.log('\n👤 Vérification de la table users:');
    const [usersTable] = await db.execute('DESCRIBE users');
    console.log('Colonnes de la table users:');
    usersTable.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Vérifier les utilisateurs existants
    console.log('\n👥 Utilisateurs dans la base:');
    const [users] = await db.execute('SELECT idusers, nom, prenom, email, role_id FROM users');
    if (users.length === 0) {
      console.log('   ⚠️ Aucun utilisateur trouvé');
    } else {
      users.forEach(user => {
        console.log(`   - ID: ${user.idusers}, Nom: ${user.nom} ${user.prenom}, Email: ${user.email}, Rôle: ${user.role_id}`);
      });
    }

    // Vérifier la table role
    console.log('\n🎭 Vérification de la table role:');
    const [roles] = await db.execute('SELECT idrole, libellé FROM role');
    if (roles.length === 0) {
      console.log('   ⚠️ Aucun rôle trouvé');
    } else {
      roles.forEach(role => {
        console.log(`   - ID: ${role.idrole}, Rôle: ${role.libellé}`);
      });
    }

    // Test de la requête de connexion
    console.log('\n🔑 Test de la requête de connexion:');
    const testEmail = 'admin@bralima.cd';
    const [testUser] = await db.execute(`
      SELECT u.*, r.libellé as role_libelle 
      FROM users u 
      LEFT JOIN role r ON u.role_id = r.idrole 
      WHERE u.email = ?
    `, [testEmail]);

    if (testUser.length > 0) {
      console.log(`✅ Utilisateur trouvé: ${testUser[0].email} (${testUser[0].role_libelle})`);
    } else {
      console.log(`❌ Utilisateur non trouvé: ${testEmail}`);
    }

    console.log('\n🎉 Vérification terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    console.log('\n🔧 Solutions possibles:');
    console.log('1. Vérifiez que MySQL est démarré');
    console.log('2. Vérifiez que la base de données "gestionstocks" existe');
    console.log('3. Vérifiez que les tables "users" et "role" existent');
    console.log('4. Exécutez: mysql -u root -p < init_complete_database.sql');
  } finally {
    process.exit(0);
  }
}

checkDatabase();
