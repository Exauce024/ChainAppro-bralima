-- Ajouter la colonne language à la table users
USE gestionstock;

ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'fr' AFTER email;

-- Vérifier que la colonne a été ajoutée
DESCRIBE users;
