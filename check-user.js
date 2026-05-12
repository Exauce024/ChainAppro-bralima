// check-user.js - Vérifier les utilisateurs et leurs rôles
const db = require('./config/db');

async function checkUsers() {
  try {
    const [users] = await db.execute(`
      SELECT u.idusers, u.nom, u.prenom, u.email, u.role_id, r.libellé as role_libelle, u.statut
      FROM users u
      LEFT JOIN role r ON u.role_id = r.idrole
    `);
    
    console.log('=== Utilisateurs dans la base de données ===');
    users.forEach(user => {
      console.log(`ID: ${user.idusers} | ${user.prenom} ${user.nom} | ${user.email} | Rôle: ${user.role_libelle} | Statut: ${user.statut}`);
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsers();
