const db = require('./config/db');

console.log('🔧 Vérification et correction de la structure de la table entrepôt...\n');

async function fixEntrepotStructure() {
  try {
    // Vérifier la structure de la table entrepôt
    const [structure] = await db.execute('DESCRIBE entrepôt');
    console.log('📋 Structure actuelle de la table entrepôt:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? 'KEY' : ''}`);
    });
    
    // Créer un entrepôt avec la bonne structure
    const columns = structure.map(col => col.Field);
    console.log('\n📝 Colonnes disponibles:', columns.join(', '));
    
    // Construire la requête INSERT avec les colonnes existantes
    let insertQuery = 'INSERT INTO entrepôt (';
    let values = [];
    let placeholders = [];
    
    // Colonnes minimales nécessaires
    const requiredColumns = ['identret', 'nom'];
    
    if (columns.includes('identret')) {
      insertQuery += 'identret';
      values.push(1);
      placeholders.push('?');
    }
    
    if (columns.includes('nom')) {
      insertQuery += ', nom';
      values.push('Entrepôt Principal');
      placeholders.push('?');
    }
    
    // Ajouter d'autres colonnes si elles existent
    const optionalColumns = ['adresse', 'ville', 'pays'];
    optionalColumns.forEach(col => {
      if (columns.includes(col)) {
        insertQuery += `, ${col}`;
        values.push(col === 'adresse' ? 'Adresse principale' : col === 'ville' ? 'Kinshasa' : 'RD Congo');
        placeholders.push('?');
      }
    });
    
    insertQuery += `) VALUES (${placeholders.join(', ')})`;
    
    console.log('\n🔨 Requête de création:');
    console.log(`   ${insertQuery}`);
    console.log(`   Valeurs: ${values.join(', ')}`);
    
    // Vérifier si un entrepôt existe déjà
    const [existing] = await db.execute('SELECT COUNT(*) as count FROM entrepôt');
    if (existing[0].count > 0) {
      console.log('\n✅ Un entrepôt existe déjà');
    } else {
      const [result] = await db.execute(insertQuery, values);
      console.log(`\n✅ Entrepôt créé avec ID: ${result.insertId}`);
    }
    
    // Maintenant créer le stock
    const [matieres] = await db.execute('SELECT idmp, libellé FROM matièrepremiere LIMIT 1');
    
    if (matieres.length > 0) {
      const matiere = matieres[0];
      console.log(`\n📦 Création d un stock pour: ${matiere.libellé}`);
      
      // Vérifier si le stock existe déjà
      const [existingStock] = await db.execute(
        'SELECT idstock FROM stock WHERE idmp = ?',
        [matiere.idmp]
      );
      
      if (existingStock.length > 0) {
        console.log('✅ Stock existe déjà');
      } else {
        const [stockResult] = await db.execute(`
          INSERT INTO stock (idmp, qtedisponible, identret, datemaj)
          VALUES (?, ?, ?, ?)
        `, [
          matiere.idmp,
          100,
          1,
          new Date()
        ]);
        
        console.log(`✅ Stock créé avec ID: ${stockResult.insertId}`);
      }
    }
    
    // Tester la recherche finale
    console.log('\n🧪 Test final de findByIdWithDetails...');
    const StockModel = require('./models/stockModel');
    
    if (matieres.length > 0) {
      const testResult = await StockModel.findByIdWithDetails(matieres[0].idmp);
      
      if (testResult) {
        console.log('🎉 SUCCÈS! Stock trouvé:');
        console.log(`   Stock ID: ${testResult.idstock}`);
        console.log(`   Matière: ${testResult.libellé}`);
        console.log(`   Qté: ${testResult.qtedisponible}`);
      } else {
        console.log('❌ Échec de la recherche finale');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixEntrepotStructure().then(() => {
  console.log('\n✅ Opération terminée!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
