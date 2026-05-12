-- ======================================================
-- SCRIPT SQL COMPLET - BRALIMA Supply Chain (Version corrigée)
-- Exécute ce script en entier
-- ======================================================

CREATE DATABASE IF NOT EXISTS gestionstocks CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE gestionstocks;

-- 1. Tables de base sans dépendances
CREATE TABLE IF NOT EXISTS role (
    idrole INT AUTO_INCREMENT PRIMARY KEY,
    libellé VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON
);

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

CREATE TABLE IF NOT EXISTS matièrepremiere (
    idmp INT AUTO_INCREMENT PRIMARY KEY,
    libellé VARCHAR(200) NOT NULL,
    description TEXT,
    seuilcritique INT DEFAULT 0,
    seuilalerte INT DEFAULT 0,
    codebarre VARCHAR(100) UNIQUE
);

CREATE TABLE IF NOT EXISTS entrepôt (
    identret INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) DEFAULT 'Entrepôt Principal'
);

-- 2. Tables de commandes (avant les réceptions et stocks)
CREATE TABLE IF NOT EXISTS commande (
    idcommande INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(100) UNIQUE NOT NULL,
    datecreation DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleidellivraison DATE,
    statut ENUM('en_attente', 'approuvee', 'refusee', 'annulee', 'livree') DEFAULT 'en_attente',
    motifrefus TEXT,
    prixtotal DECIMAL(15,2) DEFAULT 0,
    idcreateur INT,
    idfournisseur INT,
    FOREIGN KEY (idcreateur) REFERENCES users(idusers) ON DELETE SET NULL,
    FOREIGN KEY (idfournisseur) REFERENCES fournisseur(idfournisseur) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lignecommande (
    idligne INT AUTO_INCREMENT PRIMARY KEY,
    idcommande INT NOT NULL,
    idmp INT NOT NULL,
    qtecommande INT NOT NULL,
    prixunitaire DECIMAL(15,2) NOT NULL,
    qtelivrée INT DEFAULT 0,
    FOREIGN KEY (idcommande) REFERENCES commande(idcommande) ON DELETE CASCADE,
    FOREIGN KEY (idmp) REFERENCES matièrepremiere(idmp) ON DELETE RESTRICT
);

-- 3. Table lignereception (avant stock)
CREATE TABLE IF NOT EXISTS lignereception (
    idlignerec INT AUTO_INCREMENT PRIMARY KEY,
    idcommande INT NULL,
    idmp INT NULL,
    qtereçu INT NOT NULL,
    attribut TEXT,
    statut ENUM('en_attente', 'approuvee', 'refusee', 'confirmee') DEFAULT 'en_attente',
    description TEXT,
    FOREIGN KEY (idcommande) REFERENCES commande(idcommande) ON DELETE SET NULL,
    FOREIGN KEY (idmp) REFERENCES matièrepremiere(idmp) ON DELETE SET NULL
);

-- 4. Table stock (maintenant que toutes les tables référencées existent)
CREATE TABLE IF NOT EXISTS stock (
    idstock INT AUTO_INCREMENT PRIMARY KEY,
    idmp INT NOT NULL,
    identret INT NOT NULL,
    qtedisponible INT DEFAULT 0,
    qtereserve INT DEFAULT 0,
    datemaj DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lotnumero VARCHAR(100),
    dateperemption DATE,
    idlignerec INT NULL,
    FOREIGN KEY (idmp) REFERENCES matièrepremiere(idmp) ON DELETE CASCADE,
    FOREIGN KEY (identret) REFERENCES entrepôt(identret) ON DELETE CASCADE,
    FOREIGN KEY (idlignerec) REFERENCES lignereception(idlignerec) ON DELETE SET NULL,
    UNIQUE KEY unique_mp_entrepot (idmp, identret)
);

-- 5. Autres tables
CREATE TABLE IF NOT EXISTS alertepredictive (
    idalert INT AUTO_INCREMENT PRIMARY KEY,
    idmp INT NOT NULL,
    typealerte ENUM('stock_faible', 'seuil_critique', 'peremption', 'retard_livraison') NOT NULL,
    message TEXT,
    datecreation DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('active', 'traitee', 'ignoree') DEFAULT 'active',
    niveauurgence ENUM('basse', 'moyenne', 'haute', 'critique') DEFAULT 'moyenne',
    iduser_traite INT NULL,
    date_traitement DATETIME NULL,
    FOREIGN KEY (idmp) REFERENCES matièrepremiere(idmp) ON DELETE CASCADE,
    FOREIGN KEY (iduser_traite) REFERENCES users(idusers) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS logaudit (
    idlog INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    horodatage DATETIME DEFAULT CURRENT_TIMESTAMP,
    adresse VARCHAR(255),
    detaillson TEXT,
    FOREIGN KEY (iduser) REFERENCES users(idusers) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS magicklink (
    idtoken INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    idfournisseur INT,
    idcommande INT,
    dateexpiration DATETIME NOT NULL,
    utilise BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (idfournisseur) REFERENCES fournisseur(idfournisseur) ON DELETE CASCADE,
    FOREIGN KEY (idcommande) REFERENCES commande(idcommande) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mouvement_stock (
    idmouvement INT AUTO_INCREMENT PRIMARY KEY,
    idstock INT NOT NULL,
    type_mouvement ENUM('entree', 'sortie', 'transfert', 'ajustement') NOT NULL,
    quantite INT NOT NULL,
    iduser INT NULL,
    date_mouvement DATETIME DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    idcommande INT NULL,
    idlignerec INT NULL,
    FOREIGN KEY (idstock) REFERENCES stock(idstock) ON DELETE CASCADE,
    FOREIGN KEY (iduser) REFERENCES users(idusers) ON DELETE SET NULL,
    FOREIGN KEY (idcommande) REFERENCES commande(idcommande) ON DELETE SET NULL,
    FOREIGN KEY (idlignerec) REFERENCES lignereception(idlignerec) ON DELETE SET NULL
);

-- ======================================================
-- INDEXES
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_commande_statut ON commande(statut);
CREATE INDEX IF NOT EXISTS idx_commande_fournisseur ON commande(idfournisseur);
CREATE INDEX IF NOT EXISTS idx_stock_mp ON stock(idmp);
CREATE INDEX IF NOT EXISTS idx_alerte_statut ON alertepredictive(statut);
CREATE INDEX IF NOT EXISTS idx_log_horodatage ON logaudit(horodatage);

-- ======================================================
-- TRIGGERS (prix total)
-- ======================================================

DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_commande_total
AFTER INSERT ON lignecommande
FOR EACH ROW
BEGIN
    UPDATE commande c SET c.prixtotal = (
        SELECT SUM(l.qtecommande * l.prixunitaire)
        FROM lignecommande l WHERE l.idcommande = NEW.idcommande
    ) WHERE c.idcommande = NEW.idcommande;
END//

DELIMITER ;

-- ======================================================
-- VUE (optionnelle)
-- ======================================================

CREATE OR REPLACE VIEW vue_consommation_moyenne AS
SELECT idmp, ROUND(SUM(qtecommande)/COUNT(*), 2) as conso_moyenne_jour
FROM (
    SELECT lc.idmp, lc.qtecommande 
    FROM lignecommande lc 
    JOIN commande c ON lc.idcommande = c.idcommande 
    WHERE c.statut IN ('livree', 'approuvee')
) daily GROUP BY idmp;

-- ======================================================
-- Insertion des rôles de base
-- ======================================================

INSERT IGNORE INTO role (libellé, description) VALUES
('admin', 'Administrateur système'),
('gestionnaire', 'Gestionnaire Supply Chain'),
('fournisseur', 'Fournisseur'),
('magasinier', 'Magasinier');

SHOW TABLES;