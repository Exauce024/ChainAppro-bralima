const CommandeModel = require('../models/commandeModel');
const db = require('../config/db');

class FournisseurController {
  static async dashboard(req, res) {
    // Accepter l'authentification via magic link ou via login normal
    let idfournisseur = req.session.fournisseurId;
    
    // Si pas de magic link, vérifier l'authentification normale
    if (!idfournisseur && req.session.user && req.session.user.role_libelle === 'fournisseur') {
      // Pour l'instant, on utilise le premier fournisseur comme fallback
      // TODO: Associer l'utilisateur à un fournisseur spécifique
      const [fournisseurs] = await db.execute(`SELECT idfournisseur FROM fournisseur LIMIT 1`);
      if (fournisseurs.length > 0) {
        idfournisseur = fournisseurs[0].idfournisseur;
      }
    }

    if (!idfournisseur) {
      return res.status(403).send('Accès non autorisé. Utilisez un Magic Link ou connectez-vous avec un compte fournisseur.');
    }

    const commandes = await CommandeModel.findByFournisseur(idfournisseur);

    res.render('layout_modern', {
      commandes,
      user: req.session.user || { role_libelle: 'fournisseur' },
      title: 'Portail Fournisseur',
      success: req.flash('success'),
      error: req.flash('error')
    });
  }

  static async viewCommande(req, res) {
    const { id } = req.params;
    const idfournisseur = req.session.fournisseurId;

    const commande = await CommandeModel.findById(id);

    if (!commande || commande.idfournisseur !== idfournisseur) {
      return res.status(403).send('Cette commande ne vous appartient pas.');
    }

    res.render('layout_modern', { 
      commande,
      user: req.session.user || { role_libelle: 'fournisseur' },
      title: 'Détails de la Commande',
      success: req.flash('success'),
      error: req.flash('error')
    });
  }

  static async respondToCommande(req, res) {
    const { id } = req.params;
    const { statut, motifrefus } = req.body;
    const idfournisseur = req.session.fournisseurId;

    try {
      const commande = await CommandeModel.findById(id);
      if (!commande || commande.idfournisseur !== idfournisseur) {
        return res.status(403).send('Action non autorisée');
      }

      await CommandeModel.updateStatutByFournisseur(id, statut, motifrefus || null);

      req.flash('success', `Commande ${statut === 'approuvee' ? 'approuvée' : 'refusée'} avec succès`);
      res.redirect('/fournisseur/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Erreur lors de la mise à jour');
      res.redirect('/fournisseur/dashboard');
    }
  }

  static async confirmDelivery(req, res) {
    const { id } = req.params;
    const idfournisseur = req.session.fournisseurId;

    try {
      const commande = await CommandeModel.findById(id);
      if (!commande || commande.idfournisseur !== idfournisseur) {
        return res.status(403).json({ success: false, error: 'Action non autorisée' });
      }

      // Mettre à jour le statut à "livree"
      await CommandeModel.updateStatut(id, 'livree');

      res.json({ success: true, message: 'Livraison confirmée avec succès' });
    } catch (err) {
      console.error('Erreur lors de la confirmation de livraison:', err);
      res.status(500).json({ success: false, error: 'Erreur lors de la confirmation de livraison' });
    }
  }

  static async magicAccess(req, res) {
    const { token } = req.query;

    try {
      const [links] = await db.execute(
        `SELECT * FROM magicklink 
         WHERE token = ? 
         AND dateexpiration > NOW() 
         AND utilise = false`,
        [token]
      );

      if (!links.length) {
        req.flash('error', 'Lien invalide, expiré ou déjà utilisé.');
        return res.redirect('/login');
      }

      const magic = links[0];

      // Marquer comme utilisé immédiatement (one-time use strict)
      await db.execute(`UPDATE magicklink SET utilise = true WHERE idtoken = ?`, [magic.idtoken]);

      // Nettoyage optionnel : supprimer les anciens tokens expirés
      await db.execute(`DELETE FROM magicklink WHERE dateexpiration < NOW()`);

      // Session temporaire sécurisée pour le fournisseur
      req.session.fournisseurId = magic.idfournisseur;
      req.session.isMagicLink = true;
      req.session.magicCommandeId = magic.idcommande; // Pour traçabilité

      req.flash('success', 'Accès autorisé. Bienvenue sur votre portail.');
      res.redirect('/fournisseur/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error', 'Erreur lors de l\'accès au lien.');
      res.redirect('/login');
    }
  }
}

module.exports = FournisseurController;