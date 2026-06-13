# 1. On utilise une image officielle de Node.js (version 20)
FROM node:20-alpine

# 2. On définit le dossier de travail dans le conteneur
WORKDIR /app

# 3. On copie package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

# 4. On installe uniquement les dépendances nécessaires à la production
RUN npm install --only=production

# 5. On copie tout le reste des fichiers du projet (à l'exclusion de ceux dans .dockerignore s'il existe)
COPY . .

# 6. On indique que l'application tourne sur le port 8000 à l'intérieur du conteneur
EXPOSE 8000

# 7. La commande pour démarrer l'application
CMD ["node", "app.js"]
