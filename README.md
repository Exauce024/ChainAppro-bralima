# BRALIMA Supply Chain - Gestion des Matières Premières

Solution digitale pour la gestion de la chaîne d’approvisionnement (Projet Fin d’Études).

## Stack Technique
- **Backend** : Node.js + Express.js
- **Template** : EJS
- **Base de données** : MySQL
- **Auth** : bcrypt + sessions + Magic Link
- **Sécurité** : Helmet, flash messages, transactions

## Modules implémentés
1. Authentification multi-rôles + Magic Link
2. Gestion des Commandes + Emails automatiques
3. Stocks + Réception + Simulation Scan Mobile
4. Tableau de bord Gestionnaire + Alertes prédictives
5. Module Admin (IAM + Audit Logs + Gestion Fournisseurs)

## Installation

# Depuis le dossier du projet

1. npm init -y
2. npm install express ejs mysql2 bcryptjs dotenv express-session helmet nodemailer connect-flash node-cron
3. npm install --save-dev nodemon

# Puis dans MySQL :
   → Créer la base "gestionstock"
   → Exécuter le grand script SQL complet

4. node seed.js

5. npm run dev 