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
const {
  formatMoney,
  CURRENCY_CODE,
  CURRENCY_LABEL,
  CURRENCY_SYMBOL,
  CURRENCY_LOCALE,
} = require('./utils/currency');

const app = express();

// Sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.tailwindcss.com",
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: null, // Désactive l'upgrade automatique HTTP -> HTTPS (nécessaire pour l'accès IP brute)
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

// Devise et formatage monétaire (franc congolais) — disponibles dans toutes les vues EJS
app.locals.formatMoney = formatMoney;
app.locals.currencyCode = CURRENCY_CODE;
app.locals.currencyLabel = CURRENCY_LABEL;
app.locals.currencySymbol = CURRENCY_SYMBOL;
app.locals.currencyLocale = CURRENCY_LOCALE;

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
app.use('/notifications', require('./route/notificationRoutes'));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    port: process.env.PORT,
    baseUrl: process.env.BASE_URL,
    time: new Date().toISOString(),
  });
});

app.get('/', (req, res) => res.redirect('/login'));

// 404 — page HTML (évite le message brut "Cannot GET")
app.use((req, res) => {
  res.status(404).render('404-simple', {
    path: req.path,
    title: 'Page non trouvée',
  });
});

// Gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error('Erreur détaillée:', err);
  console.error('Stack trace:', err.stack);
  console.error('URL:', req.url);
  console.error('Méthode:', req.method);
  res.status(500).send(`Erreur interne du serveur: ${err.message}`);
});

const CronJobs = require('./utils/cronJobs');
CronJobs.init();

const { ensureCommandeStatutsEnum } = require('./utils/migrateCommandeStatuts');
const { ensureMouvementStockDeltaColumn } = require('./utils/migrateMouvementStockDelta');
const { ensureFournisseurMatiereTable } = require('./utils/migrateFournisseurMatiere');
const { ensureNotificationTable } = require('./utils/migrateNotifications');
ensureCommandeStatutsEnum();
ensureMouvementStockDeltaColumn();
ensureFournisseurMatiereTable();
ensureNotificationTable();

const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = process.env.IP || '::';

function buildBaseUrl(port) {
  try {
    const url = new URL(process.env.BASE_URL || `http://localhost:${port}`);
    if (url.hostname === '0.0.0.0') {
      url.hostname = 'localhost';
    }
    url.port = String(port);
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    return `http://localhost:${port}`;
  }
}

const server = app.listen(PORT, HOST, () => {
  process.env.PORT = String(PORT);
  process.env.BASE_URL = buildBaseUrl(PORT);

  console.log(`🚀 Serveur BRALIMA Supply Chain démarré sur ${process.env.BASE_URL}`);
  console.log(`🌐 Accès réseau : http://localhost:${PORT}`);
  console.log(`❤️  Santé API : http://localhost:${PORT}/health`);
  console.log('Modules chargés : Auth | Commandes | Stocks | Dashboard | Admin');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé.`);
    console.error('   Arrêtez l\'ancien processus Node puis relancez : npm start');
    console.error(`   Windows : netstat -ano | findstr :${PORT}`);
    console.error('   puis : taskkill /PID <numéro_pid> /F');
    process.exit(1);
  }

  console.error('❌ Impossible de démarrer le serveur:', err.message);
  process.exit(1);
});
