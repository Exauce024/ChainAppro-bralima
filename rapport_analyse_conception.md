# Rapport d'Analyse et de Conception : BRALIMA Supply Chain
## Gestion Numérique de la Chaîne d'Approvisionnement des Matières Premières

Ce document formalise l'analyse des besoins et la conception technique de la solution de gestion d'approvisionnement des matières premières développée pour la **BRALIMA**. Il sert de base de référence pour comprendre le fonctionnement systémique, les flux de données, l'architecture logicielle (MVC en Node.js/Express) et la structure de la base de données MySQL.

---

## 1. Analyse des Besoins

La solution **BRALIMA Supply Chain** répond au besoin critique de suivi en temps réel des stocks de matières premières (malt, houblon, sucre, étiquettes, capsules, etc.), de la gestion automatisée des commandes d'approvisionnement, de la traçabilité des réceptions, et de l'anticipation des ruptures de stock grâce à des alertes prédictives.

### 1.1. Besoins Fonctionnels par Rôle

Le système intègre une gestion des accès basée sur les rôles (**RBAC**) avec 4 profils utilisateurs distincts :

1. **Gestionnaire Supply Chain (Planificateur / Acheteur)** :
   - Gérer les fiches des fournisseurs et des matières premières.
   - Gérer les tarifs associés (relation fournisseur-matière avec prix au kilo).
   - Créer de nouvelles commandes d'approvisionnement en matières premières.
   - Valider ou rejeter les réceptions déclarées par le magasinier.
   - Consulter le tableau de bord global, suivre l'évolution des stocks et analyser les alertes prédictives (seuil d'alerte, seuil critique, risque de péremption).
   
2. **Magasinier (Opérateur de Terrain)** :
   - Visualiser les commandes approuvées ou en cours de livraison.
   - Réceptionner les livraisons (saisie des quantités réelles reçues, numéro de lot, date de péremption).
   - Utiliser la simulation de scan de code-barre mobile pour identifier rapidement une matière première.
   - Effectuer des mouvements de stock manuels (ajustement, transfert entre entrepôts).

3. **Fournisseur (Partenaire Externe)** :
   - Se connecter de manière sécurisée et simplifiée via un **Magic Link** à usage unique envoyé par e-mail (sans gestion fastidieuse de mot de passe).
   - Consulter l'historique et le détail de ses commandes.
   - Confirmer la prise en charge d'une commande et renseigner la date de livraison prévue.

4. **Administrateur Système (IAM & Audit)** :
   - Gérer les comptes utilisateurs (création, activation, suspension, attribution des rôles).
   - Consulter les logs d'audit (historique des actions critiques : suppression, modification, accès sensibles).
   - Configurer les paramètres globaux de l'application (SMTP, devise, seuils système).

---

## 2. Diagramme de Cas d'Utilisation

Le diagramme de cas d'utilisation synthétise les interactions entre les différents acteurs et le système de gestion des stocks.

```mermaid
flowchart LR
    %% Définition des acteurs
    subgraph Acteurs
        direction TB
        Admin["👤 Administrateur"]
        Gest["👤 Gestionnaire Supply Chain"]
        Mag["Magasinier"]
        Fourn["👤 Fournisseur"]
    end

    %% Définition du système et cas d'utilisation
    subgraph Systeme ["Système BRALIMA Supply Chain"]
        direction TB
        %% Auth & IAM
        UC_Auth([S'authentifier / Magic Link])
        UC_User([Gérer les Utilisateurs])
        UC_Audit([Consulter les Logs d'Audit])

        %% Commandes & Fournisseurs
        UC_Cmd_C([Créer une Commande])
        UC_Cmd_V([Valider / Approuver Commande])
        UC_Fourn([Gérer Fournisseurs & Tarifs])
        
        %% Réception & Stock
        UC_Rec([Réceptionner Commande])
        UC_Scan([Scanner Code-Barre])
        UC_Stock([Gérer Mouvements de Stock])
        UC_Alert([Visualiser Dashboard & Alertes])
    end

    %% Raccordement des acteurs aux cas d'utilisation
    Admin --- UC_Auth
    Admin --- UC_User
    Admin --- UC_Audit

    Gest --- UC_Auth
    Gest --- UC_Cmd_C
    Gest --- UC_Cmd_V
    Gest --- UC_Fourn
    Gest --- UC_Stock
    Gest --- UC_Alert

    Mag --- UC_Auth
    Mag --- UC_Rec
    Mag --- UC_Scan
    Mag --- UC_Stock

    Fourn --- UC_Auth
    Fourn --- UC_Cmd_V
    Fourn --- UC_Fourn
```

---

## 3. Tableau des Itérations

Le développement de l'application a été structuré en 3 itérations principales pour assurer des livraisons incrémentales et fonctionnelles.

| Itération | Objectif / Thème | Fonctionnalités Incluses | Priorité | Livrables associés |
| :--- | :--- | :--- | :--- | :--- |
| **Itération 1** | **Fondations, Sécurité & IAM** | - Configuration de la base de données MySQL<br>- Système d'authentification multi-rôle (Session/Bcrypt)<br>- Gestion des comptes utilisateurs (Admin)<br>- Journalisation des actions (Log d'Audit) | Haute | - Schéma SQL de base<br>- Interfaces de connexion & d'administration<br>- Middleware de contrôle des rôles |
| **Itération 2** | **Gestion des Approvisionnements** | - Création des fiches fournisseurs et matières premières<br>- Association Fournisseurs-Matières (tarification au kg)<br>- Cycle de vie des commandes (En attente, Approuvée, Envoyée, Livrée)<br>- Intégration du système de Magic Link pour les fournisseurs<br>- Notifications emails automatiques (Nodemailer) | Haute | - Module commandes (views/controllers)<br>- Générateur de jetons Magic Link<br>- Intégration SMTP de messagerie |
| **Itération 3** | **Gestion des Réceptions, Stocks & IA** | - Réception des commandes (Magasinier)<br>- Simulation du scan de code-barre mobile<br>- Traçabilité des mouvements de stock (Entrées, sorties, transferts)<br>- Tableau de bord analytique et alertes prédictives (Predictive Alerts)<br>- Tâches de fond planifiées (CronJobs pour vérification des périmés) | Moyenne | - Interface mobile-friendly de scan<br>- Graphiques de stock et calculs de prédiction de rupture<br>- Système d'alertes par e-mail et notifications |

---

## 4. Descriptions Textuelles des Cas d'Utilisation

Voici les descriptions textuelles détaillées pour 3 cas d'utilisation critiques de l'application.

### 4.1. Description Textuelle : Connexion via Magic Link (Fournisseur)

| Propriété | Détail |
| :--- | :--- |
| **Identifiant** | UC-AUTH-02 |
| **Nom** | Authentification sécurisée via Magic Link |
| **Acteurs** | **Fournisseur** (Principal), Serveur SMTP de messagerie (Secondaire) |
| **Préconditions** | 1. Le fournisseur est enregistré dans la base de données avec son e-mail officiel.<br>2. Une commande d'approvisionnement lui a été adressée par le Gestionnaire.<br>3. Un email contenant le lien d'accès unique a été envoyé au fournisseur. |
| **Scénario Nominal** | 1. Le fournisseur clique sur le lien d'accès unique reçu par e-mail (`/fournisseur/login-magic/:token`).<br>2. Le système intercepte la requête HTTP GET.<br>3. Le système recherche le jeton (token) dans la table `magicklink`.<br>4. Le système valide que le jeton existe, n'est pas expiré et n'a jamais été utilisé (`utilise = FALSE`).<br>5. Le système marque le jeton comme utilisé (`utilise = TRUE`).<br>6. Le système récupère l'identifiant du fournisseur et crée une session utilisateur active.<br>7. Le système redirige le fournisseur vers son espace dédié (`/fournisseur/dashboard`). |
| **Scénarios Alternatifs** | **4.a. Jeton expiré ou déjà utilisé :**<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Le système détecte que la date d'expiration est dépassée ou que `utilise = TRUE`.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Le système affiche un message d'erreur sur la page de connexion standard : "Lien de connexion expiré ou invalide".<br>&nbsp;&nbsp;&nbsp;&nbsp;3. La session n'est pas créée.<br>**4.b. Jeton non reconnu :**<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Le jeton n'existe pas en base de données.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Le système renvoie une erreur 404 ou redirige vers `/login` avec un message d'alerte. |
| **Postconditions** | En cas de succès, le fournisseur accède à son tableau de bord sans mot de passe. Le jeton devient inutilisable pour toute tentative future. |

### 4.2. Description Textuelle : Création d'une Commande d'Approvisionnement

| Propriété | Détail |
| :--- | :--- |
| **Identifiant** | UC-CMD-01 |
| **Nom** | Créer et envoyer une commande de matières premières |
| **Acteurs** | **Gestionnaire Supply Chain** (Principal), Fournisseur (Secondaire) |
| **Préconditions** | 1. Le gestionnaire est connecté à l'application avec un rôle valide.<br>2. Au moins un fournisseur actif et des matières premières associées existent en base de données. |
| **Scénario Nominal** | 1. Le gestionnaire accède au formulaire de création de commande.<br>2. Le gestionnaire sélectionne un fournisseur actif.<br>3. Le système filtre et affiche les matières premières proposées par ce fournisseur avec les prix au kg négociés.<br>4. Le gestionnaire sélectionne une ou plusieurs matières et saisit la quantité demandée.<br>5. Le gestionnaire saisit la date de livraison prévue souhaitée et valide la commande.<br>6. Le système démarre une transaction en base de données.<br>7. Le système crée un enregistrement dans la table `commande` avec un statut `en_attente` et une référence unique (ex: `CMD-2026-0001`).<br>8. Le système insère les lignes correspondantes dans `lignecommande`. Le trigger de la base de données calcule automatiquement le coût total cumulé.<br>9. Le système génère un jeton Magic Link associé à cette commande pour le fournisseur.<br>10. Le système valide la transaction (Commit) et envoie un e-mail automatique au fournisseur contenant le détail de la commande et son lien de connexion rapide.<br>11. Le système affiche un message flash de confirmation et redirige vers la liste des commandes. |
| **Scénarios Alternatifs** | **4.a. Quantité saisie invalide :**<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Le gestionnaire saisit une quantité négative ou vide.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Le système bloque la validation et affiche un message d'erreur d'entrée.<br>**10.a. Échec de l'envoi de l'e-mail :**<br>&nbsp;&nbsp;&nbsp;&nbsp;1. Le serveur SMTP de l'application est indisponible.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Le système valide tout de même la commande en base, mais affiche un message d'avertissement au gestionnaire : "Commande créée avec succès, mais la notification email n'a pas pu être envoyée". |
| **Postconditions** | La commande est enregistrée avec le statut `en_attente`. Le stock disponible reste inchangé à cette étape. |

### 4.3. Description Textuelle : Réception de Matières Premières par le Magasinier

| Propriété | Détail |
| :--- | :--- |
| **Identifiant** | UC-STOCK-03 |
| **Nom** | Enregistrer la réception physique d'une livraison |
| **Acteurs** | **Magasinier** (Principal), Système de code-barre (Secondaire) |
| **Préconditions** | 1. Le magasinier est authentifié et affecté à un entrepôt spécifique.<br>2. Une commande d'approvisionnement dans l'état `approuvee` ou `en_cours` (ou `envoyee`) est physiquement arrivée sur le quai de déchargement. |
| **Scénario Nominal** | 1. Le magasinier recherche la commande par sa référence ou scanne le code-barre de la matière livrée.<br>2. Le système affiche la liste des matières attendues dans cette commande.<br>3. Pour chaque matière reçue, le magasinier saisit la quantité livrée réelle, le numéro de lot fournisseur et la date de péremption.<br>4. Le magasinier valide la réception de la matière.<br>5. Le système initie une transaction SQL :<br>&nbsp;&nbsp;&nbsp;&nbsp;- Insère une ligne dans `lignereception` avec le statut `confirmee`.<br>&nbsp;&nbsp;&nbsp;&nbsp;- Met à jour le champ `qtelivrée` dans la table `lignecommande` correspondante.<br>&nbsp;&nbsp;&nbsp;&nbsp;- Vérifie si une ligne de stock existe déjà pour ce couple (matière, entrepôt) : si oui, ajoute la quantité reçue à `qtedisponible` ; si non, crée un nouvel enregistrement de stock.<br>&nbsp;&nbsp;&nbsp;&nbsp;- Insère une ligne d'historique dans la table `mouvement_stock` avec le type `entree` et la variation positive (`stock_delta = +quantite`).<br>6. Le système valide la transaction (Commit).<br>7. Si la totalité des matières commandées a été réceptionnée, le statut global de la commande est mis à jour à `livree`. |
| **Scénarios Alternatifs** | **3.a. Écart de quantité (Livraison partielle ou excédentaire) :**<br>&nbsp;&nbsp;&nbsp;&nbsp;1. La quantité reçue est différente de la quantité commandée.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Le magasinier valide la quantité réelle.<br>&nbsp;&nbsp;&nbsp;&nbsp;3. La ligne de commande reste marquée comme partiellement livrée, la commande conserve le statut `en_cours`, et le système génère une alerte prédictive de type "Écart de livraison" pour le Gestionnaire.<br>**5.a. Alerte péremption immédiate :**<br>&nbsp;&nbsp;&nbsp;&nbsp;1. La date de péremption saisie est dépassée ou trop proche de la date actuelle.<br>&nbsp;&nbsp;&nbsp;&nbsp;2. Le système bloque la réception ou génère une alerte critique immédiate. |
| **Postconditions** | Les stocks physiques sont mis à jour en temps réel. Un mouvement d'entrée traçable est enregistré. |

---

## 5. Diagrammes de Séquence

Ces diagrammes décrivent l'ordre chronologique des messages échangés entre les différents objets de l'application Node.js pour les 3 cas d'utilisation décrits ci-dessus.

### 5.1. Diagramme de Séquence 1 : Authentification via Magic Link

```mermaid
sequenceDiagram
    autonumber
    actor F as 👤 Fournisseur (Navigateur)
    participant R as Route (/fournisseur/login-magic/:token)
    participant C as AuthController
    participant DB as Base de Données (MySQL)
    
    F->>R: Clique sur le lien reçu par email (token)
    R->>C: getMagicLinkLogin(req, res)
    
    C->>DB: SELECT * FROM magicklink WHERE token = ?
    DB-->>C: Données du Jeton (expire, utilise, idfournisseur, idcommande)
    
    alt Jeton introuvable ou expiré ou déjà utilisé
        C-->>F: Redirection vers /login avec Message Flash (Erreur)
    else Jeton valide
        C->>DB: UPDATE magicklink SET utilise = TRUE WHERE token = ?
        DB-->>C: Succès
        
        C->>DB: SELECT * FROM users JOIN fournisseur ON email WHERE idfournisseur = ?
        DB-->>C: Infos Profil Fournisseur
        
        C->>C: Initialiser la Session (req.session.user)
        C->>DB: INSERT INTO logaudit (action='connexion', module='auth', detail='Magic Link')
        DB-->>C: Enregistré
        
        C-->>F: Redirection vers /fournisseur/dashboard (Message de bienvenue)
    end
```

### 5.2. Diagramme de Séquence 2 : Création d'une Commande d'Approvisionnement

```mermaid
sequenceDiagram
    autonumber
    actor G as 👤 Gestionnaire (IHM)
    participant R as Route (POST /commandes/creer)
    participant C as CommandeController
    participant DB as Base de Données (MySQL)
    participant M as Service Mail (Nodemailer)

    G->>R: Valide le formulaire (fournisseur, articles, qtés, prix)
    R->>C: createCommande(req, res)
    
    C->>DB: START TRANSACTION
    
    C->>DB: INSERT INTO commande (reference, idfournisseur, statut='en_attente')
    DB-->>C: idcommande généré
    
    loop Pour chaque matière première ajoutée
        C->>DB: INSERT INTO lignecommande (idcommande, idmp, qtecommande, prixunitaire)
        DB-->>C: Succès
        Note over DB: Le trigger SQL met à jour le prix total de la commande
    end
    
    C->>DB: INSERT INTO magicklink (token, idfournisseur, idcommande, dateexpiration)
    DB-->>C: Succès
    
    C->>DB: INSERT INTO logaudit (action='creation_commande', module='commandes', detail='Ref: ...')
    DB-->>C: Succès
    
    C->>DB: COMMIT TRANSACTION
    DB-->>C: Transaction validée (prix total calculé)
    
    C->>DB: SELECT email, raisonsocial FROM fournisseur WHERE idfournisseur = ?
    DB-->>C: Infos Email Fournisseur
    
    C->>M: sendCommandeEmail(email, details, link)
    M-->>C: Email envoyé avec succès
    
    C-->>G: Redirection vers /commandes (Message flash: Succès)
```

### 5.3. Diagramme de Séquence 3 : Réception d'une Commande (Magasinier)

```mermaid
sequenceDiagram
    autonumber
    actor M as 👤 Magasinier (IHM)
    participant R as Route (POST /magasinier/receptionner)
    participant C as StockController
    participant DB as Base de Données (MySQL)

    M->>R: Valide la réception (idcommande, idmp, qtereçu, lot, peremption, entrepot)
    R->>C: receptionnerMatiere(req, res)
    
    C->>DB: START TRANSACTION
    
    C->>DB: INSERT INTO lignereception (idcommande, idmp, qtereçu, attribut, statut='confirmee')
    DB-->>C: idlignerec généré
    
    C->>DB: UPDATE lignecommande SET qtelivrée = qtelivrée + ? WHERE idcommande = ? AND idmp = ?
    DB-->>C: Succès
    
    C->>DB: SELECT * FROM stock WHERE idmp = ? AND identret = ?
    DB-->>C: Ligne de Stock existante (ou NULL)
    
    alt Stock existant pour cette matière dans cet entrepôt
        C->>DB: UPDATE stock SET qtedisponible = qtedisponible + ?, lotnumero = ?, dateperemption = ?
    else Aucun stock existant
        C->>DB: INSERT INTO stock (idmp, identret, qtedisponible, lotnumero, dateperemption, idlignerec)
    end
    DB-->>C: Succès
    
    C->>DB: INSERT INTO mouvement_stock (idstock, type_mouvement='entree', quantite, stock_delta)
    DB-->>C: Succès
    
    C->>DB: INSERT INTO logaudit (action='reception_stock', module='stocks', detail='Qté: ...')
    DB-->>C: Succès
    
    C->>DB: COMMIT TRANSACTION
    DB-->>C: Transaction finalisée
    
    C-->>M: Réponse JSON (Succès de la mise à jour des stocks)
```

---

## 6. Diagrammes de Classe Participantes (MVC / VCE)

Le modèle **Vue-Contrôle-Entité (VCE)** ou Robustesse sépare les classes participantes selon trois stéréotypes :
- **Boundary (Vue / Route)** : Représente les interfaces et les points d'entrée d'URL.
- **Control (Contrôleur)** : Orchestre la logique métier et fait le lien.
- **Entity (Modèle de données)** : Représente les entités persistantes en base de données.

### 6.1. Cas d'utilisation 1 : Authentification Magic Link

```mermaid
classDiagram
    class LoginView {
        <<boundary>>
        login.ejs
        render()
    }
    class MagicLinkRoute {
        <<boundary>>
        GET /fournisseur/login-magic/:token
    }
    class AuthController {
        <<control>>
        authController.js
        getMagicLinkLogin()
    }
    class MagicLinkEntity {
        <<entity>>
        table magicklink
        token : VARCHAR
        dateexpiration : DATETIME
        utilise : BOOLEAN
    }
    class FournisseurEntity {
        <<entity>>
        table fournisseur
        idfournisseur : INT
        email : VARCHAR
    }

    LoginView ..> MagicLinkRoute : Redirige vers
    MagicLinkRoute --> AuthController : Appelle
    AuthController --> MagicLinkEntity : Interroge / Met à jour
    AuthController --> FournisseurEntity : Récupère profil
```

### 6.2. Cas d'utilisation 2 : Création de Commande

```mermaid
classDiagram
    class CommandeCreateView {
        <<boundary>>
        commande/creer.ejs
        saisirDonnees()
    }
    class CommandeRoute {
        <<boundary>>
        POST /commandes/creer
    }
    class CommandeController {
        <<control>>
        commandeController.js
        createCommande()
    }
    class CommandeEntity {
        <<entity>>
        table commande
        idcommande : INT
        reference : VARCHAR
        prixtotal : DECIMAL
        statut : ENUM
    }
    class LigneCommandeEntity {
        <<entity>>
        table lignecommande
        idcommande : INT
        idmp : INT
        qtecommande : INT
        prixunitaire : DECIMAL
    }
    class FournisseurMatiereEntity {
        <<entity>>
        table fournisseur_matiere
        idfournisseur : INT
        idmp : INT
        prix_kg : DECIMAL
    }

    CommandeCreateView ..> CommandeRoute : Soumet formulaire
    CommandeRoute --> CommandeController : Transmet la requête
    CommandeController --> CommandeEntity : Insère entité
    CommandeController --> LigneCommandeEntity : Crée lignes
    CommandeController --> FournisseurMatiereEntity : Consulte tarifs
```

### 6.3. Cas d'utilisation 3 : Réception de Stock

```mermaid
classDiagram
    class ReceptionView {
        <<boundary>>
        magasinier/reception.ejs
        saisirQuantites()
    }
    class StockRoute {
        <<boundary>>
        POST /magasinier/receptionner
    }
    class StockController {
        <<control>>
        stockController.js
        receptionnerMatiere()
    }
    class StockEntity {
        <<entity>>
        table stock
        idstock : INT
        idmp : INT
        qtedisponible : INT
    }
    class MouvementStockEntity {
        <<entity>>
        table mouvement_stock
        idstock : INT
        type_mouvement : ENUM
        quantite : INT
        stock_delta : INT
    }
    class LigneReceptionEntity {
        <<entity>>
        table lignereception
        idlignerec : INT
        qtereçu : INT
    }

    ReceptionView ..> StockRoute : Soumet réception
    StockRoute --> StockController : Transmet
    StockController --> LigneReceptionEntity : Crée
    StockController --> StockEntity : Crée ou Modifie
    StockController --> MouvementStockEntity : Journalise mouvement
```

---

## 7. Diagramme de Classe Global

Le diagramme ci-dessous représente le domaine conceptuel complet de l'application, décrivant la structure des données avec leurs attributs, méthodes principales et cardinalités de relations.

```mermaid
classDiagram
    class Role {
        +int idrole
        +string libellé
        +string description
        +json permissions
    }

    class User {
        +int idusers
        +string nom
        +string prenom
        +string email
        +string motdepasse
        +string telephone
        +string statut
        +datetime datedecreation
        +datetime last_login
        +int role_id
        +string photo
        +login()
        +logout()
        +updateProfile()
    }

    class Fournisseur {
        +int idfournisseur
        +string raisonsocial
        +string libellé
        +string telephone
        +string email
        +string adresse
        +string contact_nom
        +int delai_livraison
        +string statut
        +datetime datecreation
        +create()
        +update()
    }

    class MatierePremiere {
        +int idmp
        +string libellé
        +string description
        +int seuilcritique
        +int seuilalerte
        +string codebarre
        +checkAlerts()
        +getStockLevel()
    }

    class FournisseurMatiere {
        +int idfournisseur
        +int idmp
        +decimal prix_kg
        +datetime datecreation
    }

    class Commande {
        +int idcommande
        +string reference
        +datetime datecreation
        +date deleidellivraison
        +string statut
        +string motifrefus
        +decimal prixtotal
        +int idcreateur
        +int idfournisseur
        +createOrder()
        +approveOrder()
        +cancelOrder()
    }

    class LigneCommande {
        +int idligne
        +int idcommande
        +int idmp
        +int qtecommande
        +decimal prixunitaire
        +int qtelivrée
    }

    class Entrepot {
        +int identret
        +string nom
    }

    class Stock {
        +int idstock
        +int idmp
        +int identret
        +int qtedisponible
        +int qtereserve
        +datetime datemaj
        +string lotnumero
        +date dateperemption
        +int idlignerec
        +updateQty()
    }

    class LigneReception {
        +int idlignerec
        +int idcommande
        +int idmp
        +int qtereçu
        +string attribut
        +string statut
        +string description
    }

    class MouvementStock {
        +int idmouvement
        +int idstock
        +string type_mouvement
        +int quantite
        +int stock_delta
        +int iduser
        +datetime date_mouvement
        +string motif
        +int idcommande
        +int idlignerec
    }

    class AlertePredictive {
        +int idalert
        +int idmp
        +string typealerte
        +string message
        +datetime datecreation
        +string statut
        +string niveauurgence
        +int iduser_traite
        +datetime date_traitement
    }

    class MagicLink {
        +int idtoken
        +string token
        +int idfournisseur
        +int idcommande
        +datetime dateexpiration
        +boolean utilise
    }

    class LogAudit {
        +int idlog
        +int iduser
        +string action
        +string module
        +datetime horodatage
        +string adresse
        +string detaillson
    }

    %% Associations
    User "1" *-- "1" Role : possède
    Commande "0..*" o-- "1" User : créée par
    Commande "0..*" o-- "1" Fournisseur : adressée à
    Commande "1" *-- "1..*" LigneCommande : contient
    LigneCommande "0..*" o-- "1" MatierePremiere : référence
    
    Fournisseur "1" *-- "0..*" FournisseurMatiere : vend
    MatierePremiere "1" *-- "0..*" FournisseurMatiere : est vendue par
    
    Stock "0..*" o-- "1" MatierePremiere : contient
    Stock "0..*" o-- "1" Entrepot : est localisé dans
    Stock "0..*" o-- "0..1" LigneReception : provient de
    
    LigneReception "0..*" o-- "1" Commande : liée à
    LigneReception "0..*" o-- "1" MatierePremiere : concerne
    
    MouvementStock "0..*" o-- "1" Stock : modifie
    MouvementStock "0..*" o-- "0..1" User : enregistré par
    MouvementStock "0..*" o-- "0..1" Commande : suite à
    MouvementStock "0..*" o-- "0..1" LigneReception : suite à
    
    AlertePredictive "0..*" o-- "1" MatierePremiere : concerne
    AlertePredictive "0..*" o-- "0..1" User : résolue par
    
    MagicLink "0..*" o-- "1" Fournisseur : sécurise
    MagicLink "0..*" o-- "0..1" Commande : liée à
    
    LogAudit "0..*" o-- "0..1" User : trace
```

---

## 8. Schéma Physique de la Base de Données

Le schéma de la base de données (modèle physique) formalise les tables MySQL réelles, leurs clés primaires, clés étrangères et les contraintes définies.

### 8.1. Schéma Entité-Association (ERD)

```mermaid
erDiagram
    role {
        INT idrole PK
        VARCHAR libellé UK
        TEXT description
        JSON permissions
    }
    users {
        INT idusers PK
        VARCHAR nom
        VARCHAR prenom
        VARCHAR email UK
        VARCHAR motdepasse
        VARCHAR telephone
        ENUM statut
        DATETIME datedecreation
        DATETIME last_login
        INT role_id FK
        VARCHAR photo
    }
    fournisseur {
        INT idfournisseur PK
        VARCHAR raisonsocial
        VARCHAR libellé
        VARCHAR telephone
        VARCHAR email UK
        TEXT adresse
        VARCHAR contact_nom
        INT delai_livraison
        ENUM statut
        DATETIME datecreation
    }
    matierepremiere {
        INT idmp PK
        VARCHAR libellé
        TEXT description
        INT seuilcritique
        INT seuilalerte
        VARCHAR codebarre UK
    }
    fournisseur_matiere {
        INT idfournisseur PK, FK
        INT idmp PK, FK
        DECIMAL prix_kg
        DATETIME datecreation
    }
    commande {
        INT idcommande PK
        VARCHAR reference UK
        DATETIME datecreation
        DATE deleidellivraison
        ENUM statut
        TEXT motifrefus
        DECIMAL prixtotal
        INT idcreateur FK
        INT idfournisseur FK
    }
    lignecommande {
        INT idligne PK
        INT idcommande FK
        INT idmp FK
        INT qtecommande
        DECIMAL prixunitaire
        INT qtelivrée
    }
    lignereception {
        INT idlignerec PK
        INT idcommande FK
        INT idmp FK
        INT qtereçu
        TEXT attribut
        ENUM statut
        TEXT description
    }
    entrepot {
        INT identret PK
        VARCHAR nom
    }
    stock {
        INT idstock PK
        INT idmp FK
        INT identret FK
        INT qtedisponible
        INT qtereserve
        DATETIME datemaj
        VARCHAR lotnumero
        DATE dateperemption
        INT idlignerec FK
    }
    mouvement_stock {
        INT idmouvement PK
        INT idstock FK
        ENUM type_mouvement
        INT quantite
        INT stock_delta
        INT iduser FK
        DATETIME date_mouvement
        TEXT motif
        INT idcommande FK
        INT idlignerec FK
    }
    alertepredictive {
        INT idalert PK
        INT idmp FK
        ENUM typealerte
        TEXT message
        DATETIME datecreation
        ENUM statut
        ENUM niveauurgence
        INT iduser_traite FK
        DATETIME date_treatment
    }
    magicklink {
        INT idtoken PK
        VARCHAR token UK
        INT idfournisseur FK
        INT idcommande FK
        DATETIME dateexpiration
        BOOLEAN utilise
    }
    logaudit {
        INT idlog PK
        INT iduser FK
        VARCHAR action
        VARCHAR module
        DATETIME horodatage
        VARCHAR adresse
        TEXT detaillson
    }

    role ||--o{ users : "possede"
    users ||--o{ commande : "cree"
    users ||--o{ mouvement_stock : "saisit"
    users ||--o{ alertepredictive : "cloture"
    users ||--o{ logaudit : "initie"
    fournisseur ||--o{ commande : "reçoit"
    fournisseur ||--o{ fournisseur_matiere : "propose"
    fournisseur ||--o{ magicklink : "s'identifie"
    matierepremiere ||--o{ fournisseur_matiere : "est_proposee"
    matierepremiere ||--o{ lignecommande : "concerne"
    matierepremiere ||--o{ lignereception : "concerne"
    matierepremiere ||--o{ stock : "est_stockee"
    matierepremiere ||--o{ alertepredictive : "genere"
    commande ||--|{ lignecommande : "contient"
    commande ||--o{ lignereception : "provoque"
    commande ||--o{ magicklink : "cible"
    commande ||--o{ mouvement_stock : "cause"
    lignereception ||--o{ stock : "alimente"
    lignereception ||--o{ mouvement_stock : "provoque"
    entrepot ||--o{ stock : "heberge"
    stock ||--o{ mouvement_stock : "historise"
```

### 8.2. Description des Tables du Schéma

1. **role** : Contient la liste des rôles applicatifs (`admin`, `gestionnaire`, `fournisseur`, `magasinier`) et leurs configurations de permissions JSON associées.
2. **users** : Contient tous les utilisateurs internes, liés à leur rôle respectif.
3. **fournisseur** : Stocke les coordonnées des partenaires de la BRALIMA ainsi que leurs conditions de livraison.
4. **matierepremiere** : Fiches articles des matières premières avec seuils de réapprovisionnement.
5. **fournisseur_matiere** : Table de jointure avec attribut de prix. Détermine le catalogue de prix unitaire négocié par fournisseur pour chaque matière première.
6. **commande** : Entête de commande d'approvisionnement avec état de flux (`en_attente`, `approuvee`, `refusee`, `annulee`, `en_cours`, `envoyee`, `livree`).
7. **lignecommande** : Lignes d'articles rattachées à une commande, contenant les quantités prévues et livrées à date.
8. **lignereception** : Trace les livraisons physiques validées par les magasiniers.
9. **entrepot** : Entrepôts physiques de stockage (ex: "Entrepôt malt", "Cuves liquides").
10. **stock** : État actuel du stock disponible et réservé par matière première et entrepôt, avec traçabilité de lot/péremption.
11. **mouvement_stock** : Journal immuable des variations de stock (`entree`, `sortie`, `transfert`, `ajustement`) avec calcul de `stock_delta` signé pour les bilans de consommation.
12. **alertepredictive** : Alertes générées automatiquement pour anticiper les anomalies de stock ou de logistique.
13. **magicklink** : Table de stockage des jetons de connexion éphémères pour les fournisseurs tiers.
14. **logaudit** : Journal de sécurité recueillant les requêtes sensibles et actions d'administration.

---
> [!NOTE]
> **Trigger de Base de Données actif** : Un déclencheur MySQL (`update_commande_total`) est configuré pour recalculer automatiquement le `prixtotal` d'une commande à chaque fois qu'une ligne est insérée dans la table `lignecommande`.
