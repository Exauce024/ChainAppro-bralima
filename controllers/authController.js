const UserModel = require('../models/userModel');
const db = require('../config/db');
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
        role_id: user.role_id
      };

      // Log audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'LOGIN', 'AUTH', ?)`,
        [user.idusers, `Connexion réussie depuis ${req.ip}`]
      );

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

  // Magic Link verification (pour fournisseurs)
  static async magicAccess(req, res) {
    const { token } = req.query;

    try {
      const [link] = await db.execute(
        `SELECT * FROM magicklink 
         WHERE token = ? AND dateexpiration > NOW() AND utilise = false`,
        [token]
      );

      if (!link.length) {
        return res.status(400).send('Lien invalide ou expiré');
      }

      const magicLink = link[0];

      // Marquer comme utilisé
      await db.execute(`UPDATE magicklink SET utilise = true WHERE idtoken = ?`, [magicLink.idtoken]);

      // Charger la commande et rediriger vers le portail fournisseur
      const [commande] = await db.execute(
        `SELECT * FROM commande WHERE idcommande = ?`,
        [magicLink.idcommande]
      );

      if (!commande.length) return res.status(404).send('Commande non trouvée');

      // Ici on peut mettre en session temporaire pour le fournisseur ou utiliser un token JWT court
      // Pour l'instant : on redirige vers une vue de visualisation commande
      res.render('fournisseur/commande-view', { commande: commande[0] });
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors de l\'accès magic link');
    }
  }
}

module.exports = AuthController;
