const db = require('./config/db');

async function testDB() {
  try {
    console.log('Test de connexion à la base de données...');
    const [rows] = await db.execute('SELECT 1 as test');
    console.log('Connexion réussie:', rows);
    
    console.log('Test de la table users...');
    const [users] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('Nombre d\'utilisateurs:', users[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur de base de données:', error);
    process.exit(1);
  }
}

testDB();
