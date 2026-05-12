const db = require('./config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function debugPDFGeneration() {
  console.log('🔍 Diagnostic de la génération du PDF...\n');

  try {
    // Étape 1: Vérifier la connexion à la base
    console.log('📊 Étape 1: Test de connexion à la base de données...');
    await db.execute('SELECT 1');
    console.log('✅ Connexion réussie');

    // Étape 2: Vérifier la table logaudit
    console.log('\n📋 Étape 2: Vérification de la table logaudit...');
    const [tableCheck] = await db.execute('SHOW TABLES LIKE "logaudit"');
    if (tableCheck.length === 0) {
      console.log('❌ Table logaudit non trouvée');
      return;
    }
    console.log('✅ Table logaudit trouvée');

    // Étape 3: Vérifier les colonnes
    console.log('\n🔍 Étape 3: Vérification des colonnes...');
    const [columns] = await db.execute('DESCRIBE logaudit');
    console.log('Colonnes trouvées:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });

    // Étape 4: Tester la requête
    console.log('\n📝 Étape 4: Test de la requête...');
    const [logs] = await db.execute(`
      SELECT la.idaudit, la.detaillson, la.module, la.action, 
             u.nom, u.prenom, la.datedebut
        FROM logaudit la
        LEFT JOIN users u ON la.iduser = u.idusers
        ORDER BY la.datedebut DESC
        LIMIT 5
    `);
    
    console.log(`✅ Requête réussie - ${logs.length} logs trouvés`);
    if (logs.length > 0) {
      console.log('Exemple de log:', logs[0]);
    }

    // Étape 5: Vérifier PDFKit
    console.log('\n📄 Étape 5: Test de création PDF simple...');
    const testDoc = new PDFDocument();
    const testFileName = 'test_debug.pdf';
    const testFilePath = path.join(__dirname, '../temp', testFileName);
    
    // Créer le répertoire temp si nécessaire
    const tempDir = path.dirname(testFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('📁 Répertoire temp créé:', tempDir);
    }

    // Test simple de PDF
    testDoc.fontSize(12).text('Test PDF', 50, 50);
    testDoc.pipe(fs.createWriteStream(testFilePath));
    testDoc.end();

    // Attendre la création
    setTimeout(() => {
      if (fs.existsSync(testFilePath)) {
        console.log('✅ PDF test créé avec succès:', testFilePath);
        
        // Nettoyer
        try {
          fs.unlinkSync(testFilePath);
          console.log('🗑️ Fichier test supprimé');
        } catch (err) {
          console.log('⚠️ Erreur suppression fichier test:', err.message);
        }
      } else {
        console.log('❌ Échec de création du PDF test');
      }
    }, 2000);

    // Étape 6: Vérifier les permissions
    console.log('\n🔐 Étape 6: Vérification des permissions...');
    try {
      const stats = fs.statSync(path.dirname(testFilePath));
      console.log('✅ Permissions du répertoire temp:', stats.mode);
    } catch (err) {
      console.log('❌ Erreur permissions:', err.message);
    }

    console.log('\n🎉 Diagnostic terminé!');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugPDFGeneration();
