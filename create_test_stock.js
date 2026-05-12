const db = require('./config/db');

console.log('🔧 Création d un enregistrement de stock pour la matière première...\n');

async function createTestStock() {
  try {
    // Vérifier les matières premières existantes
    const [matieres] = await db.execute('SELECT idmp, libellé FROM matièrepremiere LIMIT 5');
    console.log('📊 Matières premières trouvées:');
    matieres.forEach(mp => {
      console.log(`   ID: ${mp.idmp}, Nom: ${mp.libellé}`);
    });
    
    if (matieres.length === 0) {
      console.log('❌ Aucune matière première trouvée');
      return;
    }
    
    // Créer un stock pour la première matière première
    const premiereMatiere = matieres[0];
    console.log(`\n🏭 Création d un stock pour: ${premiereMatiere.libellé} (ID: ${premiereMatiere.idmp})`);
    
    // Vérifier si un stock existe déjà
    const [existingStock] = await db.execute(
      'SELECT idstock FROM stock WHERE idmp = ?',
      [premiereMatiere.idmp]
    );
    
    if (existingStock.length > 0) {
      console.log(`✅ Un stock existe déjà pour cette matière première (ID: ${existingStock[0].idstock})`);
      return;
    }
    
    // Créer le stock
    const [result] = await db.execute(`
      INSERT INTO stock (idmp, qtedisponible, datemiseajour, identret)
      VALUES (?, ?, ?, ?)
    `, [
      premiereMatiere.idmp,
      100, // Quantité initiale
      new Date(),
      1 // ID de l'entrepôt (supposé)
    ]);
    
    console.log(`✅ Stock créé avec succès!`);
    console.log(`   ID du stock: ${result.insertId}`);
    console.log(`   Matière première: ${premiereMatiere.libellé}`);
    console.log(`   Quantité: 100`);
    
    // Vérifier la création
    const [verification] = await db.execute(`
      SELECT s.idstock, s.qtedisponible, mp.libellé
      FROM stock s
      JOIN matièrepremiere mp ON s.idmp = mp.idmp
      WHERE s.idstock = ?
    `, [result.insertId]);
    
    if (verification.length > 0) {
      console.log('\n🔍 Vérification réussie:');
      console.log(`   Stock ID: ${verification[0].idstock}`);
      console.log(`   Produit: ${verification[0].libellé}`);
      console.log(`   Quantité: ${verification[0].qtedisponible}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du stock:', error.message);
  }
}

createTestStock().then(() => {
  console.log('\n✅ Opération terminée!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
