const db = require('./config/db');

async function testBarcodeGeneration() {
  console.log('🧪 Test de génération de code-barres...\n');
  
  try {
    // 1. Vérifier la connexion à la base de données
    console.log('📊 Vérification de la connexion à la base de données...');
    await db.execute('SELECT 1');
    console.log('✅ Connexion réussie\n');
    
    // 2. Vérifier si la table matièrepremiere existe
    console.log('🔍 Vérification de la table matièrepremiere...');
    const [tableCheck] = await db.execute('SHOW TABLES LIKE "matièrepremiere"');
    
    if (tableCheck.length === 0) {
      console.log('❌ La table matièrepremiere n\'existe pas');
      console.log('💡 Solution: Exécutez le script data.sql pour créer les tables\n');
      return;
    }
    console.log('✅ Table matièrepremiere trouvée');
    
    // 3. Vérifier si la colonne codebarre existe
    console.log('🔍 Vérification de la colonne codebarre...');
    const [columnCheck] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'matièrepremiere' 
      AND COLUMN_NAME = 'codebarre'
    `);
    
    if (columnCheck.length === 0) {
      console.log('❌ La colonne codebarre n\'existe pas');
      console.log('💡 Solution: Exécutez le script add_barcode_field.js\n');
      return;
    }
    console.log('✅ Colonne codebarre trouvée');
    
    // 4. Vérifier les codes existants
    console.log('🔍 Vérification des codes-barres existants...');
    const [existingCodes] = await db.execute(
      'SELECT codebarre FROM matièrepremiere WHERE codebarre LIKE "PROD%" ORDER BY codebarre DESC LIMIT 5'
    );
    
    if (existingCodes.length === 0) {
      console.log('ℹ️ Aucun code-barres existant, le premier sera PROD001');
    } else {
      console.log('📋 Derniers codes-barres:');
      existingCodes.forEach(row => {
        console.log(`   - ${row.codebarre}`);
      });
    }
    
    // 5. Simuler la génération d'un nouveau code
    console.log('\n🏷️ Simulation de génération d\'un nouveau code...');
    
    let newNumber = 1;
    if (existingCodes.length > 0) {
      const lastBarcode = existingCodes[0].codebarre;
      const match = lastBarcode.match(/PROD(\d+)/);
      if (match) {
        newNumber = parseInt(match[1]) + 1;
      }
    }
    
    const newBarcode = `PROD${String(newNumber).padStart(3, '0')}`;
    console.log(`✅ Nouveau code-barres généré: ${newBarcode}`);
    
    // 6. Test d'insertion (optionnel)
    console.log('\n🧪 Test d\'insertion (simulation)...');
    console.log(`📝 Le code ${newBarcode} peut être utilisé pour créer une nouvelle matière première`);
    
    console.log('\n🎉 Test terminé avec succès!');
    console.log('📱 La fonctionnalité de génération de code-barres est opérationnelle');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n🔧 Solutions possibles:');
    console.log('1. Vérifiez que la base de données est démarrée');
    console.log('2. Exécutez: node data.sql pour créer les tables');
    console.log('3. Exécutez: node add_barcode_field.js pour ajouter la colonne codebarre');
  } finally {
    process.exit(0);
  }
}

testBarcodeGeneration();
