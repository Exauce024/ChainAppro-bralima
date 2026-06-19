const fs = require('fs');
const CommandeModel = require('../models/commandeModel');
const db = require('../config/db');
const { normalizeRole } = require('../middleware/authMiddlawere');
const { canConfirmDelivery, normalizeStatut, canDownloadTransportPdf } = require('../utils/commandeStatuts');
const {
  generateBonCommandePdf,
  generateBonLivraisonPdf,
  generateBonTransportPdf,
  getBonCommandePath,
  getBonLivraisonPath,
  getBonTransportPath,
} = require('../utils/bonPdf');

class FournisseurController {
  static async resolveFournisseurId(req) {
    if (req.session.fournisseurId) {
      return req.session.fournisseurId;
    }

    const role = normalizeRole(req.session.user?.role_libelle);
    if (!req.session.user || role !== 'fournisseur') {
      return null;
    }

    if (req.session.user.idfournisseur) {
      req.session.fournisseurId = req.session.user.idfournisseur;
      return req.session.fournisseurId;
    }

    const [matchedFournisseurs] = await db.execute(
      `SELECT idfournisseur FROM fournisseur WHERE email = ? LIMIT 1`,
      [req.session.user.email]
    );

    if (matchedFournisseurs.length > 0) {
      req.session.fournisseurId = matchedFournisseurs[0].idfournisseur;
      return req.session.fournisseurId;
    }

    const [fallbackFournisseurs] = await db.execute(`SELECT idfournisseur FROM fournisseur LIMIT 1`);

    if (fallbackFournisseurs.length > 0) {
      req.session.fournisseurId = fallbackFournisseurs[0].idfournisseur;
      return req.session.fournisseurId;
    }

    return null;
  }

  static async loadCommandeContext(id, idfournisseur) {
    const commande = await CommandeModel.findById(id);
    if (!commande || Number(commande.idfournisseur) !== Number(idfournisseur)) {
      return null;
    }

    const lignes = await CommandeModel.getLignes(id);
    const montant = CommandeModel.computeMontantTotal(lignes);

    return {
      commande: {
        ...commande,
        montant,
        details: commande.details_lignes || commande.details || null,
      },
      lignes,
    };
  }

  static async dashboard(req, res) {
    // Accepter l'authentification via magic link ou via login normal
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);

    if (!idfournisseur) {
      return res.status(403).send('Accès non autorisé. Utilisez un Magic Link ou connectez-vous avec un compte fournisseur.');
    }

    const commandes = await CommandeModel.findByFournisseur(idfournisseur);

    const commandesAvecDocs = commandes.map((c) => ({
      ...c,
      bonTransportDisponible: canDownloadTransportPdf(c.statut),
    }));

    res.render('layout_modern', {
      commandes: commandesAvecDocs,

      user: req.session.user || { role_libelle: 'fournisseur' },
      title: 'Portail Fournisseur',
    });
  }

  static async viewCommande(req, res) {
    const { id } = req.params;
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);

    if (!idfournisseur) {
      return res.status(403).send('Accès non autorisé. Utilisez un Magic Link ou connectez-vous avec un compte fournisseur.');
    }

    const context = await FournisseurController.loadCommandeContext(id, idfournisseur);
    if (!context) {
      return res.status(403).send('Cette commande ne vous appartient pas.');
    }

    res.render('layout_modern', {
      commande: context.commande,
      lignes: context.lignes,
      bonTransportDisponible: canDownloadTransportPdf(context.commande.statut),
      user: req.session.user || { role_libelle: 'fournisseur' },
      title: 'Détails de la Commande',
    });
  }

  static async showConfirmDelivery(req, res) {
    const { id } = req.params;
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);

    if (!idfournisseur) {
      return res.status(403).send('Accès non autorisé.');
    }

    const context = await FournisseurController.loadCommandeContext(id, idfournisseur);
    if (!context) {
      return res.status(403).send('Cette commande ne vous appartient pas.');
    }

    const { commande, lignes } = context;
    const statut = normalizeStatut(commande.statut);

    if (statut === 'livree') {
      req.flash('success', `La commande n°${id} est déjà marquée comme livrée.`);
      return res.redirect(`/fournisseur/commande/${id}`);
    }

    if (!canConfirmDelivery(statut)) {
      req.flash('error', 'Cette commande ne peut pas être marquée comme livrée dans son état actuel.');
      return res.redirect(`/fournisseur/commande/${id}`);
    }

    res.render('layout_modern', {
      commande,
      lignes,
      user: req.session.user || { role_libelle: 'fournisseur' },
      title: 'Confirmer la livraison',
    });
  }

  static async respondToCommande(req, res) {
    const { id } = req.params;
    const { statut, motifrefus } = req.body;
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);

    if (!idfournisseur) {
      return res.status(403).send('Accès non autorisé');
    }

    try {
      const context = await FournisseurController.loadCommandeContext(id, idfournisseur);
      if (!context) {
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

  static async downloadBonCommandePdf(req, res) {
    const { id } = req.params;
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);
    if (!idfournisseur) return res.status(403).send('Accès non autorisé');

    try {
      const context = await FournisseurController.loadCommandeContext(id, idfournisseur);
      if (!context) return res.status(403).send('Cette commande ne vous appartient pas.');

      let filePath;
      try {
        filePath = await generateBonCommandePdf(id);
      } catch (genErr) {
        console.error(genErr);
        return res.status(404).send('Impossible de générer le bon de commande.');
      }
      const ref = context.commande.reference;
      const name = ref ? `${String(ref).replace(/[^\w.-]+/g, '_')}-BC.pdf` : `bon-commande-${id}.pdf`;
      res.download(filePath, name);
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors du téléchargement du bon de commande.');
    }
  }

  static async downloadBonLivraisonPdf(req, res) {
    const { id } = req.params;
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);
    if (!idfournisseur) return res.status(403).send('Accès non autorisé');

    try {
      const context = await FournisseurController.loadCommandeContext(id, idfournisseur);
      if (!context) return res.status(403).send('Cette commande ne vous appartient pas.');

      if (normalizeStatut(context.commande.statut) !== 'livree') {
        return res.status(400).send('Le bon de livraison est disponible une fois la commande livrée.');
      }

      let filePath;
      try {
        filePath = await generateBonLivraisonPdf(id);
      } catch (genErr) {
        console.error(genErr);
        return res.status(404).send('Impossible de générer le bon de livraison.');
      }
      const ref = context.commande.reference;
      const name = ref ? `${String(ref).replace(/[^\w.-]+/g, '_')}-BL.pdf` : `bon-livraison-${id}.pdf`;
      res.download(filePath, name);
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors du téléchargement du bon de livraison.');
    }
  }

  static async downloadBonTransportPdf(req, res) {
    const { id } = req.params;
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);
    if (!idfournisseur) return res.status(403).send('Accès non autorisé');

    try {
      const context = await FournisseurController.loadCommandeContext(id, idfournisseur);
      if (!context) return res.status(403).send('Cette commande ne vous appartient pas.');

      if (!canDownloadTransportPdf(context.commande.statut)) {
        return res
          .status(400)
          .send('Le bon pour le chauffeur n’est pas disponible pour le statut actuel de la commande.');
      }

      let filePath = getBonTransportPath(id);
      try {
        await generateBonTransportPdf(id);
        filePath = getBonTransportPath(id);
      } catch (genErr) {
        console.error(genErr);
        return res.status(404).send(genErr.message || 'Impossible de générer le bon de transport.');
      }

      const ref = context.commande.reference;
      const name = ref
        ? `${String(ref).replace(/[^\w.-]+/g, '_')}-Transport.pdf`
        : `bon-transport-chauffeur-${id}.pdf`;
      res.download(filePath, name);
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors du téléchargement du bon de transport.');
    }
  }

  static async confirmDelivery(req, res) {
    const { id } = req.params;
    const idfournisseur = await FournisseurController.resolveFournisseurId(req);

    try {
      if (!idfournisseur) {
        return res.status(403).send('Accès non autorisé');
      }

      const context = await FournisseurController.loadCommandeContext(id, idfournisseur);
      if (!context) {
        return res.status(403).send('Action non autorisée');
      }

      const statut = normalizeStatut(context.commande.statut);

      if (statut === 'en_cours_de_livraison' || statut === 'livree') {
        const message = 'L\'expédition ou la livraison de cette commande a déjà été confirmée.';
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
          return res.json({ success: true, message });
        }
        req.flash('success', message);
        return res.redirect('/fournisseur/dashboard');
      }

      if (!canConfirmDelivery(statut)) {
        const message = 'Cette commande ne peut pas être expédiée dans son état actuel.';
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
          return res.status(400).json({ success: false, error: message });
        }
        req.flash('error', message);
        return res.redirect(`/fournisseur/commande/${id}`);
      }

      const iduser = req.session.user?.idusers || null;
      await CommandeModel.markAsShipped(id, { iduser });

      // Création des notifications pour le gestionnaire et le magasinier
      try {
        const NotificationModel = require('../models/notificationModel');
        const ref = context.commande.reference || `n°${id}`;
        const fournisseurNom = context.commande.raisonsocial || 'Fournisseur';
        await NotificationModel.create({
          role_libelle: 'gestionnaire',
          titre: 'Commande expédiée',
          description: `La commande ${ref} a été expédiée par le fournisseur ${fournisseurNom}.`
        });
        await NotificationModel.create({
          role_libelle: 'magasinier',
          titre: 'Commande expédiée (en transit)',
          description: `La commande ${ref} de ${fournisseurNom} a été expédiée et est en route pour la réception.`
        });
      } catch (notifErr) {
        console.error('Erreur notification expédition (non bloquante):', notifErr);
      }

      try {
        await generateBonTransportPdf(id);
      } catch (pdfErr) {
        console.error('PDF bon de transport (non bloquant):', pdfErr);
      }

      if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.json({
          success: true,
          message: `Expédition confirmée avec succès. Le bon de transport est généré.`,
        });
      }

      req.flash(
        'success',
        `Expédition de la commande n°${id} confirmée. Le bon de transport pour le transporteur est prêt.`
      );
      return res.redirect('/fournisseur/dashboard');
    } catch (err) {
      console.error('Erreur lors de la confirmation d\'expédition:', err);
      const errorMessage = err.message || 'Erreur lors de la confirmation d\'expédition';
      if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(500).json({ success: false, error: errorMessage });
      }
      req.flash('error', errorMessage);
      return res.redirect(`/fournisseur/commande/${id}/confirm-delivery`);
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
