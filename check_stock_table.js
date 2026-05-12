const db = require('./config/db');

console.log('🔍 Vérification de la structure de la table stock...\n');

async function checkStockTable() {
  try {
    // Vérifier la structure de la table stock
    const [structure] = await db.execute('DESCRIBE stock');
    console.log('📋 Structure de la table stock:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? 'KEY' : ''}`);
    });
    
    // Vérifier les matières premières
    const [matieres] = await db.execute('SELECT idmp, libellé FROM matièrepremiere LIMIT 3');
    console.log('\n📊 Matières premières:');
    matieres.forEach(mp => {
      console.log(`   ID: ${mp.idmp}, Nom: ${mp.libellé}`);
    });
    
    // Vérifier les stocks existants
    const [stocks] = await db.execute('SELECT idstock, idmp, qtedisponible FROM stock LIMIT 3');
    console.log('\n📦 Stocks existants:');
    if (stocks.length === 0) {
      console.log('   Aucun stock trouvé');
    } else {
      stocks.forEach(stock => {
        console.log(`   Stock ID: ${stock.idstock}, MP ID: ${stock.idmp}, Qté: ${stock.qtedisponible}`);
      });
    }
    
    // Créer un stock avec la bonne structure
    if (matieres.length > 0 && stocks.length === 0) {
      console.log('\n🏭 Création d un stock de test...');
      const matiere = matieres[0];
      
      // Construire la requête avec les bonnes colonnes
      const columns = ['idmp', 'qtedisponible'];
      const values = [matiere.idmp, 50];
      
      // Ajouter identret si la colonne existe
      const hasIdentret = structure.some(col => col.Field === 'identret');
      if (hasIdentret) {
        columns.push('identret');
        values.push(1);
      }
      
      const columnsStr = columns.join(', ');
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO stock (${columnsStr}) VALUES (${placeholders})`;
      console.log(`   Requête: ${query}`);
      console.log(`   Valeurs: ${values.join(', ')}`);
      
      const [result] = await db.execute(query, values);
      console.log(`✅ Stock créé avec ID: ${result.insertId}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkStockTable().then(() => {
  console.log('\n✅ Vérification terminée!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
