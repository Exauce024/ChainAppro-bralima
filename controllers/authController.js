const UserModel = require('../models/userModel');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { normalizeRole } = require('../middleware/authMiddlawere');

class AuthController {
  static async showLogin(req, res) {
    res.render('login', { 
      error: null,
      title: 'Connexion',
      success: null
    });
  }

  static async login(req, res) {
    const { email, motdepasse } = req.body;

    try {
      const user = await UserModel.findByEmail(email);
      if (!user || !(await UserModel.verifyPassword(user, motdepasse))) {
        return res.render('login', { error: 'Email ou mot de passe incorrect', title: 'Connexion', success: null });
      }

      if (user.statut !== 'actif') {
        return res.render('login', { error: 'Compte inactif ou suspendu', title: 'Connexion', success: null });
      }

      // Mise à jour dernière connexion
      await UserModel.updateLastLogin(user.idusers);

      // Session
      req.session.user = {
        idusers: user.idusers,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role_libelle: user.role_libelle,
        role_id: user.role_id,
        must_change_password: user.must_change_password || 0
      };

      // Log audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'LOGIN', 'AUTH', ?)`,
        [user.idusers, `Connexion réussie depuis ${req.ip}`]
      );

      // Si l'utilisateur doit changer son mot de passe → redirection forcée
      if (user.must_change_password) {
        return res.redirect('/change-password');
      }

      // Redirection intelligente selon rôle
      const role = normalizeRole(user.role_libelle);
      if (role === 'admin' || role === 'administrateur') return res.redirect('/admin/dashboard');
      if (role === 'gestionnaire' || role === 'gestionnaire supply chain') return res.redirect('/dashboard');
      if (role === 'fournisseur') return res.redirect('/fournisseur/dashboard');
      if (role === 'magasinier') return res.redirect('/magasinier/dashboard');

      res.redirect('/login');
    } catch (err) {
      console.error(err);
      res.render('login', { error: 'Erreur serveur', title: 'Connexion', success: null });
    }
  }

  static async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Erreur lors de la déconnexion:', err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  }

  // Affiche le formulaire de changement de mot de passe
  static async showChangePassword(req, res) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.render('change_password', {
      title: 'Créer votre mot de passe',
      error: null,
      success: null
    });
  }

  // Traite le changement de mot de passe
  static async changePassword(req, res) {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const { nouveau_mot_de_passe, confirmation } = req.body;
    const idusers = req.session.user.idusers;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 8) {
      return res.render('change_password', {
        title: 'Créer votre mot de passe',
        error: 'Le mot de passe doit contenir au moins 8 caractères.',
        success: null
      });
    }

    if (nouveau_mot_de_passe !== confirmation) {
      return res.render('change_password', {
        title: 'Créer votre mot de passe',
        error: 'Les deux mots de passe ne correspondent pas.',
        success: null
      });
    }

    try {
      const hashed = await bcrypt.hash(nouveau_mot_de_passe, 12);
      await db.execute(
        `UPDATE users SET motdepasse = ?, must_change_password = 0 WHERE idusers = ?`,
        [hashed, idusers]
      );

      // Mettre à jour la session
      req.session.user.must_change_password = 0;

      // Log audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) VALUES (?, 'CHANGE_PASSWORD', 'AUTH', ?)`,
        [idusers, 'Mot de passe changé avec succès après connexion temporaire']
      );

      // Redirection selon le rôle
      const role = normalizeRole(req.session.user.role_libelle);
      if (role === 'admin' || role === 'administrateur') return res.redirect('/admin/dashboard');
      if (role === 'gestionnaire' || role === 'gestionnaire supply chain') return res.redirect('/dashboard');
      if (role === 'fournisseur') return res.redirect('/fournisseur/dashboard');
      if (role === 'magasinier') return res.redirect('/magasinier/dashboard');

      res.redirect('/login');
    } catch (err) {
      console.error(err);
      res.render('change_password', {
        title: 'Créer votre mot de passe',
        error: 'Erreur lors de la mise à jour du mot de passe.',
        success: null
      });
    }
  }
}

module.exports = AuthController;
