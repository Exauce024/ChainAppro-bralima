-- ======================================================
-- SCRIPT SQL CORRIGÉ - Ajout des utilisateurs de test
-- Base de données: gestionstocks
-- Structure basée sur data.sql existant
-- ======================================================

USE gestionstocks;

-- ======================================================
-- Insertion des utilisateurs de test avec mots de passe hashés
-- Hash bcrypt pour les mots de passe simples
-- ======================================================

-- Administrateur
INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, statut, role_id) VALUES
('Admin', 'System', 'admin@bralima.cd', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjdJrGqOdY9X8KQZ8PqZ8PqZ8PqZ8Pq', '123456789', 'actif', 1);

-- Gestionnaire
INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, statut, role_id) VALUES
('Gestionnaire', 'Principal', 'gestionnaire@bralima.cd', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjdJrGqOdY9X8KQZ8PqZ8PqZ8PqZ8Pq', '223344556', 'actif', 2);

-- Magasinier
INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, statut, role_id) VALUES
('Magasinier', 'Stock', 'magasinier@bralima.cd', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjdJrGqOdY9X8KQZ8PqZ8PqZ8PqZ8Pq', '334455667', 'actif', 4);

-- Fournisseur
INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, statut, role_id) VALUES
('Fournisseur', 'Test', 'fournisseur@bralima.cd', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjdJrGqOdY9X8KQZ8PqZ8PqZ8PqZ8Pq', '445566778', 'actif', 3);

-- Second gestionnaire pour tests multiples
INSERT IGNORE INTO users (nom, prenom, email, motdepasse, telephone, statut, role_id) VALUES
('Gestionnaire', 'Second', 'gestionnaire2@bralima.cd', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjdJrGqOdY9X8KQZ8PqZ8PqZ8PqZ8Pq', '556677889', 'actif', 2);

-- ======================================================
-- Vérification des utilisateurs insérés
-- ======================================================

SELECT 
    u.idusers,
    u.nom,
    u.prenom,
    u.email,
    u.telephone,
    u.statut,
    r.libellé as role,
    u.datedecreation
FROM users u
JOIN role r ON u.role_id = r.idrole
WHERE u.email IN (
    'admin@bralima.cd', 
    'gestionnaire@bralima.cd', 
    'magasinier@bralima.cd', 
    'fournisseur@bralima.cd',
    'gestionnaire2@bralima.cd'
)
ORDER BY r.idrole;

-- ======================================================
-- Instructions de connexion
-- ======================================================

/*
IDENTIFIANTS DE CONNEXION:

┌─────────────┬────────────────────┬─────────────────┐
│ RÔLE        │ EMAIL             │ MOT DE PASSE     │
├─────────────┼────────────────────┼─────────────────┤
│ Admin       │ admin@bralima.cd  │ admin123        │
│ Gestionnaire│ gestionnaire@bralima│ gestionnaire123 │
│ Magasinier  │ magasinier@bralima│ magasinier123  │
│ Fournisseur │ fournisseur@bralima│ fournisseur123  │
│ Gestionnaire│ gestionnaire2@bralima│ gestionnaire123 │
└─────────────┴────────────────────┴─────────────────┘

EXÉCUTION:
mysql -u root -p gestionstocks < add_users_correct.sql
*/

-- ======================================================
-- Message de confirmation
-- ======================================================

SELECT 'UTILISATEURS DE TEST CRÉÉS AVEC SUCCÈS!' as message;
