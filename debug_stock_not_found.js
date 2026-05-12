const db = require('./config/db');

console.log('🔍 Diagnostic du problème "Stock non trouvé"...\n');

async function debugStockIssue() {
  try {
    console.log('📊 1. Vérification des tables...');
    
    // Vérifier les matières premières
    const [matieres] = await db.execute('SELECT idmp, libellé FROM matièrepremiere LIMIT 5');
    console.log('   Matières premières trouvées:');
    matieres.forEach(mp => {
      console.log(`      ID: ${mp.idmp}, Nom: ${mp.libellé}`);
    });
    
    // Vérifier les stocks
    const [stocks] = await db.execute('SELECT idmp, idstock, qtedisponible FROM stock LIMIT 5');
    console.log('\n   Stocks trouvés:');
    stocks.forEach(stock => {
      console.log(`      ID Stock: ${stock.idstock}, ID MP: ${stock.idmp}, Qté: ${stock.qtedisponible}`);
    });
    
    // Test de la méthode findByIdWithDetails
    if (matieres.length > 0) {
      const testId = matieres[0].idmp;
      console.log(`\n🧪 2. Test de findByIdWithDetails avec idmp: ${testId}`);
      
      const StockModel = require('./models/stockModel');
      const result = await StockModel.findByIdWithDetails(testId);
      
      if (result) {
        console.log('✅ Stock trouvé:');
        console.log(`   ID Stock: ${result.idstock}`);
        console.log(`   ID MP: ${result.idmp}`);
        console.log(`   Libellé: ${result.libellé}`);
        console.log(`   Qté: ${result.qtedisponible}`);
      } else {
        console.log('❌ Stock NON trouvé avec findByIdWithDetails');
        
        // Test direct SQL
        console.log('\n🧪 3. Test SQL direct...');
        const [directResult] = await db.execute(`
          SELECT s.*, mp.libellé, mp.description, mp.seuilcritique, mp.seuilalerte
          FROM stock s
          JOIN matièrepremiere mp ON s.idmp = mp.idmp
          WHERE s.idmp = ?
          ORDER BY mp.libellé
        `, [testId]);
        
        console.log(`   Résultat SQL direct: ${directResult.length > 0 ? 'TROUVÉ' : 'NON TROUVÉ'}`);
        if (directResult.length > 0) {
          console.log(`   Stock ID: ${directResult[0].idstock}`);
          console.log(`   Qté disponible: ${directResult[0].qtedisponible}`);
        }
      }
    }
    
    // Vérifier la correspondance entre les tables
    console.log('\n🔗 4. Vérification des correspondances...');
    const [jointure] = await db.execute(`
      SELECT mp.idmp, mp.libellé, s.idstock, s.qtedisponible
      FROM matièrepremiere mp
      LEFT JOIN stock s ON mp.idmp = s.idmp
      LIMIT 5
    `);
    
    console.log('   Jointure MP-Stock:');
    jointure.forEach(row => {
      const stockStatus = row.idstock ? `Stock: ${row.qtedisponible || 0}` : 'Aucun stock';
      console.log(`      MP (${row.idmp}) ${row.libellé} -> ${stockStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

debugStockIssue().then(() => {
  console.log('\n✅ Diagnostic terminé!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
