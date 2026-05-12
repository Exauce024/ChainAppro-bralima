const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic du problème de variable "title"...\n');

// Vérifier le fichier layout_modern.ejs
const layoutPath = path.join(__dirname, 'views', 'layout_modern.ejs');

try {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  console.log('📄 Contenu du fichier layout_modern.ejs:');
  
  // Vérifier les lignes autour de l'erreur
  const lines = layoutContent.split('\n');
  const errorLine = 322;
  const startLine = Math.max(0, errorLine - 5);
  const endLine = Math.min(lines.length - 1, errorLine + 5);
  
  console.log(`\n📍 Lignes ${startLine}-${endLine} autour de l'erreur:`);
  lines.slice(startLine, endLine + 1).forEach((line, index) => {
    console.log(`${startLine + index + 1}: ${line}`);
  });
  
  // Vérifier la définition de la variable title
  const titleMatches = layoutContent.match(/title/g);
  console.log(`\n🔍 Occurrences de 'title': ${titleMatches ? titleMatches.length : 0}`);
  
  // Vérifier la structure EJS
  const ejsStructure = layoutContent.match(/<%.*?%>/g);
  console.log(`\n📋 Structure EJS trouvée: ${ejsStructure ? ejsStructure.length : 0} blocs`);
  
  // Vérifier les includes
  const includes = layoutContent.match(/include\(['"])([^'"]+)\1/g);
  if (includes) {
    console.log('\n📂 Fichiers inclus:');
    includes.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match[2]}`);
    });
  }
  
  console.log('\n✅ Diagnostic terminé!');
  
} catch (error) {
  console.error('❌ Erreur lors de la lecture du fichier:', error.message);
}

console.log('\n🔧 Solutions possibles:');
console.log('1. Redémarrer le serveur pour vider le cache EJS');
console.log('2. Vérifier que la variable title est bien passée par les contrôleurs');
console.log('3. Nettoyer les fichiers temporaires EJS si nécessaire');
