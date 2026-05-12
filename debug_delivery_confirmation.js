const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnostic du problème de confirmation de livraison...\n');

// Vérifier le template fournisseur
const templatePath = path.join(__dirname, 'views', 'fournisseur', 'commande-detail_content.ejs');

try {
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  console.log('📄 Template commande-detail_content.ejs lu');
  
  // Vérifier la fonction confirmDelivery
  const confirmDeliveryMatch = templateContent.match(/function confirmDelivery\(\) \{[\s\S]*?\n\}/);
  if (confirmDeliveryMatch) {
    console.log('✅ Fonction confirmDelivery trouvée');
    console.log('   Longueur:', confirmDeliveryMatch[0].length, 'caractères');
  } else {
    console.log('❌ Fonction confirmDelivery non trouvée');
  }
  
  // Vérifier la route dans le template
  const routeMatch = templateContent.match(/\/fournisseur\/commande\/.*\/confirm-delivery/);
  if (routeMatch) {
    console.log('✅ Route confirm-delivery trouvée dans le template:', routeMatch[0]);
  } else {
    console.log('❌ Route confirm-delivery non trouvée dans le template');
  }
  
  // Vérifier les boutons
  const buttonMatch = templateContent.match(/onclick="confirmDelivery\(\)"/);
  if (buttonMatch) {
    console.log('✅ Bouton confirmDelivery trouvé');
  } else {
    console.log('❌ Bouton confirmDelivery non trouvé');
  }
  
} catch (error) {
  console.error('❌ Erreur de lecture du template:', error.message);
}

// Vérifier les routes
const routesPath = path.join(__dirname, 'route', 'fournisseurRoutes.js');
try {
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  console.log('\n📄 Routes fournisseurRoutes.js lues');
  
  const confirmRouteMatch = routesContent.match(/confirm-delivery/);
  if (confirmRouteMatch) {
    console.log('✅ Route confirm-delivery trouvée dans les routes');
  } else {
    console.log('❌ Route confirm-delivery non trouvée dans les routes');
  }
  
} catch (error) {
  console.error('❌ Erreur de lecture des routes:', error.message);
}

// Vérifier le contrôleur
const controllerPath = path.join(__dirname, 'controllers', 'fournisseurController.js');
try {
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  console.log('\n📄 Contrôleur fournisseurController.js lu');
  
  const confirmMethodMatch = controllerContent.match(/static async confirmDelivery/);
  if (confirmMethodMatch) {
    console.log('✅ Méthode confirmDelivery trouvée dans le contrôleur');
  } else {
    console.log('❌ Méthode confirmDelivery non trouvée dans le contrôleur');
  }
  
} catch (error) {
  console.error('❌ Erreur de lecture du contrôleur:', error.message);
}

console.log('\n🔧 Solutions possibles:');
console.log('1. Vérifier la console JavaScript du navigateur pour les erreurs');
console.log('2. S\'assurer que le serveur est redémarré');
console.log('3. Vérifier que la session fournisseur est active');
console.log('4. Tester avec un appel fetch direct dans la console');

console.log('\n📱 Test manuel dans la console du navigateur:');
console.log('// Ouvrir la console sur la page et exécuter:');
console.log('fetch("/fournisseur/commande/4/confirm-delivery", {method: "POST"})');
console.log('.then(r => r.json())');
console.log('.then(console.log)');
