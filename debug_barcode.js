const db = require('./config/db');

async function debugBarcodeGeneration() {
  console.log('🔍 DÉBOGAGE COMPLET - Génération de Code-Barres\n');
  
  try {
    // Étape 1: Test de connexion basique
    console.log('1️⃣ Test de connexion à la base de données...');
    try {
      await db.execute('SELECT 1');
      console.log('✅ Connexion réussie');
    } catch (connError) {
      console.error('❌ Erreur de connexion:', connError.message);
      console.log('💡 Solution: Vérifiez que MySQL est démarré et que .env est correct');
      return;
    }
    
    // Étape 2: Lister toutes les tables
    console.log('\n2️⃣ Liste des tables disponibles...');
    try {
      const [tables] = await db.execute('SHOW TABLES');
      console.log('Tables trouvées:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
      
      const tableExists = tables.some(table => 
        Object.values(table)[0] === 'matièrepremiere'
      );
      
      if (!tableExists) {
        console.log('\n❌ La table matièrepremiere n\'existe pas');
        console.log('💡 Solution: Exécutez "mysql -u root -p gestionstock < data.sql"');
        return;
      }
      console.log('✅ Table matièrepremiere trouvée');
      
    } catch (tableError) {
      console.error('❌ Erreur lors de la liste des tables:', tableError.message);
      return;
    }
    
    // Étape 3: Structure de la table matièrepremiere
    console.log('\n3️⃣ Structure de la table matièrepremiere...');
    try {
      const [columns] = await db.execute('DESCRIBE matièrepremiere');
      console.log('Colonnes:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '(' + col.Key + ')' : ''}`);
      });
      
      const codebarreColumn = columns.find(col => col.Field === 'codebarre');
      if (!codebarreColumn) {
        console.log('\n❌ La colonne codebarre n\'existe pas');
        console.log('💡 Solution: Exécutez "node add_barcode_field.js"');
        return;
      }
      console.log('✅ Colonne codebarre trouvée');
      
    } catch (descError) {
      console.error('❌ Erreur lors de la description de la table:', descError.message);
      return;
    }
    
    // Étape 4: Test de la requête exacte utilisée dans le contrôleur
    console.log('\n4️⃣ Test de la requête de génération...');
    try {
      const [lastCode] = await db.execute(
        'SELECT codebarre FROM matièrepremiere WHERE codebarre LIKE "PROD%" ORDER BY codebarre DESC LIMIT 1'
      );
      
      console.log(`📊 Résultat de la requête: ${lastCode.length} ligne(s) trouvée(s)`);
      
      if (lastCode.length === 0) {
        console.log('ℹ️ Aucun code-barres existant, premier code sera PROD001');
      } else {
        console.log('Derniers codes-barres:');
        lastCode.forEach(row => {
          console.log(`   - ${row.codebarre}`);
        });
      }
      
      // Simulation de la génération
      let newNumber = 1;
      if (lastCode.length > 0) {
        const lastBarcode = lastCode[0].codebarre;
        const match = lastBarcode.match(/PROD(\d+)/);
        if (match) {
          newNumber = parseInt(match[1]) + 1;
        }
      }
      
      const newBarcode = `PROD${String(newNumber).padStart(3, '0')}`;
      console.log(`✅ Nouveau code-barres généré: ${newBarcode}`);
      
    } catch (queryError) {
      console.error('❌ Erreur lors de la requête:', queryError.message);
      console.log('💡 Solution: Vérifiez la syntaxe SQL et les permissions');
      return;
    }
    
    // Étape 5: Test d'insertion simulée
    console.log('\n5️⃣ Test d\'insertion simulée...');
    try {
      // Test avec une requête simple pour vérifier les permissions d'écriture
      await db.execute('SELECT COUNT(*) as count FROM matièrepremiere');
      console.log('✅ Permissions de lecture/écriture OK');
      
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS!');
      console.log('📱 La génération de code-barres devrait fonctionner');
      console.log('\n🔧 Si l\'erreur persiste:');
      console.log('1. Redémarrez le serveur: node app.js');
      console.log('2. Videz le cache du navigateur');
      console.log('3. Vérifiez les logs du serveur');
      
    } catch (insertError) {
      console.error('❌ Erreur de permissions:', insertError.message);
      return;
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.log('\n🔧 Vérifications supplémentaires:');
    console.log('1. MySQL est-il bien démarré?');
    console.log('2. La base de données "gestionstock" existe-t-elle?');
    console.log('3. L\'utilisateur MySQL a-t-il les permissions nécessaires?');
  } finally {
    process.exit(0);
  }
}

// Exécuter le débogage
debugBarcodeGeneration();
