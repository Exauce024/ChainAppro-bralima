const db = require('./config/db');

async function checkLogauditStructure() {
  console.log('🔍 Vérification de la structure de la table logaudit...\n');

  try {
    // Vérifier si la table existe
    const [tables] = await db.execute('SHOW TABLES LIKE "logaudit"');
    if (tables.length === 0) {
      console.log('❌ Table logaudit non trouvée');
      return;
    }
    console.log('✅ Table logaudit trouvée');

    // Vérifier la structure complète
    console.log('\n📋 Structure de la table logaudit:');
    const [columns] = await db.execute('DESCRIBE logaudit');
    
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'NO' ? 'NOT NULL' : 'NULL'})`);
    });

    // Vérifier quelques données
    console.log('\n📝 Données d\'exemple:');
    const [sampleData] = await db.execute('SELECT * FROM logaudit LIMIT 3');
    
    if (sampleData.length > 0) {
      console.log('Premier log:', sampleData[0]);
    } else {
      console.log('Aucune donnée dans la table');
    }

    console.log('\n🎯 Analyse pour la correction:');
    const idColumn = columns.find(col => col.Field.toLowerCase().includes('id'));
    const userColumn = columns.find(col => col.Field.toLowerCase().includes('user'));
    const detailColumn = columns.find(col => col.Field.toLowerCase().includes('detail'));
    const dateColumn = columns.find(col => col.Field.toLowerCase().includes('date'));
    
    console.log(`   ID probable: ${idColumn ? idColumn.Field : 'NON TROUVÉ'}`);
    console.log(`   User probable: ${userColumn ? userColumn.Field : 'NON TROUVÉ'}`);
    console.log(`   Detail probable: ${detailColumn ? detailColumn.Field : 'NON TROUVÉ'}`);
    console.log(`   Date probable: ${dateColumn ? dateColumn.Field : 'NON TROUVÉ'}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

checkLogauditStructure();
