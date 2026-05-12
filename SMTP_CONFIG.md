# Configuration SMTP Gmail pour Magic Link

## Configuration Gmail App Password

### Étape 1: Activer la 2FA sur votre compte Google
1. Allez sur https://myaccount.google.com/security
2. Activez la "Vérification en deux étapes"
3. Suivez les instructions pour configurer votre téléphone

### Étape 2: Générer un App Password
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Mail" dans la liste des applications
3. Sélectionnez "Autre (Nom personnalisé)" et entrez "BRALIMA Supply Chain"
4. Cliquez sur "Générer"
5. Copiez le mot de passe à 16 caractères (format: xxxx xxxx xxxx xxxx)

### Étape 3: Configurer le fichier .env
Remplacez les placeholders dans le fichier `.env`:

```env
BASE_URL=http://localhost:4000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

**Important:** Pour utiliser votre IP locale ou un domaine de production, modifiez `BASE_URL`:
- Local: `http://localhost:4000`
- Réseau local: `http://192.168.1.XX:4000`
- Production: `https://votre-domaine.com`

## Structure de la table MySQL

La table `magicklink` est déjà créée dans `data.sql`:

```sql
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
```

## Configuration du Transporteur SMTP

Le fichier `utils/mailer.js` contient déjà la configuration optimisée pour Gmail:

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true pour 465, false pour 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

## Route Express pour l'envoi

La route de création de commande (`POST /commandes/create`) dans `controllers/commandeController.js` gère déjà:

1. Génération d'un token unique
2. Enregistrement en base de données avec expiration (24h)
3. Envoi de l'email via SMTP Gmail
4. Le lien Magic Link est construit avec `BASE_URL`

## Tester la configuration

### 1. Vérifier la connexion SMTP
Au démarrage du serveur, vous devriez voir:
```
✅ Serveur SMTP prêt à envoyer des emails
```

Si vous voyez une erreur, vérifiez vos credentials dans `.env`.

### 2. Créer une commande de test
1. Connectez-vous en tant que gestionnaire
2. Créez une nouvelle commande
3. Le Magic Link sera affiché dans la console ET envoyé par email

### 3. Vérifier l'envoi
Dans la console, vous verrez:
```
✅ Magic Link envoyé à fournisseur@email.com
✅ Récapitulatif envoyé à fournisseur@email.com
```

## Dépannage

### Erreur: "Invalid login"
- Vérifiez que vous utilisez un App Password (pas votre mot de passe normal)
- Vérifiez que la 2FA est activée sur votre compte Google

### Erreur: "Self-signed certificate"
- L'option `rejectUnauthorized: false` est déjà configurée dans mailer.js

### Erreur: "Connection timeout"
- Vérifiez que votre pare-feu autorise les connexions sortantes sur le port 587
- Vérifiez votre connexion internet

### Email non reçu
- Vérifiez le dossier Spam/Promotions
- Vérifiez que l'adresse email du fournisseur est correcte dans la base de données

## Sécurité

- **NE JAMAIS** committer le fichier `.env` dans un repository public
- Utilisez toujours des App Passwords pour les applications
- Changez régulièrement vos App Passwords
- Limitez l'accès aux emails de production

## Ports SMTP

- **587 (TLS/STARTTLS)**: Recommandé pour Gmail (port utilisé dans la config)
- **465 (SSL)**: Alternative, changez `secure: true` dans mailer.js
- **25**: Souvent bloqué par les FAI, déconseillé
