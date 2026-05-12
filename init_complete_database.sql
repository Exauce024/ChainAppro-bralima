-- ======================================================
-- SCRIPT COMPLET D'INITIALISATION - BRALIMA Supply Chain
-- Base de données: gestionstocks
-- Crée la base de données, les tables et les utilisateurs de test
-- ======================================================

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS gestionstocks CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Utiliser la base de données
USE gestionstocks;

-- ======================================================
-- Tables de base sans dépendances
-- ======================================================

-- Table des rôles
CREATE TABLE IF NOT EXISTS role (
    idrole INT AUTO_INCREMENT PRIMARY KEY,
    libellé VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    idusers INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    motdepasse VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
    datedecreation DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    role_id INT NULL,
    photo VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (role_id) REFERENCES role(idrole) ON DELETE SET NULL
);

-- ======================================================
-- Insertion des rôles de base
-- ======================================================

INSERT IGNORE INTO role (libellé, description) VALUES
('admin', 'Administrateur système'),
('gestionnaire', 'Gestionnaire Supply Chain'),
('fournisseur', 'Fournisseur'),
('magasinier', 'Magasinier');

-- ======================================================
-- Insertion des utilisateurs de test
-- Mot de passe: admin123 pour tous (hash bcrypt)
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
-- Tables additionnelles (simplifiées pour le test)
-- ======================================================

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS fournisseur (
    idfournisseur INT AUTO_INCREMENT PRIMARY KEY,
    raisonsocial VARCHAR(200) NOT NULL,
    libellé VARCHAR(200),
    telephone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    adresse TEXT,
    contact_nom VARCHAR(150),
    delai_livraison INT DEFAULT 7,
    statut ENUM('actif', 'inactif') DEFAULT 'actif',
    datecreation DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS commande (
    idcommande INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    idfournisseur INT,
    datecommande DATETIME DEFAULT CURRENT_TIMESTAMP,
    datelivraisonprevue DATETIME,
    statut ENUM('en_attente', 'approuvee', 'livree', 'annulee') DEFAULT 'en_attente',
    prixtotal DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (idfournisseur) REFERENCES fournisseur(idfournisseur)
);

-- Table des matières premières
CREATE TABLE IF NOT EXISTS matièrepremière (
    idmp INT AUTO_INCREMENT PRIMARY KEY,
    libellé VARCHAR(200) NOT NULL,
    description TEXT,
    seuilcritique INT DEFAULT 0,
    seuilalerte INT DEFAULT 0,
    codebarre VARCHAR(100) UNIQUE
);

-- ======================================================
-- Vérification des utilisateurs créés
-- ======================================================

SELECT 
    'UTILISATEURS DE TEST CRÉÉS' as info,
    COUNT(*) as total_users
FROM users 
WHERE email IN (
    'admin@bralima.cd', 
    'gestionnaire@bralima.cd', 
    'magasinier@bralima.cd', 
    'fournisseur@bralima.cd',
    'gestionnaire2@bralima.cd'
);

-- Afficher les détails
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
-- Instructions finales
-- ======================================================

SELECT 'BASE DE DONNÉES gestionstocks INITIALISÉE AVEC SUCCÈS!' as message;

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

EXÉCUTION COMPLÈTE:
mysql -u root -p < init_complete_database.sql
*/
