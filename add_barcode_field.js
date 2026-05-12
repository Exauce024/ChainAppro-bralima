const db = require('./config/db');

async function addBarcodeField() {
  try {
    console.log('Ajout du champ codebarre à la table matièrepremiere...');
    
    await db.execute(`
      ALTER TABLE matièrepremiere 
      ADD COLUMN codebarre VARCHAR(100) UNIQUE
    `);
    
    console.log('✅ Champ codebarre ajouté avec succès');
    
    // Vérifier
    const [columns] = await db.execute('DESCRIBE matièrepremiere');
    console.log('\nStructure de la table matièrepremiere:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '(' + col.Key + ')' : ''}`);
    });
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Le champ codebarre existe déjà');
    } else {
      console.error('❌ Erreur:', error.message);
    }
    process.exit(1);
  }
}

addBarcodeField();
