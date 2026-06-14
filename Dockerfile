FROM node:20-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier le reste du code source
COPY . .

# Créer le dossier de stockage pour les PDFs et s'assurer que Node a les droits
RUN mkdir -p storage/bons && chown -R node:node /usr/src/app

# Exposer le port interne de l'application
EXPOSE 4000

# Utiliser l'utilisateur non-root par défaut de l'image Node pour la sécurité
USER node

# Commande de démarrage de l'application
CMD ["node", "app.js"]
