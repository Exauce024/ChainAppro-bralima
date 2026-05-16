const UserModel = require('../models/userModel');

function normalizeRole(role) {
  return String(role || '').toLowerCase().trim();
}

function roleMatches(userRole, allowedRoles) {
  const normalized = normalizeRole(userRole);
  const roleAliases = {
    admin: ['admin', 'administrateur'],
    gestionnaire: ['gestionnaire', 'gestionnaire supply chain'],
    magasinier: ['magasinier'],
    fournisseur: ['fournisseur'],
  };

  return allowedRoles.some((allowed) => {
    const key = normalizeRole(allowed);
    const variants = roleAliases[key] || [key];
    return variants.includes(normalized);
  });
}

const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user || !roleMatches(req.session.user.role_libelle, roles)) {
      return res.status(403).send('Accès refusé - Rôle insuffisant');
    }
    next();
  };
};

const redirectByRole = (req, res, next) => {
  if (!req.session.user) return next();

  const role = normalizeRole(req.session.user.role_libelle);
  if (role === 'admin' || role === 'administrateur') return res.redirect('/admin/dashboard');
  if (role === 'gestionnaire' || role === 'gestionnaire supply chain') return res.redirect('/dashboard');
  if (role === 'fournisseur') return res.redirect('/fournisseur/dashboard');
  if (role === 'magasinier') return res.redirect('/magasinier/dashboard');

  next();
};

module.exports = { isAuthenticated, hasRole, redirectByRole, normalizeRole, roleMatches };
