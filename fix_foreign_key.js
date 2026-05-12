const db = require('./config/db');

console.log('🔧 Correction de la contrainte de clé étrangère...\n');

async function fixForeignKey() {
  try {
    // Vérifier les entrepôts existants
    const [entrepots] = await db.execute('SELECT identret, nom FROM entrepôt LIMIT 5');
    console.log('📦 Entrepôts disponibles:');
    if (entrepots.length === 0) {
      console.log('   Aucun entrepôt trouvé');
      
      // Créer un entrepôt par défaut
      console.log('\n🏭 Création d un entrepôt par défaut...');
      const [result] = await db.execute(`
        INSERT INTO entrepôt (identret, nom, adresse, ville, pays)
        VALUES (?, ?, ?, ?, ?)
      `, [1, 'Entrepôt Principal', 'Adresse principale', 'Kinshasa', 'RD Congo']);
      
      console.log(`✅ Entrepôt créé avec ID: ${result.insertId}`);
    } else {
      entrepots.forEach(e => {
        console.log(`   ID: ${e.identret}, Nom: ${e.nom}`);
      });
    }
    
    // Créer un stock avec un entrepôt valide
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
        console.log('✅ Un stock existe déjà pour cette matière première');
        console.log(`   Stock ID: ${existingStock[0].idstock}`);
      } else {
        // Créer le stock avec un entrepôt valide
        const [result] = await db.execute(`
          INSERT INTO stock (idmp, qtedisponible, identret, datemaj)
          VALUES (?, ?, ?, ?)
        `, [
          matiere.idmp,
          100,
          1, // ID de l'entrepôt principal
          new Date()
        ]);
        
        console.log(`✅ Stock créé avec succès!`);
        console.log(`   Stock ID: ${result.insertId}`);
        console.log(`   Matière: ${matiere.libellé}`);
        console.log(`   Quantité: 100`);
        console.log(`   Entrepôt ID: 1`);
      }
    }
    
    // Tester la recherche
    console.log('\n🧪 Test de la méthode findByIdWithDetails...');
    const StockModel = require('./models/stockModel');
    
    if (matieres.length > 0) {
      const testId = matieres[0].idmp;
      const result = await StockModel.findByIdWithDetails(testId);
      
      if (result) {
        console.log('✅ Stock trouvé avec findByIdWithDetails:');
        console.log(`   Stock ID: ${result.idstock}`);
        console.log(`   Matière: ${result.libellé}`);
        console.log(`   Qté: ${result.qtedisponible}`);
      } else {
        console.log('❌ Toujours pas trouvé avec findByIdWithDetails');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixForeignKey().then(() => {
  console.log('\n✅ Correction terminée!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
