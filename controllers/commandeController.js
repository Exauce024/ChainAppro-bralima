const fs = require('fs');
const CommandeModel = require('../models/commandeModel');
const FournisseurModel = require('../models/fournisseurModel');
const MatierePremiereModel = require('../models/matierePremiereModel');
const Mailer = require('../utils/mailer');
const crypto = require('crypto');
const db = require('../config/db');
const { normalizeStatut, canConfirmDelivery } = require('../utils/commandeStatuts');
const {
  generateBonCommandePdf,
  generateBonLivraisonPdf,
  generateBonTransportPdf,
  getBonCommandePath,
  getBonLivraisonPath,
  getBonTransportPath,
} = require('../utils/bonPdf');

class CommandeController {
  static async list(req, res) {
    const commandes = await CommandeModel.findAll();
    res.render('layout_modern', { commandes, user: req.session.user, title: 'Commandes', success: null, error: null });
  }

  static async showCreateForm(req, res) {
    try {
      const fournisseurs = await FournisseurModel.findAll();
      const matieres = await MatierePremiereModel.findAll();
      const [relations] = await db.execute(`
        SELECT fm.idfournisseur, fm.idmp, fm.prix_kg, mp.libellé AS libelle
        FROM fournisseur_matiere fm
        INNER JOIN matièrepremiere mp ON fm.idmp = mp.idmp
      `);
      
      res.render('layout_modern', { 
        fournisseurs, 
        matieres, 
        relations, 
        user: req.session.user, 
        title: 'Créer une nouvelle commande', 
        success: null, 
        error: null 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erreur lors du chargement du formulaire de commande');
    }
  }

  static async create(req, res) {
    try {
      let { reference, deleidellivraison, idfournisseur, lignes } = req.body;
      const idcreateur = req.session.user.idusers;

      // Générer une référence automatiquement si non fournie
      if (!reference || reference.trim() === '') {
        reference = await this.generateReference();
      }

      console.log('Données reçues:', { reference, deleidellivraison, idfournisseur, lignes });

      // Validation simple
      if (!lignes || (Array.isArray(lignes) && lignes.length === 0)) {
        return res.status(400).send('Au moins une ligne de commande est requise');
      }

      // Si lignes n'est pas un tableau, le convertir
      const lignesArray = Array.isArray(lignes) ? lignes : [lignes];

      // Validation et nettoyage des lignes + récupération du prix officiel depuis la BD pour éviter la fraude
      const lignesNettoyees = [];
      for (const ligne of lignesArray) {
        const idmp = parseInt(ligne.idmp);
        if (!idmp) continue;

        // Requête sur fournisseur_matiere pour récupérer le prix officiel
        const [priceRow] = await db.execute(
          'SELECT prix_kg FROM fournisseur_matiere WHERE idfournisseur = ? AND idmp = ?',
          [idfournisseur, idmp]
        );

        let officialPrice = 0;
        if (priceRow.length > 0) {
          officialPrice = parseFloat(priceRow[0].prix_kg);
        } else {
          // Si aucune relation n'existe, on jette une erreur pour prévenir la fraude
          return res.status(400).send(`Le tarif pour la matière sélectionnée (ID: ${idmp}) n'est pas configuré pour ce fournisseur.`);
        }

        lignesNettoyees.push({
          idmp,
          qtecommande: parseFloat(ligne.qtecommande) || 0,
          prixunitaire: officialPrice // Utilisation STRICTE du prix officiel en base de données
        });
      }

      console.log('Lignes nettoyées (prix officiel):', lignesNettoyees);

      const idcommande = await CommandeModel.create({
        reference,
        deleidellivraison,
        idcreateur,
        idfournisseur,
        lignes: lignesNettoyees
      });

      // Création de la notification pour le fournisseur
      try {
        const NotificationModel = require('../models/notificationModel');
        await NotificationModel.create({
          role_libelle: 'fournisseur',
          titre: 'Nouvelle commande d\'approvisionnement',
          description: `Une nouvelle commande (${reference}) a été créée par le gestionnaire. Veuillez confirmer l'expédition.`
        });
      } catch (notifErr) {
        console.error('Erreur notification commande créée (non bloquante):', notifErr);
      }

      /** Bon de commande PDF avant envoi e-mail au fournisseur (classement + pièce jointe) */
      let bonCommandePath = null;
      try {
        bonCommandePath = await generateBonCommandePdf(idcommande);
      } catch (pdfErr) {
        console.error('PDF bon de commande (non bloquant):', pdfErr);
      }

      // E-mail unique fournisseur : récap + lien portail + PJ bon de commande (si PDF OK)
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
      await db.execute(
        `INSERT INTO magicklink (token, idfournisseur, idcommande, dateexpiration) 
         VALUES (?, ?, ?, ?)`,
        [token, idfournisseur, idcommande, expires]
      );

      const magicLinkUrl = `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`}/fournisseur/magic-access?token=${token}`;
      console.log('==========================================');
      console.log('MAGIC LINK POUR FOURNISSEUR:');
      console.log(magicLinkUrl);
      console.log('==========================================');

      const fournisseur = await FournisseurModel.getWithEmail(idfournisseur);
      if (fournisseur && fournisseur.email) {
        try {
          await Mailer.sendNouvelleCommandeFournisseur(fournisseur.email, {
            token,
            idcommande,
            reference,
            bonCommandePdfPath: bonCommandePath,
          });
        } catch (emailErr) {
          console.error('Erreur email (non bloquant):', emailErr);
          console.log('Email non configuré - Magic link disponible dans la console');
        }
      }

      // Log audit
      await db.execute(
        `INSERT INTO logaudit (iduser, action, module, detaillson) 
         VALUES (?, 'CREATE', 'COMMANDE', ?)`,
        [idcreateur, `Commande ${idcommande} créée pour fournisseur ${idfournisseur}`]
      );

      res.redirect('/commandes?success=Commande créée avec succès');
    } catch (err) {
      console.error('Erreur détaillée lors de la création de commande:', err);
      res.status(500).send(`Erreur lors de la création de la commande: ${err.message}`);
    }
  }

  static async detail(req, res) {
    const commande = await CommandeModel.findById(req.params.id);
    if (!commande) return res.status(404).send('Commande non trouvée');
    const lignes = await CommandeModel.getLignes(req.params.id);
    const montant = CommandeModel.computeMontantTotal(lignes);
    const bonTransportDisponible = canConfirmDelivery(commande.statut);

    res.render('layout_modern', {
      commande: { ...commande, montant },
      lignes,
      bonTransportDisponible,
      user: req.session.user,
      title: `Commande n°${commande.idcommande}`,
      success: null,
      error: null,
    });
  }

  static async downloadBonCommandePdf(req, res) {
    try {
      const { id } = req.params;
      let filePath = getBonCommandePath(id);
      if (!fs.existsSync(filePath)) {
        try {
          await generateBonCommandePdf(id);
          filePath = getBonCommandePath(id);
        } catch (genErr) {
          console.error(genErr);
          return res.status(404).send('Impossible de générer le bon de commande.');
        }
      }
      const commande = await CommandeModel.findById(id);
      const fallback = `bon-commande-${id}.pdf`;
      const name =
        commande?.reference &&
        `${String(commande.reference).replace(/[^\w.-]+/g, '_')}-BC.pdf`;
      res.download(filePath, name || fallback);
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors du téléchargement du bon de commande.');
    }
  }

  static async downloadBonLivraisonPdf(req, res) {
    try {
      const { id } = req.params;
      const commande = await CommandeModel.findById(id);
      if (!commande) return res.status(404).send('Commande non trouvée');
      if (normalizeStatut(commande.statut) !== 'livree') {
        return res.status(400).send('Le bon de livraison est disponible uniquement pour une commande livrée.');
      }
      let filePath = getBonLivraisonPath(id);
      if (!fs.existsSync(filePath)) {
        try {
          await generateBonLivraisonPdf(id);
          filePath = getBonLivraisonPath(id);
        } catch (genErr) {
          console.error(genErr);
          return res.status(404).send('Impossible de générer le bon de livraison.');
        }
      }
      const fallback = `bon-livraison-${id}.pdf`;
      const name =
        commande.reference &&
        `${String(commande.reference).replace(/[^\w.-]+/g, '_')}-BL.pdf`;
      res.download(filePath, name || fallback);
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors du téléchargement du bon de livraison.');
    }
  }

  static async downloadBonTransportPdf(req, res) {
    try {
      const { id } = req.params;
      const commande = await CommandeModel.findById(id);
      if (!commande) return res.status(404).send('Commande non trouvée');
      if (!canConfirmDelivery(commande.statut)) {
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

      const fallback = `bon-transport-chauffeur-${id}.pdf`;
      const name =
        commande.reference &&
        `${String(commande.reference).replace(/[^\w.-]+/g, '_')}-Transport.pdf`;
      res.download(filePath, name || fallback);
    } catch (err) {
      console.error(err);
      res.status(500).send('Erreur lors du téléchargement du bon de transport.');
    }
  }

  static async updateStatut(req, res) {
    const { id } = req.params;
    const { statut, motifrefus } = req.body;

    await CommandeModel.updateStatut(id, statut, motifrefus || null);

    await db.execute(
      `INSERT INTO logaudit (iduser, action, module, detaillson) 
       VALUES (?, 'UPDATE_STATUT', 'COMMANDE', ?)`,
      [req.session.user.idusers, `Commande ${id} → ${statut}`]
    );

    res.redirect(`/commandes/${id}`);
  }

  // Générer une référence unique
  static async generateReference() {
    const year = new Date().getFullYear();
    let reference;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const random = Math.floor(Math.random() * 900) + 100; // 3-digit random number
      reference = `CMD-${year}-${random}`;
      
      // Vérifier si la référence existe déjà
      const [existing] = await db.execute(
        'SELECT idcommande FROM commande WHERE reference = ?',
        [reference]
      );
      
      if (existing.length === 0) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Impossible de générer une référence unique après plusieurs tentatives');
    }

    return reference;
  }

  // Relance manuelle
  static async relancer(req, res) {
    try {
      const { id } = req.params;
      const commande = await CommandeModel.findById(id);

      if (commande && (commande.statut === 'en_attente' || commande.statut === 'approuvee')) {
        const fournisseur = await FournisseurModel.getWithEmail(commande.idfournisseur);
        if (fournisseur && fournisseur.email) {
          // Envoi de l'e-mail de relance
          await Mailer.sendMagicLink(fournisseur.email, 'RELANCE-' + Date.now(), commande.idcommande);
        }

        if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.xhr) {
          return res.json({ success: true, message: 'Relance envoyée avec succès' });
        }
        req.flash('success', 'Relance envoyée avec succès au fournisseur.');
        return res.redirect('back');
      } else {
        if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.xhr) {
          return res.status(400).json({ success: false, message: 'La commande ne peut pas être relancée' });
        }
        req.flash('error', 'Cette commande ne peut pas être relancée.');
        return res.redirect('back');
      }
    } catch (err) {
      console.error(err);
      if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.xhr) {
        return res.status(500).json({ success: false, message: err.message });
      }
      req.flash('error', 'Erreur lors de l\'envoi de la relance.');
      return res.redirect('back');
    }
  }
}

module.exports = CommandeController;