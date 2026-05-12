const db = require('./config/db');

console.log('🔍 Diagnostic de l affichage des détails de stock...\n');

async function debugStockDetails() {
  try {
    console.log('📊 1. Test de la route avec un ID valide...');
    
    // Trouver une matière première avec stock
    const [testMatiere] = await db.execute(`
      SELECT mp.idmp, mp.libellé, s.idstock, s.qtedisponible
      FROM matièrepremiere mp
      LEFT JOIN stock s ON mp.idmp = s.idmp
      WHERE mp.idmp = 1
    `);
    
    if (testMatiere.length > 0) {
      const matiere = testMatiere[0];
      console.log(`   Matière trouvée: ${matiere.libellé} (ID: ${matiere.idmp})`);
      console.log(`   Stock: ${matiere.idstock ? matiere.qtedisponible : 'Aucun'}`);
      
      // Tester la méthode findByIdWithDetails avec cet ID
      console.log('\n🧪 2. Test de findByIdWithDetails...');
      const StockModel = require('./models/stockModel');
      const result = await StockModel.findByIdWithDetails(matiere.idmp);
      
      if (result) {
        console.log('✅ findByIdWithDetails fonctionne:');
        console.log(`   Stock ID: ${result.idstock}`);
        console.log(`   Matière: ${result.libellé}`);
        console.log(`   Qté: ${result.qtedisponible || 0}`);
        console.log(`   Seuil alerte: ${result.seuilalerte || 'N/A'}`);
        console.log(`   Seuil critique: ${result.seuilcritique || 'N/A'}`);
        
        // Vérifier les données pour le template
        console.log('\n📄 3. Données pour le template:');
        console.log(`   title: "Détails du Stock - ${result.libellé}"`);
        console.log(`   stock object: ${JSON.stringify({
          idstock: result.idstock,
          idmp: result.idmp,
          libellé: result.libellé,
          qtedisponible: result.qtedisponible,
          seuilalerte: result.seuilalerte,
          seuilcritique: result.seuilcritique
        }, null, 2)}`);
        
      } else {
        console.log('❌ findByIdWithDetails retourne null');
      }
    } else {
      console.log('❌ Aucune matière première trouvée pour le test');
    }
    
    // Vérifier la vue stock_details_content.ejs
    console.log('\n📂 4. Vérification du template...');
    const fs = require('fs');
    const path = require('path');
    const templatePath = path.join(__dirname, 'views', 'gestionnaire', 'stock_details_content.ejs');
    
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      console.log('✅ Template stock_details_content.ejs trouvé');
      console.log(`   Taille: ${templateContent.length} caractères`);
      
      // Vérifier les variables utilisées dans le template
      const stockVarMatches = templateContent.match(/stock\./g);
      const titleVarMatches = templateContent.match(/title\./g);
      
      console.log(`   Variables 'stock': ${stockVarMatches ? stockVarMatches.length : 0}`);
      console.log(`   Variables 'title': ${titleVarMatches ? titleVarMatches.length : 0}`);
      
    } catch (error) {
      console.log('❌ Template non trouvé:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

debugStockDetails().then(() => {
  console.log('\n✅ Diagnostic terminé!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  process.exit(1);
});
