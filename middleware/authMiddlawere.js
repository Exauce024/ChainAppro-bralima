const UserModel = require('../models/userModel');

const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role_libelle)) {
      return res.status(403).send('Accès refusé - Rôle insuffisant');
    }
    next();
  };
};

const redirectByRole = (req, res, next) => {
  if (!req.session.user) return next();

  const role = req.session.user.role_libelle;
  if (role === 'admin') return res.redirect('/admin/dashboard');
  if (role === 'gestionnaire') return res.redirect('/dashboard');
  if (role === 'fournisseur') return res.redirect('/fournisseur/dashboard');
  if (role === 'magasinier') return res.redirect('/magasinier/reception');

  next();
};

module.exports = { isAuthenticated, hasRole, redirectByRole };