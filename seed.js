// seed.js - Données initiales pour BRALIMA Supply Chain
const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('🌱 Démarrage du seeding de la base de données...');

  try {
    // 1. Insertion des rôles
    await db.execute(`
      INSERT IGNORE INTO role (libellé, description) VALUES
      ('admin', 'Administrateur système - tous les droits'),
      ('gestionnaire', 'Gestionnaire Supply Chain'),
      ('fournisseur', 'Fournisseur externe'),
      ('magasinier', 'Magasinier / Réception')
    `);
    console.log('✅ Rôles insérés');

    // 2. Création de l'administrateur principal
    const hashedAdmin = await bcrypt.hash('Admin2026!', 12);
    const [adminResult] = await db.execute(`
      INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, role_id, statut)
      VALUES ('Admin', 'BRALIMA', 'admin@bralima.com', ?, '+243 999 000 001', 
              (SELECT idrole FROM role WHERE libellé = 'admin'), 'actif')
    `, [hashedAdmin]);
    
    if (adminResult.affectedRows > 0) {
      console.log('✅ Admin créé : admin@bralima.com / Admin2026!');
    } else {
      console.log('ℹ️  Admin déjà existant');
    }

    // 3. Création d'un Gestionnaire Supply Chain
    const hashedGestionnaire = await bcrypt.hash('Gestion2026!', 12);
    await db.execute(`
      INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, role_id, statut)
      VALUES ('Kabila', 'Jean', 'gestionnaire@bralima.com', ?, '+243 999 000 002', 
              (SELECT idrole FROM role WHERE libellé = 'gestionnaire'), 'actif')
    `, [hashedGestionnaire]);
    console.log('✅ Gestionnaire créé : gestionnaire@bralima.com / Gestion2026!');

    // 4. Création d'un Magasinier
    const hashedMagasinier = await bcrypt.hash('Magasin2026!', 12);
    await db.execute(`
      INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, role_id, statut)
      VALUES ('Mutombo', 'Paul', 'magasinier@bralima.com', ?, '+243 999 000 003', 
              (SELECT idrole FROM role WHERE libellé = 'magasinier'), 'actif')
    `, [hashedMagasinier]);
    console.log('✅ Magasinier créé : magasinier@bralima.com / Magasin2026!');

    // 5. Matières Premières
    await db.execute(`
      INSERT IGNORE INTO matièrepremiere (libellé, description, seuilcritique, seuilalerte) VALUES
      ('Malt Pilsen', 'Malt principal pour bière', 800, 1500),
      ('Houblon Saaz', 'Houblon aromatique', 300, 800),
      ('Emballages Bouteilles 33cl', 'Caisses de bouteilles vides', 15000, 30000),
      ('Sucres', 'Sucre pour fermentation', 500, 1200),
      ('Levure', 'Levure de bière', 200, 500)
    `);
    console.log('✅ Matières premières insérées');

    // 6. Entrepôts
    await db.execute(`
      INSERT IGNORE INTO entrepôt (nom) VALUES
      ('Entrepôt Principal Lubumbashi'),
      ('Dépôt Temporaire')
    `);
    console.log('✅ Entrepôts créés');

    // 7. Fournisseurs
    await db.execute(`
      INSERT IGNORE INTO fournisseur (raisonsocial, libellé, email, telephone, adresse, contact_nom, delai_livraison, statut) VALUES
      ('Malterie Congo SARL', 'Malterie Congo', 'contact@malteriecongo.com', '+243 997 123 456', 
       'Route Kasumbalesa, Lubumbashi', 'M. Kabange', 14, 'actif'),
      
      ('Houblon Import Africa', 'Houblon Import', 'sales@houblonimport.com', '+32 478 55 66 77', 
       'Anvers, Belgique', 'Mme Laurent', 21, 'actif'),
      
      ('Emballages Industries SARL', 'Emballages SARL', 'commercial@emballages-lub.com', '+243 899 444 555', 
       'Zone Industrielle, Lubumbashi', 'M. Tshibangu', 7, 'actif')
    `);
    console.log('✅ Fournisseurs insérés');

    // 8. Quelques stocks initiaux (optionnel)
    await db.execute(`
      INSERT IGNORE INTO stock (idmp, identret, qtedisponible, lotnumero, dateperemption)
      SELECT mp.idmp, 1, 2500, 'LOT-2026-001', '2027-06-30'
      FROM matièrepremiere mp
      WHERE mp.libellé = 'Malt Pilsen'
    `);

    console.log('🎉 Seeding terminé avec succès !');
    console.log('\n=== Comptes de test ===');
    console.log('Admin          → admin@bralima.com          / Admin2026!');
    console.log('Gestionnaire   → gestionnaire@bralima.com    / Gestion2026!');
    console.log('Magasinier     → magasinier@bralima.com      / Magasin2026!');
    console.log('\nN\'oublie pas de lancer : npm run dev');

  } catch (error) {
    console.error('❌ Erreur pendant le seeding :', error.message);
  } finally {
    process.exit(0);
  }
}

// Lancer le script
seedDatabase();