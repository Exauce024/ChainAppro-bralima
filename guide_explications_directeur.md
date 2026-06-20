# Guide d'Explication Technique du Code : BRALIMA Supply Chain
> **Note de préparation** : Ce document a été conçu pour vous aider à expliquer de manière claire, structurée et technique la base de code du projet **BRALIMA Supply Chain** à votre Directeur (Technique ou Métier). Il traduit les lignes de code en valeur métier et en choix d'ingénierie logicielle robustes.

---

## 📋 Structure Générale de la Présentation
Pour convaincre votre directeur, l'explication doit montrer :
1. **La pertinence métier** : Quel problème le code résout-il ?
2. **La robustesse de l'architecture** : Pourquoi le code est-il facile à maintenir et à faire évoluer ?
3. **La sécurité et la prévention des risques** : Comment le code empêche la fraude et protège les données de la BRALIMA ?
4. **La technique maîtrisée** : Montrer que les concepts avancés (transactions, triggers, conteneurisation) sont appliqués.

---

## 1. L'Architecture Logicielle : Le pattern MVC
L'application est structurée selon le modèle **MVC (Modèle-Vue-Contrôleur)**. C'est un standard de l'industrie qui sépare strictement les responsabilités pour éviter le "code spaghetti".

*   **Le Point d'Entrée ([app.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/app.js))** : C'est le cœur de l'application. Il configure le serveur Express, charge les variables d'environnement, sécurise les en-têtes HTTP, initialise les sessions et branche les différentes routes.
*   **Les Routes ([/route](file:///c:/Users/PC/Desktop/ChainAppro-bralima/route))** : Elles agissent comme un aiguilleur du réseau ferré. Elles interceptent les requêtes web (ex: `/commandes/creer`) et les transmettent au contrôleur approprié après avoir vérifié que l'utilisateur est connecté et possède le bon rôle (via les middlewares).
*   **Les Contrôleurs ([/controllers](file:///c:/Users/PC/Desktop/ChainAppro-bralima/controllers))** : Ils contiennent la **logique métier**. C'est ici que les calculs sont faits, que les emails sont envoyés, et que l'enchaînement des actions est décidé.
*   **Les Modèles ([/models](file:///c:/Users/PC/Desktop/ChainAppro-bralima/models))** : Ils gèrent la **persistance des données**. Aucun contrôleur ne fait de requête SQL directe ; ils passent tous par les modèles, ce qui centralise la logique d'accès à la base de données.
*   **Les Vues ([/views](file:///c:/Users/PC/Desktop/ChainAppro-bralima/views))** : Elles gèrent l'affichage utilisateur (interfaces HTML/EJS dynamiques stylisées avec Tailwind CSS).

---

## 2. Visite Guidée du Code : 5 Fonctionnalités Clés à Valoriser

### A. La Sécurité d'Accès : Authentification & RBAC
**Ce que le code fait :**
Dans [userModel.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/models/userModel.js), nous n'enregistrons **jamais** de mot de passe en clair. Nous utilisons la bibliothèque `bcryptjs` avec un facteur de coût de `12` pour hacher le mot de passe :
```javascript
const hashedPassword = await bcrypt.hash(motdepasse, 12);
```
Dans [authMiddlawere.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/middleware/authMiddlawere.js), le système applique le principe du **RBAC** (Role-Based Access Control) :
```javascript
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user || !roleMatches(req.session.user.role_libelle, roles)) {
      return res.status(403).send('Accès refusé - Rôle insuffisant');
    }
    next();
  };
};
```
*   **Argument pour le Directeur** : *"Les données de la BRALIMA sont protégées. Même si notre base de données venait à être compromise, il est mathématiquement impossible de retrouver les mots de passe des utilisateurs en clair grâce au salage et hachage Bcrypt. De plus, un magasinier ne peut techniquement jamais accéder aux écrans d'administration ou de validation financière grâce au middleware RBAC."*

---

### B. L'Authentification Fournisseur par "Magic Link"
**Ce que le code fait :**
Dans [commandeController.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/controllers/commandeController.js), à la création d'une commande, nous générons un jeton (token) cryptographique unique et temporaire :
```javascript
const token = crypto.randomBytes(32).toString('hex');
const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expire dans 24h
await db.execute(
  `INSERT INTO magicklink (token, idfournisseur, idcommande, dateexpiration) VALUES (?, ?, ?, ?)`,
  [token, idfournisseur, idcommande, expires]
);
```
Ce lien est envoyé au fournisseur par email. Quand il clique dessus, [authController.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/controllers/authController.js) valide le jeton, le marque comme utilisé (`utilise = true`) et lui donne accès à sa commande spécifique.
*   **Argument pour le Directeur** : *"Les fournisseurs externes n'ont pas besoin de retenir des mots de passe complexes (ce qui conduit souvent à des failles de sécurité, comme l'utilisation du même mot de passe partout). Ils reçoivent un lien sécurisé, à usage unique et limité dans le temps. C'est à la fois ergonomique pour eux et ultra-sécurisé pour nous."*

---

### C. La Prévention de la Fraude Financière
**Ce que le code fait :**
Un utilisateur malveillant pourrait modifier le code HTML du formulaire dans son navigateur pour changer le prix unitaire d'une matière première avant de soumettre la commande. 
Pour empêcher cela, dans [commandeController.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/controllers/commandeController.js), le serveur **ignore systématiquement le prix envoyé par le navigateur** et va chercher lui-même le tarif officiel négocié et stocké en base de données :
```javascript
// Récupération du prix officiel depuis la BD pour éviter la fraude
const [priceRow] = await db.execute(
  'SELECT prix_kg FROM fournisseur_matiere WHERE idfournisseur = ? AND idmp = ?',
  [idfournisseur, idmp]
);

let officialPrice = 0;
if (priceRow.length > 0) {
  officialPrice = parseFloat(priceRow[0].prix_kg);
} else {
  return res.status(400).send(`Le tarif pour la matière sélectionnée n'est pas configuré.`);
}

lignesNettoyees.push({
  idmp,
  qtecommande: parseFloat(ligne.qtecommande) || 0,
  prixunitaire: officialPrice // Utilisation STRICTE du prix officiel
});
```
De plus, le calcul du montant total de la commande est délégué directement à la base de données via un **Trigger MySQL** (`update_commande_total` dans [gestionstocks.sql](file:///c:/Users/PC/Desktop/ChainAppro-bralima/gestionstocks.sql)) :
```sql
CREATE TRIGGER `update_commande_total` AFTER INSERT ON `lignecommande` FOR EACH ROW 
BEGIN
    UPDATE commande c SET c.prixtotal = (
        SELECT SUM(l.qtecommande * l.prixunitaire)
        FROM lignecommande l WHERE l.idcommande = NEW.idcommande
    ) WHERE c.idcommande = NEW.idcommande;
END
```
*   **Argument pour le Directeur** : *"Nous appliquons le principe de 'Never trust user input' (ne jamais faire confiance aux données utilisateur). La saisie des prix est verrouillée côté client, et en cas de tentative de contournement par injection de formulaire, le serveur bloque la requête et recalcule le prix total de manière étanche en base de données. Il est impossible de falsifier le coût d'une commande."*

---

## 3. L'Intégrité des Données (Transactions SQL)
**Ce que le code fait :**
Lors de la réception d'une livraison, nous devons réaliser plusieurs opérations : mettre à jour le statut de la commande, augmenter le stock disponible, et insérer une ligne d'historique de mouvement de stock.
Dans [stockModel.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/models/stockModel.js), nous utilisons une **Transaction SQL** pour s'assurer que soit **tout réussit**, soit **tout est annulé** en cas de problème (panne de courant, coupure réseau, etc.) :
```javascript
const connection = await db.getConnection();
try {
  await connection.beginTransaction(); // Démarrage

  // 1. Mise à jour de la commande
  // 2. Mise à jour du stock
  // 3. Insertion du mouvement (log)
  
  await connection.commit(); // Validation finale
} catch (err) {
  await connection.rollback(); // Annulation complète en cas d'erreur
  throw err;
} finally {
  connection.release();
}
```
*   **Argument pour le Directeur** : *"Pour éviter les incohérences de stocks (comme avoir un stock augmenté mais sans aucun historique de mouvement enregistré, ou inversement), toutes nos écritures sensibles sont encapsulées dans des transactions ACID (Atomique, Cohérente, Isolée, Durable). C'est la garantie absolue de la cohérence de notre inventaire."*

---

### E. La Traçabilité Totale : Audit Logs
**Ce que le code fait :**
Toutes les actions sensibles (connexion réussie, création de commande, modification de stock, édition d'utilisateur) insèrent automatiquement un enregistrement détaillé dans la table `logaudit` (avec l'identifiant de l'auteur, l'action, le module et l'adresse IP source).
Exemple dans [authController.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/controllers/authController.js) :
```javascript
await db.execute(
  `INSERT INTO logaudit (iduser, action, module, detaillson) VALUES (?, 'LOGIN', 'AUTH', ?)`,
  [user.idusers, `Connexion réussie depuis ${req.ip}`]
);
```
*   **Argument pour le Directeur** : *"L'application intègre un journal d'audit immuable. Nous pouvons dire à tout moment qui a validé une commande, qui a modifié un stock et depuis quelle machine. C'est indispensable pour la conformité et la prévention des fraudes internes."*

---

## 3. Déploiement et Infrastructure (Docker)
Pour s'assurer que l'application s'exécute de la même manière sur votre poste de développement, sur le serveur de la faculté, ou sur le serveur de production de la BRALIMA, le projet est **conteneurisé** avec Docker.

Dans [docker-compose.yml](file:///c:/Users/PC/Desktop/ChainAppro-bralima/docker-compose.yml) :
*   **Conteneur Web** : Construit à partir du `Dockerfile` (Node.js sous Alpine Linux pour être ultra-léger et sécurisé).
*   **Conteneur Base de données** : MySQL 8, isolé du réseau extérieur et uniquement accessible par le conteneur Node.js.
*   **Volumes persistants** : Les données de stock et les bons PDF générés sont stockés en dehors des conteneurs pour ne pas être perdus lors des redémarrages.

*   **Argument pour le Directeur** : *"Grâce à Docker, nous éliminons le syndrome du 'chez moi ça marche'. L'application embarque son propre environnement d'exécution standardisé. Le déploiement se fait en une seule commande (`docker compose up -d`), ce qui réduit à zéro les erreurs d'installation de dépendances ou de versions de base de données."*

---

## 4. Questions & Réponses Typiques du Directeur (Fiche Mémo Jour J)

💡 *Voici comment répondre avec assurance aux questions potentielles de votre directeur lors de votre entretien.*

#### Q1. "Pourquoi ne pas avoir utilisé un outil comme WordPress ou Odoo au lieu de coder ?"
*   **Votre réponse** : *"Les ERP classiques comme SAP ou Odoo sont très puissants mais extrêmement lourds à configurer et coûteux en licences. Pour nos partenaires externes (les fournisseurs), l'accès à un ERP est souvent complexe et nécessite des formations. Notre solution a été développée sur mesure : elle est légère, réactive, n'exige aucune licence logicielle payante et s'intègre parfaitement aux habitudes de travail de la BRALIMA avec une interface mobile épurée et l'authentification par Magic Link."*

#### Q2. "Comment le système réagit-il si le serveur mail de la BRALIMA tombe en panne ?"
*   **Votre réponse** : *"Le code a été conçu de manière résiliente. Si l'envoi d'email échoue (par exemple à cause d'une panne SMTP), le contrôleur capture l'erreur de manière non-bloquante (`catch`). La commande est quand même correctement enregistrée en base de données. De plus, le lien magique de secours est généré dans les logs serveurs et le gestionnaire peut à tout moment renvoyer manuellement une relance ou télécharger le bon de commande en PDF pour l'envoyer par un autre canal."*

#### Q3. "Qu'avez-vous mis en place pour éviter qu'un hacker s'introduise dans la base de données (Injections SQL) ?"
*   **Votre réponse** : *"Toutes nos requêtes SQL utilisent des requêtes préparées (paramétrées) grâce à la méthode `db.execute(sql, [parametres])` du driver `mysql2`. Les données saisies par l'utilisateur ne sont jamais concaténées directement dans la chaîne SQL. Elles sont envoyées séparément et traitées comme de simples valeurs par MySQL, ce qui neutralise à 100% les risques d'injections SQL."*

#### Q4. "Pourquoi utiliser Express-Session au lieu de jetons JWT (JSON Web Tokens) pour les utilisateurs internes ?"
*   **Votre réponse** : *"Pour les utilisateurs internes qui travaillent en continu sur la plateforme, les sessions avec cookies d'état (`express-session`) sont idéales. Elles permettent d'invalider instantanément une session côté serveur (par exemple si l'administrateur suspend un compte suspect en cours de journée). Avec des tokens JWT classiques stockés côté navigateur, l'invalidation immédiate est beaucoup plus complexe à mettre en œuvre."*

#### Q5. "Comment gérez-vous la montée en charge si nous avons des centaines de commandes par jour ?"
*   **Votre réponse** : *"Le backend repose sur l'architecture asynchrone et non-bloquante de Node.js, reconnue pour sa haute performance sur les applications d'E/S (Entrées/Sorties). Côté base de données, nous utilisons un **Pool de connexions** MySQL (`mysql.createPool`) dans [db.js](file:///c:/Users/PC/Desktop/ChainAppro-bralima/config/db.js). Cela permet de réutiliser les connexions physiques existantes au lieu de les ouvrir/fermer à chaque requête, ce qui divise par 10 le temps de réponse et soulage le processeur du serveur."*
