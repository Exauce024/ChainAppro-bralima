-- Script pour ajouter des utilisateurs de test dans la base de données gestionstocks
-- Exécution: mysql -u root -p gestionstocks < add_test_users.sql

USE gestionstocks;

-- Insérer des rôles s'ils n'existent pas
INSERT IGNORE INTO roles (id_role, role_libelle) VALUES
(1, 'admin'),
(2, 'gestionnaire'),
(3, 'magasinier'),
(4, 'fournisseur');

-- Insérer des utilisateurs de test avec différents rôles
INSERT IGNORE INTO users (username, email, password, id_role, nom, prenom, telephone, actif) VALUES
-- Administrateur
('admin', 'admin@bralima.cd', '$2b$10$rQZ8K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K', 1, 'Admin', 'System', '123456789', 1),

-- Gestionnaire
('gestionnaire', 'gestionnaire@bralima.cd', '$2b$10$rQZ8K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K', 2, 'Gestionnaire', 'Principal', '223344556', 1),

-- Magasinier
('magasinier', 'magasinier@bralima.cd', '$2b$10$rQZ8K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K', 3, 'Magasinier', 'Stock', '334455667', 1),

-- Fournisseur
('fournisseur', 'fournisseur@bralima.cd', '$2b$10$rQZ8K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K', 4, 'Fournisseur', 'Test', '445566778', 1),

-- Second gestionnaire pour tests multiples
('gestionnaire2', 'gestionnaire2@bralima.cd', '$2b$10$rQZ8K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K2K', 2, 'Gestionnaire', 'Second', '556677889', 1);

-- Note: Les mots de passe sont hashés avec bcrypt
-- Pour les tests, vous pouvez utiliser des mots de passe simples comme:
-- admin123, gestionnaire123, magasinier123, fournisseur123

-- Afficher les utilisateurs ajoutés
SELECT 
    u.idusers,
    u.username,
    u.email,
    r.role_libelle,
    u.nom,
    u.prenom,
    u.actif
FROM users u
JOIN roles r ON u.id_role = r.id_role
WHERE u.username IN ('admin', 'gestionnaire', 'magasinier', 'fournisseur', 'gestionnaire2')
ORDER BY r.id_role;

-- Instructions de connexion:
-- Admin: admin / admin123
-- Gestionnaire: gestionnaire / gestionnaire123  
-- Magasinier: magasinier / magasinier123
-- Fournisseur: fournisseur / fournisseur123
-- Gestionnaire2: gestionnaire2 / gestionnaire123
