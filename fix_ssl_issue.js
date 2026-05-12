const fs = require('fs');
const path = require('path');

console.log('🔧 Diagnostic et correction du problème SSL...\n');

// Lire le fichier .env actuel
const envPath = path.join(__dirname, '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 Fichier .env actuel lu');
} catch (error) {
  console.error('❌ Erreur de lecture du .env:', error.message);
}

// Analyser les problèmes potentiels
console.log('\n🔍 Analyse des problèmes SSL:');

// Problème 1: URL trop longue dans les en-têtes
const baseUrlMatch = envContent.match(/BASE_URL=(.+)/);
if (baseUrlMatch) {
  const baseUrl = baseUrlMatch[1].trim();
  console.log(`   BASE_URL actuelle: ${baseUrl}`);
  
  if (baseUrl.length > 100) {
    console.log('   ⚠️  BASE_URL trop longue - peut causer des erreurs SSL');
  }
  
  // Vérifier si c'est une IP locale avec port
  if (baseUrl.includes('10.') || baseUrl.includes('192.168.') || baseUrl.includes('127.')) {
    console.log('   ⚠️  IP locale détectée - SSL non nécessaire en local');
  }
}

// Problème 2: Configuration HTTPS non appropriée pour le développement
console.log('\n💡 Solutions recommandées:');
console.log('1. Utiliser HTTP en local (pas HTTPS)');
console.log('2. URL plus courte si possible');
console.log('3. Désactiver la vérification SSL en développement');

// Générer un .env corrigé
let correctedEnv = envContent;

// Solution 1: Forcer HTTP en local
if (baseUrlMatch) {
  const baseUrl = baseUrlMatch[1].trim();
  if (baseUrl.includes('https://') && (baseUrl.includes('10.') || baseUrl.includes('192.168.') || baseUrl.includes('127.'))) {
    console.log('\n🔧 Correction: Passage de HTTPS à HTTP pour IP locale');
    correctedEnv = correctedEnv.replace(
      /BASE_URL=.+/,
      `BASE_URL=http://10.136.125.169:4000`
    );
  }
}

// Solution 2: Ajouter configuration de développement
if (!envContent.includes('NODE_ENV')) {
  console.log('\n🔧 Ajout de NODE_ENV=development');
  correctedEnv += '\nNODE_ENV=development';
}

// Écrire le fichier .env corrigé
try {
  fs.writeFileSync(envPath, correctedEnv);
  console.log('\n✅ Fichier .env corrigé avec succès!');
  
  // Afficher les changements
  const lines = correctedEnv.split('\n');
  console.log('\n📋 Configuration corrigée:');
  lines.forEach(line => {
    if (line.startsWith('BASE_URL') || line.startsWith('NODE_ENV')) {
      console.log(`   ${line}`);
    }
  });
  
} catch (error) {
  console.error('❌ Erreur d\'écriture du .env:', error.message);
}

console.log('\n🚀 Actions recommandées:');
console.log('1. Redémarrer le serveur: npm run dev');
console.log('2. Tester la connexion avec le magic link');
console.log('3. Si problème persiste: utiliser localhost:4000 directement');

console.log('\n📱 Test de connexion:');
console.log('   Accès direct: http://localhost:4000');
console.log('   Magic Link: devrait fonctionner maintenant');
