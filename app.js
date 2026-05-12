require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const flash = require('connect-flash');
const path = require('path');

const authRoutes = require('./route/autRoutes');
const commandeRoutes = require('./route/commandeRoutes');
const stockRoutes = require('./route/stockRoutes');
const dashboardRoutes = require('./route/dashboardRoutes');
const adminRoutes = require('./route/adminRoutes');
const fournisseurRoutes = require('./route/fournisseurRoutes');

const app = express();

// Sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Désactivé pour HTTP local (réseau local)
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 2 // 2 heures
  }
}));

app.use(flash());

// Middleware global pour passer les messages flash et l'utilisateur à toutes les vues
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/commandes', commandeRoutes);
app.use('/magasinier', stockRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);
app.use('/profile', require('./route/profileRoutes'));
app.use('/settings', require('./route/settingsRoutes'));
app.use('/gestionnaire/stocks', require('./route/gestionnaireStockRoutes'));
app.use('/gestionnaire/alertes', require('./route/gestionnaireAlerteRoutes'));
app.use('/matieres', require('./route/matierePremiereRoutes'));

// Après les autres app.use
app.use('/fournisseur', fournisseurRoutes);

app.get('/', (req, res) => res.redirect('/login'));

// 404
app.use((req, res) => {
  res.status(404).render('404-simple');
});

// Gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error('Erreur détaillée:', err);
  console.error('Stack trace:', err.stack);
  console.error('URL:', req.url);
  console.error('Méthode:', req.method);
  res.status(500).send(`Erreur interne du serveur: ${err.message}`);
});

const PORT = process.env.PORT || 9999;
const HOST = process.env.HOST || '0.0.0.0'; // Écoute sur toutes les interfaces réseau
app.listen(PORT, HOST, async () => {
  console.log(`🚀 Serveur BRALIMA Supply Chain démarré sur http://localhost:${PORT}`);
  console.log(`🌐 Accès réseau local: http://${HOST}:${PORT}`);
  console.log('Modules chargés : Auth | Commandes | Stocks | Dashboard | Admin');
});
const CronJobs = require('./utils/cronJobs');
CronJobs.init();