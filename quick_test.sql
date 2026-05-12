-- Test rapide pour vérifier les utilisateurs dans la base de données
USE gestionstocks;

-- Vérifier si la table users existe et contient des données
SELECT 'VÉRIFICATION RAPIDE DE LA BASE gestionstocks' as info;

-- Compter les utilisateurs
SELECT 
    COUNT(*) as total_users,
    (SELECT COUNT(*) FROM users WHERE email = 'admin@bralima.cd') as admin_exists,
    (SELECT COUNT(*) FROM users WHERE email = 'gestionnaire@bralima.cd') as gestionnaire_exists
FROM users;

-- Afficher les 5 premiers utilisateurs s'ils existent
SELECT 
    idusers,
    nom,
    prenom,
    email,
    LEFT(motdepasse, 20) as password_start,
    role_id,
    statut
FROM users 
LIMIT 5;

-- Instructions
SELECT 'Si aucun utilisateur affiché, exécutez: node create_test_users.js' as instruction;
