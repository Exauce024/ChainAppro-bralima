-- Ajouter le champ codebarre à la table matièrepremiere
USE gestionstock;

ALTER TABLE matièrepremiere ADD COLUMN codebarre VARCHAR(100) UNIQUE;

-- Vérifier que le champ a été ajouté
DESCRIBE matièrepremiere;
